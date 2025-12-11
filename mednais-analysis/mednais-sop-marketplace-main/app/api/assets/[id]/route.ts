import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
// Auth handled by getCurrentUser
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { createS3Client, getBucketConfig } from "@/lib/aws-s3-config";

const s3Client = createS3Client();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: assetId } = params;
    const { bucketName } = getBucketConfig();

    // Get the object from S3
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: "uploads/" + assetId,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Return the asset with appropriate headers
    const headers = new Headers();
    if (response.ContentType) {
      headers.set("Content-Type", response.ContentType);
    }
    if (response.ContentLength) {
      headers.set("Content-Length", response.ContentLength.toString());
    }
    if (response.LastModified) {
      headers.set("Last-Modified", response.LastModified.toISOString());
    }
    if (response.ETag) {
      headers.set("ETag", response.ETag);
    }

    // Set cache headers for better performance
    headers.set("Cache-Control", "public, max-age=31536000"); // 1 year

    // Return the stream directly
    return new NextResponse(response.Body as ReadableStream, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error serving asset:", error);
    return NextResponse.json(
      { error: "Failed to serve asset" },
      { status: 500 }
    );
  }
}
