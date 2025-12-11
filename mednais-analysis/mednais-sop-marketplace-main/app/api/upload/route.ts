
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
// Auth handled by getCurrentUser
import { uploadFile } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to S3
    const cloudStoragePath = await uploadFile(buffer, file.name);

    // Generate API endpoint URL instead of direct S3 URL
    const url = `/api/assets/${encodeURIComponent(cloudStoragePath)}`;

    return NextResponse.json({ url, cloudStoragePath });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
