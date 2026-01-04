/**
 * Upload Validation Schemas
 * Zod schemas for file upload operations
 */

import { z } from 'zod';

// =============================================================================
// Constants
// =============================================================================

/**
 * Maximum file sizes by type (in bytes)
 */
export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  audio: 50 * 1024 * 1024, // 50MB
  document: 20 * 1024 * 1024, // 20MB
} as const;

/**
 * Allowed MIME types by category
 */
export const ALLOWED_MIME_TYPES = {
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'],
  document: ['application/pdf'],
} as const;

/**
 * All allowed MIME types
 */
export const ALL_ALLOWED_MIME_TYPES = [
  ...ALLOWED_MIME_TYPES.image,
  ...ALLOWED_MIME_TYPES.video,
  ...ALLOWED_MIME_TYPES.audio,
  ...ALLOWED_MIME_TYPES.document,
] as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get file category from MIME type
 */
export function getFileCategory(
  mimeType: string
): 'image' | 'video' | 'audio' | 'document' | null {
  if (ALLOWED_MIME_TYPES.image.includes(mimeType as typeof ALLOWED_MIME_TYPES.image[number])) {
    return 'image';
  }
  if (ALLOWED_MIME_TYPES.video.includes(mimeType as typeof ALLOWED_MIME_TYPES.video[number])) {
    return 'video';
  }
  if (ALLOWED_MIME_TYPES.audio.includes(mimeType as typeof ALLOWED_MIME_TYPES.audio[number])) {
    return 'audio';
  }
  if (ALLOWED_MIME_TYPES.document.includes(mimeType as typeof ALLOWED_MIME_TYPES.document[number])) {
    return 'document';
  }
  return null;
}

/**
 * Get maximum file size for a MIME type
 */
export function getMaxFileSize(mimeType: string): number {
  const category = getFileCategory(mimeType);
  if (!category) return 0;
  return MAX_FILE_SIZES[category];
}

// =============================================================================
// Upload URL Request Schema
// =============================================================================

/**
 * Schema for requesting a presigned upload URL
 */
export const getUploadUrlSchema = z.object({
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .refine(
      (name) => /^[a-zA-Z0-9._-]+$/.test(name.split('/').pop() ?? ''),
      'Invalid filename characters'
    ),
  mimeType: z
    .string()
    .refine(
      (type) => ALL_ALLOWED_MIME_TYPES.includes(type as typeof ALL_ALLOWED_MIME_TYPES[number]),
      'Unsupported file type'
    ),
  size: z
    .number()
    .int()
    .positive()
    .max(100 * 1024 * 1024, 'File too large (max 100MB)'),
});

// =============================================================================
// Confirm Upload Schema
// =============================================================================

/**
 * Schema for confirming an upload and creating attachment record
 */
export const confirmUploadSchema = z.object({
  key: z.string().min(1, 'Storage key is required'),
  filename: z.string().min(1).max(255),
  mimeType: z.string().refine(
    (type) => ALL_ALLOWED_MIME_TYPES.includes(type as typeof ALL_ALLOWED_MIME_TYPES[number]),
    'Unsupported file type'
  ),
  size: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().int().positive().optional(),
  blurhash: z.string().max(100).optional(),
  alt: z.string().max(500).optional(),
});

// =============================================================================
// Delete Attachment Schema
// =============================================================================

/**
 * Schema for deleting an attachment
 */
export const deleteAttachmentSchema = z.object({
  id: z.string().cuid('Invalid attachment ID'),
});

// =============================================================================
// Get Attachment Schema
// =============================================================================

/**
 * Schema for getting an attachment by ID
 */
export const getAttachmentSchema = z.object({
  id: z.string().cuid('Invalid attachment ID'),
});

// =============================================================================
// Link Attachment Schema
// =============================================================================

/**
 * Schema for linking attachments to an activity
 */
export const linkAttachmentsSchema = z.object({
  attachmentIds: z.array(z.string().cuid()).min(1).max(10),
  activityId: z.string().cuid('Invalid activity ID'),
});

// =============================================================================
// Type Exports
// =============================================================================

export type GetUploadUrlInput = z.infer<typeof getUploadUrlSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
export type DeleteAttachmentInput = z.infer<typeof deleteAttachmentSchema>;
export type GetAttachmentInput = z.infer<typeof getAttachmentSchema>;
export type LinkAttachmentsInput = z.infer<typeof linkAttachmentsSchema>;
