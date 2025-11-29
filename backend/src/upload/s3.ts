import {
  S3Client,
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config.js";
import { createWriteStream } from "fs";
import { stat } from "fs/promises";
import { pipeline } from "stream/promises";

const PART_SIZE = 10 * 1024 * 1024; // 10MB

const s3Client = () =>
  new S3Client({
    region: config.s3.region,
    endpoint: config.s3.endpoint,
    forcePathStyle: !!config.s3.endpoint,
    credentials: {
      accessKeyId: config.s3.accessKeyId ?? "",
      secretAccessKey: config.s3.secretAccessKey ?? "",
    },
  });

export const createMultipartUpload = async (key: string, contentType = "application/octet-stream") => {
  if (!config.s3.bucket) {
    throw new Error("S3 bucket not configured");
  }
  const client = s3Client();
  const cmd = new CreateMultipartUploadCommand({
    Bucket: config.s3.bucket,
    Key: key,
    ContentType: contentType,
  });
  const res = await client.send(cmd);
  return res.UploadId ?? "";
};

export const presignPartUrls = async (key: string, uploadId: string, partCount: number) => {
  if (!config.s3.bucket) {
    throw new Error("S3 bucket not configured");
  }
  const client = s3Client();
  const presigned = [];
  for (let partNumber = 1; partNumber <= partCount; partNumber++) {
    const url = await getSignedUrl(
      client,
      {
        Bucket: config.s3.bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        // Dummy command; presigner infers PUT via UploadPartCommand shape, but to avoid extra import we rely on raw params
      } as any,
      { expiresIn: 3600 }
    );
    presigned.push({ partNumber, url });
  }
  return presigned;
};

export const completeMultipartUpload = async (
  key: string,
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[]
) => {
  if (!config.s3.bucket) {
    throw new Error("S3 bucket not configured");
  }
  const client = s3Client();
  const cmd = new CompleteMultipartUploadCommand({
    Bucket: config.s3.bucket,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });
  return client.send(cmd);
};

export const abortMultipartUpload = async (key: string, uploadId: string) => {
  if (!config.s3.bucket) {
    throw new Error("S3 bucket not configured");
  }
  const client = s3Client();
  const cmd = new AbortMultipartUploadCommand({
    Bucket: config.s3.bucket,
    Key: key,
    UploadId: uploadId,
  });
  return client.send(cmd);
};

export const partSizeBytes = PART_SIZE;

export const uploadFile = async (key: string, filePath: string, contentType = "video/mp4") => {
  if (!config.s3.bucket) {
    throw new Error("S3 bucket not configured");
  }
  const client = s3Client();
  const body = await import("fs").then((m) => m.createReadStream(filePath));
  const cmd = new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await client.send(cmd);
  const size = (await stat(filePath)).size;
  return { size };
};

export const downloadToFile = async (key: string, destPath: string) => {
  if (!config.s3.bucket) {
    throw new Error("S3 bucket not configured");
  }
  const client = s3Client();
  const res = await client.send(
    new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    })
  );
  if (!res.Body) {
    throw new Error("No body in S3 object");
  }
  const write = createWriteStream(destPath);
  await pipeline(res.Body as any, write);
  return destPath;
};

export const presignPutObject = async (key: string, contentType = "application/octet-stream", expiresIn = 900) => {
  if (!config.s3.bucket) {
    throw new Error("S3 bucket not configured");
  }
  const client = s3Client();
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn }
  );
  return url;
};
