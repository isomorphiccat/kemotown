/**
 * ImageUpload Component
 * Image upload with preview and S3/R2 integration
 */

'use client';

import * as React from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

// =============================================================================
// Types
// =============================================================================

interface UploadedAttachment {
  id: string;
  url: string;
  filename: string;
  width?: number;
  height?: number;
}

interface ImageUploadProps {
  /** Current attachment value */
  value?: UploadedAttachment | null;
  /** Called when attachment changes (uploaded or removed) */
  onChange: (attachment: UploadedAttachment | null) => void;
  /** Additional CSS classes */
  className?: string;
  /** Maximum file size in MB (default: 10) */
  maxSize?: number;
  /** Aspect ratio for the preview (e.g., "16/9") */
  aspectRatio?: string;
  /** Whether upload is disabled */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function ImageUpload({
  value,
  onChange,
  className,
  maxSize = 10,
  aspectRatio,
  disabled = false,
}: ImageUploadProps) {
  const [preview, setPreview] = React.useState<string | null>(value?.url || null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // tRPC mutations
  const getUploadUrl = trpc.upload.getUploadUrl.useMutation();
  const confirmUpload = trpc.upload.confirmUpload.useMutation();
  const deleteAttachment = trpc.upload.delete.useMutation();

  /**
   * Handle file selection and upload
   */
  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`파일 크기는 ${maxSize}MB 이하여야 합니다.`);
      return;
    }

    // Create preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Start upload process
    setIsUploading(true);

    try {
      // Get image dimensions
      const dimensions = await getImageDimensions(file);

      // 1. Get presigned URL
      const { uploadUrl, key } = await getUploadUrl.mutateAsync({
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      });

      // 2. Upload directly to S3/R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      // 3. Confirm upload and create attachment record
      const attachment = await confirmUpload.mutateAsync({
        key,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        width: dimensions.width,
        height: dimensions.height,
      });

      // 4. Update state
      setPreview(attachment.url);
      onChange({
        id: attachment.id,
        url: attachment.url,
        filename: attachment.filename,
        width: attachment.width ?? undefined,
        height: attachment.height ?? undefined,
      });
    } catch (err) {
      console.error('Upload failed:', err);
      setError('업로드에 실패했습니다. 다시 시도해주세요.');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle drop
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle remove
   */
  const handleRemove = async () => {
    if (value?.id) {
      try {
        await deleteAttachment.mutateAsync({ id: value.id });
      } catch (err) {
        console.error('Failed to delete attachment:', err);
      }
    }

    setPreview(null);
    setError(null);
    onChange(null);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {preview ? (
        <div className="relative group">
          <div
            className={cn(
              'relative overflow-hidden rounded-xl border border-warm-200/60 dark:border-forest-800/60 bg-warm-50 dark:bg-forest-900',
              aspectRatio && `aspect-[${aspectRatio}]`
            )}
          >
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
          {!disabled && !isUploading && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-lg"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'relative cursor-pointer rounded-xl border-2 border-dashed transition-colors',
            isDragging
              ? 'border-forest-500 bg-forest-50 dark:bg-forest-900/50'
              : 'border-warm-300 dark:border-forest-700 hover:border-forest-400 dark:hover:border-forest-600',
            disabled && 'opacity-50 cursor-not-allowed',
            aspectRatio ? `aspect-[${aspectRatio}]` : 'min-h-[200px]'
          )}
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !isUploading) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="rounded-2xl bg-forest-100 dark:bg-forest-800 p-4">
              {isUploading ? (
                <Loader2 className="h-6 w-6 text-forest-600 dark:text-forest-400 animate-spin" />
              ) : isDragging ? (
                <Upload className="h-6 w-6 text-forest-600 dark:text-forest-400" />
              ) : (
                <ImageIcon className="h-6 w-6 text-forest-500 dark:text-forest-400" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-forest-700 dark:text-forest-300 font-korean">
                {isUploading
                  ? '업로드 중...'
                  : isDragging
                  ? '여기에 놓으세요'
                  : '이미지를 업로드하세요'}
              </p>
              <p className="text-xs text-warm-500 dark:text-warm-400 font-korean">
                클릭하거나 드래그하여 업로드 (최대 {maxSize}MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="font-korean">{error}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get image dimensions from a file
 */
function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}
