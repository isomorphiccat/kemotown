/**
 * Upload Service
 * Handles file uploads to S3-compatible storage (AWS S3, Cloudflare R2)
 *
 * Environment variables:
 * - S3_BUCKET: Bucket name
 * - S3_REGION: AWS region (default: auto for R2)
 * - S3_ENDPOINT: Custom endpoint URL (for R2 or MinIO)
 * - S3_ACCESS_KEY_ID: Access key
 * - S3_SECRET_ACCESS_KEY: Secret key
 * - S3_PUBLIC_URL: Public URL base for accessing files
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { TRPCError } from '@trpc/server';
import { AttachmentType } from '@prisma/client';
import { db } from '@/server/db';
import { getFileCategory, getMaxFileSize } from '@/schemas/upload.schema';

// =============================================================================
// Types
// =============================================================================

interface UploadUrlResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

interface AttachmentData {
  id: string;
  type: AttachmentType;
  mimeType: string;
  url: string;
  thumbnailUrl: string | null;
  filename: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  blurhash: string | null;
  alt: string | null;
}

// =============================================================================
// S3 Client Configuration
// =============================================================================

/**
 * Check if S3 is configured
 */
function isS3Configured(): boolean {
  return !!(
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY
  );
}

/**
 * Create S3 client
 */
function createS3Client(): S3Client | null {
  if (!isS3Configured()) {
    return null;
  }

  return new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    // For R2 and other S3-compatible services
    forcePathStyle: !!process.env.S3_ENDPOINT,
  });
}

/**
 * Get the S3 bucket name
 */
function getBucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Storage not configured',
    });
  }
  return bucket;
}

/**
 * Get the public URL for a storage key
 */
function getPublicUrl(key: string): string {
  const publicBase = process.env.S3_PUBLIC_URL;
  if (publicBase) {
    return `${publicBase.replace(/\/$/, '')}/${key}`;
  }
  // Fallback to S3 URL format
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

// =============================================================================
// Upload Operations
// =============================================================================

/**
 * Generate a presigned URL for direct upload
 */
export async function generateUploadUrl(
  userId: string,
  filename: string,
  mimeType: string,
  size: number
): Promise<UploadUrlResult> {
  // Validate file size
  const maxSize = getMaxFileSize(mimeType);
  if (size > maxSize) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `File size exceeds maximum of ${Math.round(maxSize / 1024 / 1024)}MB`,
    });
  }

  const s3Client = createS3Client();

  // If S3 is not configured, return a placeholder for development
  if (!s3Client) {
    console.warn('S3 not configured, using placeholder upload URL');
    const placeholderKey = `uploads/${userId}/${Date.now()}-${filename}`;
    return {
      uploadUrl: '/api/upload/placeholder', // Placeholder endpoint
      key: placeholderKey,
      publicUrl: `/placeholder/${placeholderKey}`,
    };
  }

  // Generate unique key with user ID and timestamp
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `uploads/${userId}/${timestamp}-${sanitizedFilename}`;

  // Create presigned PUT URL
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: mimeType,
    ContentLength: size,
    // Metadata for tracking
    Metadata: {
      'user-id': userId,
      'original-filename': filename,
    },
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600, // 1 hour
  });

  return {
    uploadUrl,
    key,
    publicUrl: getPublicUrl(key),
  };
}

/**
 * Confirm upload and create attachment record
 */
export async function confirmUpload(
  userId: string,
  input: {
    key: string;
    filename: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    duration?: number;
    blurhash?: string;
    alt?: string;
  }
): Promise<AttachmentData> {
  // Determine attachment type
  const category = getFileCategory(input.mimeType);
  if (!category) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Unsupported file type',
    });
  }

  const attachmentType = category.toUpperCase() as AttachmentType;
  const publicUrl = getPublicUrl(input.key);

  // Create attachment record
  const attachment = await db.attachment.create({
    data: {
      userId,
      type: attachmentType,
      mimeType: input.mimeType,
      url: publicUrl,
      thumbnailUrl: null, // TODO: Generate thumbnails
      filename: input.filename,
      size: input.size,
      width: input.width ?? null,
      height: input.height ?? null,
      duration: input.duration ?? null,
      blurhash: input.blurhash ?? null,
      alt: input.alt ?? null,
    },
  });

  return {
    id: attachment.id,
    type: attachment.type,
    mimeType: attachment.mimeType,
    url: attachment.url,
    thumbnailUrl: attachment.thumbnailUrl,
    filename: attachment.filename,
    size: attachment.size,
    width: attachment.width,
    height: attachment.height,
    duration: attachment.duration,
    blurhash: attachment.blurhash,
    alt: attachment.alt,
  };
}

/**
 * Delete an attachment
 */
export async function deleteAttachment(
  userId: string,
  attachmentId: string
): Promise<{ success: boolean }> {
  // Find attachment
  const attachment = await db.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Attachment not found',
    });
  }

  // Check ownership
  if (attachment.userId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Not authorized to delete this attachment',
    });
  }

  // Delete from S3 if configured
  const s3Client = createS3Client();
  if (s3Client) {
    try {
      // Extract key from URL
      const url = new URL(attachment.url);
      const key = url.pathname.replace(/^\//, '');

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: getBucket(),
          Key: key,
        })
      );
    } catch (error) {
      console.error('Failed to delete from S3:', error);
      // Continue to delete database record even if S3 deletion fails
    }
  }

  // Delete database record
  await db.attachment.delete({
    where: { id: attachmentId },
  });

  return { success: true };
}

/**
 * Get attachment by ID
 */
export async function getAttachment(
  attachmentId: string
): Promise<AttachmentData | null> {
  const attachment = await db.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) {
    return null;
  }

  return {
    id: attachment.id,
    type: attachment.type,
    mimeType: attachment.mimeType,
    url: attachment.url,
    thumbnailUrl: attachment.thumbnailUrl,
    filename: attachment.filename,
    size: attachment.size,
    width: attachment.width,
    height: attachment.height,
    duration: attachment.duration,
    blurhash: attachment.blurhash,
    alt: attachment.alt,
  };
}

/**
 * Link attachments to an activity
 */
export async function linkAttachmentsToActivity(
  userId: string,
  attachmentIds: string[],
  activityId: string
): Promise<{ success: boolean; linked: number }> {
  // Verify all attachments belong to the user and are unlinked
  const attachments = await db.attachment.findMany({
    where: {
      id: { in: attachmentIds },
      userId,
      activityId: null, // Only link unlinked attachments
    },
  });

  if (attachments.length === 0) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'No valid attachments to link',
    });
  }

  // Link attachments to the activity
  await db.attachment.updateMany({
    where: {
      id: { in: attachments.map((a) => a.id) },
    },
    data: {
      activityId,
    },
  });

  return {
    success: true,
    linked: attachments.length,
  };
}

/**
 * Get attachments for an activity
 */
export async function getActivityAttachments(
  activityId: string
): Promise<AttachmentData[]> {
  const attachments = await db.attachment.findMany({
    where: { activityId },
    orderBy: { createdAt: 'asc' },
  });

  return attachments.map((a) => ({
    id: a.id,
    type: a.type,
    mimeType: a.mimeType,
    url: a.url,
    thumbnailUrl: a.thumbnailUrl,
    filename: a.filename,
    size: a.size,
    width: a.width,
    height: a.height,
    duration: a.duration,
    blurhash: a.blurhash,
    alt: a.alt,
  }));
}

/**
 * Clean up orphaned attachments (older than 24 hours without activity)
 */
export async function cleanupOrphanedAttachments(): Promise<{ deleted: number }> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  // Find orphaned attachments
  const orphaned = await db.attachment.findMany({
    where: {
      activityId: null,
      createdAt: { lt: cutoff },
    },
  });

  // Delete from storage
  const s3Client = createS3Client();
  for (const attachment of orphaned) {
    if (s3Client) {
      try {
        const url = new URL(attachment.url);
        const key = url.pathname.replace(/^\//, '');
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: getBucket(),
            Key: key,
          })
        );
      } catch (error) {
        console.error('Failed to delete orphaned attachment from S3:', error);
      }
    }
  }

  // Delete database records
  const result = await db.attachment.deleteMany({
    where: {
      id: { in: orphaned.map((a) => a.id) },
    },
  });

  return { deleted: result.count };
}
