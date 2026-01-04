'use client';

/**
 * AttachmentPreview Component
 * Displays attachments (images, videos, audio) in posts and messages
 */

import { useState } from 'react';
import Image from 'next/image';
import { Play, Volume2, FileText, X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttachmentType } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

interface Attachment {
  id: string;
  type: AttachmentType;
  mimeType: string;
  url: string;
  thumbnailUrl?: string | null;
  filename: string;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  blurhash?: string | null;
  alt?: string | null;
}

interface AttachmentPreviewProps {
  attachments: Attachment[];
  className?: string;
  maxDisplay?: number;
  onImageClick?: (index: number) => void;
}

// =============================================================================
// Main Component
// =============================================================================

export function AttachmentPreview({
  attachments,
  className,
  maxDisplay = 4,
  onImageClick,
}: AttachmentPreviewProps) {
  const [expandedImage, setExpandedImage] = useState<number | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  // Separate by type
  const images = attachments.filter((a) => a.type === 'IMAGE');
  const videos = attachments.filter((a) => a.type === 'VIDEO');
  const audio = attachments.filter((a) => a.type === 'AUDIO');
  const documents = attachments.filter((a) => a.type === 'DOCUMENT');

  const handleImageClick = (index: number) => {
    if (onImageClick) {
      onImageClick(index);
    } else {
      setExpandedImage(index);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Image Grid */}
      {images.length > 0 && (
        <ImageGrid
          images={images.slice(0, maxDisplay)}
          remainingCount={Math.max(0, images.length - maxDisplay)}
          onImageClick={handleImageClick}
        />
      )}

      {/* Videos */}
      {videos.map((video) => (
        <VideoPreview key={video.id} video={video} />
      ))}

      {/* Audio */}
      {audio.map((audioFile) => (
        <AudioPreview key={audioFile.id} audio={audioFile} />
      ))}

      {/* Documents */}
      {documents.map((doc) => (
        <DocumentPreview key={doc.id} document={doc} />
      ))}

      {/* Lightbox for expanded image */}
      {expandedImage !== null && (
        <ImageLightbox
          images={images}
          currentIndex={expandedImage}
          onClose={() => setExpandedImage(null)}
          onNavigate={setExpandedImage}
        />
      )}
    </div>
  );
}

// =============================================================================
// Image Grid
// =============================================================================

interface ImageGridProps {
  images: Attachment[];
  remainingCount: number;
  onImageClick: (index: number) => void;
}

function ImageGrid({ images, remainingCount, onImageClick }: ImageGridProps) {
  const count = images.length;

  // Determine grid layout based on image count
  const getGridClass = () => {
    switch (count) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2';
      case 4:
      default:
        return 'grid-cols-2';
    }
  };

  return (
    <div className={cn('grid gap-2', getGridClass())}>
      {images.map((image, index) => (
        <button
          key={image.id}
          type="button"
          onClick={() => onImageClick(index)}
          className={cn(
            'relative overflow-hidden rounded-xl bg-warm-100 dark:bg-forest-800 cursor-pointer group',
            count === 1 && 'aspect-video',
            count === 2 && 'aspect-square',
            count === 3 && index === 0 && 'row-span-2 aspect-[3/4]',
            count === 3 && index > 0 && 'aspect-square',
            count >= 4 && 'aspect-square'
          )}
        >
          <Image
            src={image.thumbnailUrl || image.url}
            alt={image.alt || image.filename}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            unoptimized
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <Maximize2 className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Remaining count badge */}
          {index === images.length - 1 && remainingCount > 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                +{remainingCount}
              </span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// Video Preview
// =============================================================================

interface VideoPreviewProps {
  video: Attachment;
}

function VideoPreview({ video }: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      <video
        src={video.url}
        poster={video.thumbnailUrl || undefined}
        controls={isPlaying}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="w-full max-h-[500px] object-contain"
      />

      {!isPlaying && (
        <button
          type="button"
          onClick={() => {
            const videoEl = document.querySelector(`video[src="${video.url}"]`) as HTMLVideoElement;
            if (videoEl) {
              videoEl.play();
            }
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
        >
          <div className="rounded-full bg-white/90 p-4">
            <Play className="h-8 w-8 text-forest-800" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Duration badge */}
      {video.duration && !isPlaying && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.duration)}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Audio Preview
// =============================================================================

interface AudioPreviewProps {
  audio: Attachment;
}

function AudioPreview({ audio }: AudioPreviewProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-warm-50 dark:bg-forest-900 rounded-xl border border-warm-200/60 dark:border-forest-800/60">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-forest-100 dark:bg-forest-800 flex items-center justify-center">
        <Volume2 className="h-5 w-5 text-forest-600 dark:text-forest-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-forest-800 dark:text-cream-100 truncate">
          {audio.filename}
        </p>
        {audio.duration && (
          <p className="text-xs text-warm-500 dark:text-warm-400">
            {formatDuration(audio.duration)}
          </p>
        )}
      </div>
      <audio src={audio.url} controls className="h-8" />
    </div>
  );
}

// =============================================================================
// Document Preview
// =============================================================================

interface DocumentPreviewProps {
  document: Attachment;
}

function DocumentPreview({ document }: DocumentPreviewProps) {
  return (
    <a
      href={document.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-warm-50 dark:bg-forest-900 rounded-xl border border-warm-200/60 dark:border-forest-800/60 hover:bg-warm-100 dark:hover:bg-forest-800 transition-colors"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/40 flex items-center justify-center">
        <FileText className="h-5 w-5 text-accent-600 dark:text-accent-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-forest-800 dark:text-cream-100 truncate">
          {document.filename}
        </p>
        <p className="text-xs text-warm-500 dark:text-warm-400">
          {formatFileSize(document.width ?? 0)} {/* width is used for size here as a fallback */}
        </p>
      </div>
    </a>
  );
}

// =============================================================================
// Image Lightbox
// =============================================================================

interface ImageLightboxProps {
  images: Attachment[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const currentImage = images[currentIndex];

  const handlePrev = () => {
    onNavigate(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
  };

  const handleNext = () => {
    onNavigate(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
      >
        <X className="h-8 w-8" />
      </button>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 p-3 text-white/80 hover:text-white bg-black/50 rounded-full transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 p-3 text-white/80 hover:text-white bg-black/50 rounded-full transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Image */}
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <Image
          src={currentImage.url}
          alt={currentImage.alt || currentImage.filename}
          width={currentImage.width || 1200}
          height={currentImage.height || 800}
          className="max-w-full max-h-[90vh] object-contain"
          unoptimized
        />
      </div>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size to human-readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
