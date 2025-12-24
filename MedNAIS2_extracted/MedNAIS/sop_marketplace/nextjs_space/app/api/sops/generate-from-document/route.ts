
import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

// Language names for prompts
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ru: "Russian",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  ar: "Arabic",
  hi: "Hindi",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
  uk: "Ukrainian",
};

function getExtractionPrompt(language: string): string {
  const languageName = LANGUAGE_NAMES[language] || "English";
  
  return `Analyze this document and extract a step-by-step instruction (Standard Operating Procedure - SOP).

YOUR TASK:
1. Carefully read the entire document
2. Identify the main goal or process described in the document
3. Extract all key steps needed to achieve this goal
4. Structure steps in logical execution order
5. For each step specify:
   - Short step title (title) - up to 100 characters
   - Detailed description (description) - what exactly needs to be done
   - Estimated execution time in minutes (duration) - realistic estimate

STEP REQUIREMENTS:
- Each step must be specific and actionable
- Steps must be sequential
- Avoid generic phrases, be specific
- If the document contains technical details, preserve them
- Minimum 3 steps, maximum 20 steps
- If document contains multiple procedures, choose the main one

IMPORTANT - OUTPUT LANGUAGE:
- Generate ALL content (title, description, and steps) in ${languageName}
- The entire JSON response must be in ${languageName}
- Adapt terminology and phrasing to be natural in ${languageName}

CRITICAL:
- Respond with ONLY clean JSON without markdown, without code blocks
- Do not add comments or explanations outside JSON
- Strictly follow the specified structure

Return the result in the following JSON format:

{
  "title": "Procedure name (brief, up to 100 characters)",
  "description": "Brief procedure description (1-2 sentences)",
  "steps": [
    {
      "title": "Step 1 title",
      "description": "Detailed description of what needs to be done in this step",
      "duration": 5
    },
    {
      "title": "Step 2 title",
      "description": "Detailed description of what needs to be done in this step",
      "duration": 10
    }
  ]
}

Respond with clean JSON only. Start with { and end with }.`;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Received request for document generation');
    
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const language = (formData.get("language") as string) || "en";

    if (!file) {
      console.error('[API] No file provided');
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log('[API] Processing file:', file.name, 'Type:', file.type, 'Size:', file.size, 'Language:', language);

    const fileName = file.name.toLowerCase();
    let fileContent = "";
    let messages: any[] = [];

    // Get the extraction prompt for the selected language
    const extractionPrompt = getExtractionPrompt(language);

    // Handle different file types
    if (fileName.endsWith(".pdf")) {
      // For PDF files, send directly to LLM with base64 encoding
      const arrayBuffer = await file.arrayBuffer();
      const base64String = Buffer.from(arrayBuffer).toString("base64");
      
      messages = [
        {
          role: "user",
          content: [
            {
              type: "file",
              file: {
                filename: file.name,
                file_data: `data:application/pdf;base64,${base64String}`,
              },
            },
            {
              type: "text",
              text: extractionPrompt,
            },
          ],
        },
      ];
    } else if (fileName.endsWith(".docx")) {
      // For DOCX files, extract text using mammoth
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await mammoth.extractRawText({ buffer });
        fileContent = result.value;
      } catch (error) {
        console.error("Mammoth extraction error:", error);
        return NextResponse.json(
          { error: "Failed to extract text from DOCX file" },
          { status: 500 }
        );
      }

      messages = [
        {
          role: "user",
          content: `Here is the document content:\n\n${fileContent}\n\n${extractionPrompt}`,
        },
      ];
    } else if (fileName.endsWith(".txt")) {
      // For TXT files, read content directly
      fileContent = await file.text();
      messages = [
        {
          role: "user",
          content: `Here is the document content:\n\n${fileContent}\n\n${extractionPrompt}`,
        },
      ];
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT file." },
        { status: 400 }
      );
    }

    // Call LLM API with streaming
    console.log('[API] Calling LLM API...');
    const response = await fetch("https://apps.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: messages,
        stream: true,
        max_tokens: 4000,
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] LLM API error:', response.status, errorText);
      throw new Error(`LLM API error: ${response.statusText}`);
    }
    
    console.log('[API] LLM API response received, starting stream...');

    // Stream the response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";
        let partialRead = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            partialRead += decoder.decode(value, { stream: true });
            let lines = partialRead.split("\n");
            partialRead = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  try {
                    console.log('[API] Stream done, parsing final buffer:', buffer.substring(0, 100));
                    const finalResult = JSON.parse(buffer);
                    console.log('[API] Final result parsed successfully:', finalResult);
                    const finalData = JSON.stringify({
                      status: "completed",
                      result: finalResult,
                    });
                    controller.enqueue(
                      encoder.encode(`data: ${finalData}\n\n`)
                    );
                  } catch (e) {
                    console.error("[API] Error parsing final JSON:", e);
                    console.error("[API] Buffer content:", buffer);
                    const errorData = JSON.stringify({
                      status: "error",
                      message: "Failed to parse generated steps",
                    });
                    controller.enqueue(
                      encoder.encode(`data: ${errorData}\n\n`)
                    );
                  }
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  buffer += parsed.choices?.[0]?.delta?.content || "";
                  const progressData = JSON.stringify({
                    status: "processing",
                    message: "Generating steps from document...",
                  });
                  controller.enqueue(
                    encoder.encode(`data: ${progressData}\n\n`)
                  );
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          const errorData = JSON.stringify({
            status: "error",
            message: "Stream processing failed",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Error generating steps:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate steps from document" },
      { status: 500 }
    );
  }
}
