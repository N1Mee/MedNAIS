
import { NextRequest, NextResponse } from "next/server";
import { downloadFile } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const filename = searchParams.get("filename");

    if (!key) {
      return NextResponse.json({ error: "No key provided" }, { status: 400 });
    }

    const signedUrl = await downloadFile(key);

    // Return the signed URL as JSON with no-cache headers
    // This ensures fresh signed URLs are always generated
    return NextResponse.json({ 
      success: true, 
      url: signedUrl,  // Use 'url' for backward compatibility
      downloadUrl: signedUrl,
      filename: filename || "download"
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
