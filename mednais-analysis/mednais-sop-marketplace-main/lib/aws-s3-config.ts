
import { S3Client } from "@aws-sdk/client-s3";

export function getBucketConfig() {
  return {
    bucketName: process.env.AWS_S3_BUCKET_NAME,
    folderPrefix: process.env.AWS_S3_FOLDER_PREFIX || ""
  };
}

function createClientConfig() {
  return {
    endpoint: process.env.AWS_S3_ENDPOINT,
    region: process.env.AWS_S3_REGION,
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  }
}

export function createS3Client() {
  const {
    endpoint,
    region,
    accessKeyId = "",
    secretAccessKey = ""
  } = createClientConfig()

  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    forcePathStyle: true
  });
}
