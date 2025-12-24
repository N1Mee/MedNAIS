
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, getBucketConfig } from "./aws-s3-config";
import { randomUUID } from "uncrypto"
import { join as joinPath } from "node:path"

const s3Client = createS3Client();

export function getKey(imageId: string) {
  const { folderPrefix } = getBucketConfig();
  return joinPath(folderPrefix, "uploads", imageId)
}

export async function uploadFile(buffer: Buffer, fileName: string): Promise<string> {
  const { bucketName } = getBucketConfig();
  const imageId = `${ Date.now() }-${ randomUUID() }`
  const key = getKey(imageId)
  
  try {
    await s3Client.send(
      new PutObjectCommand({
        ACL: "private",
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: getContentType(fileName),
      })
    );
    return imageId;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
  }
}

export async function downloadFile(key: string): Promise<string> {
  const { bucketName } = getBucketConfig();
  
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error("Error generating download URL:", error);
    throw new Error("Failed to generate download URL");
  }
}

export async function deleteFile(key: string): Promise<void> {
  const { bucketName } = getBucketConfig();
  
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error("Failed to delete file");
  }
}

function getContentType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}
