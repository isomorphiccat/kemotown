/**
 * Upload Router
 * tRPC endpoints for file upload operations
 */

import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';
import {
  getUploadUrlSchema,
  confirmUploadSchema,
  deleteAttachmentSchema,
  getAttachmentSchema,
  linkAttachmentsSchema,
} from '@/schemas/upload.schema';
import {
  generateUploadUrl,
  confirmUpload,
  deleteAttachment,
  getAttachment,
  linkAttachmentsToActivity,
  getActivityAttachments,
} from '@/server/services/upload.service';
import { z } from 'zod';

export const uploadRouter = createTRPCRouter({
  /**
   * Get presigned URL for direct upload to S3/R2
   */
  getUploadUrl: protectedProcedure
    .input(getUploadUrlSchema)
    .mutation(async ({ ctx, input }) => {
      return generateUploadUrl(
        ctx.session.user.id,
        input.filename,
        input.mimeType,
        input.size
      );
    }),

  /**
   * Confirm upload and create attachment record
   */
  confirmUpload: protectedProcedure
    .input(confirmUploadSchema)
    .mutation(async ({ ctx, input }) => {
      return confirmUpload(ctx.session.user.id, input);
    }),

  /**
   * Delete an attachment
   */
  delete: protectedProcedure
    .input(deleteAttachmentSchema)
    .mutation(async ({ ctx, input }) => {
      return deleteAttachment(ctx.session.user.id, input.id);
    }),

  /**
   * Get attachment by ID
   */
  get: publicProcedure
    .input(getAttachmentSchema)
    .query(async ({ input }) => {
      return getAttachment(input.id);
    }),

  /**
   * Link attachments to an activity
   */
  linkToActivity: protectedProcedure
    .input(linkAttachmentsSchema)
    .mutation(async ({ ctx, input }) => {
      return linkAttachmentsToActivity(
        ctx.session.user.id,
        input.attachmentIds,
        input.activityId
      );
    }),

  /**
   * Get attachments for an activity
   */
  getForActivity: publicProcedure
    .input(z.object({ activityId: z.string().cuid() }))
    .query(async ({ input }) => {
      return getActivityAttachments(input.activityId);
    }),
});
