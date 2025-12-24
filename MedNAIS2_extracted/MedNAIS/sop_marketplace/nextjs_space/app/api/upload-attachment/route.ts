
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { uploadFile } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type - Allow documents and images
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, and images." },
        { status: 400 }
      );
    }

    // Validate file size (10MB max for documents)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    const cloud_storage_path = await uploadFile(buffer, file.name);

    return NextResponse.json({
      cloud_storage_path,
      name: file.name,
      size: file.size,
      type: file.type,
      message: "Attachment uploaded successfully",
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload attachment" },
      { status: 500 }
    );
  }
}
