
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

    // Redirect to the signed URL for direct download
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
