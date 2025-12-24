import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';

// Next.js 14 App Router config
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const customPrompt = formData.get('customPrompt') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempFilePath = join('/tmp', `upload-${Date.now()}-${file.name}`);
    await writeFile(tempFilePath, buffer);

    console.log(`📄 File uploaded: ${file.name} (${file.type})`);
    
    // Save custom prompt to temp file if provided
    let promptFilePath = '';
    if (customPrompt) {
      promptFilePath = join('/tmp', `prompt-${Date.now()}.txt`);
      await writeFile(promptFilePath, customPrompt);
    }

    // Call Python script to process file with GPT-5
    const result = await new Promise<string>((resolve, reject) => {
      const args = [
        join(process.cwd(), 'scripts', 'process_document.py'),
        tempFilePath,
        file.type || 'application/octet-stream'
      ];
      
      if (promptFilePath) {
        args.push(promptFilePath);
      }
      
      // Use virtual environment python
      const pythonPath = process.env.PYTHON_PATH || '/root/.venv/bin/python';
      const python = spawn(pythonPath, args);

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error('Python stderr:', data.toString());
      });

      python.on('close', async (code) => {
        // Clean up temp files
        try {
          await unlink(tempFilePath);
          if (promptFilePath) {
            await unlink(promptFilePath);
          }
        } catch (err) {
          console.error('Error deleting temp file:', err);
        }

        if (code !== 0) {
          reject(new Error(`Python script failed: ${errorOutput}`));
        } else {
          resolve(output);
        }
      });
    });

    // Parse JSON response from Python script
    const steps = JSON.parse(result);

    return NextResponse.json({
      success: true,
      steps
    });

  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
