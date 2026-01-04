/**
 * Application Constants
 * Centralized configuration values
 */

// App metadata
export const APP_NAME = 'Kemotown';
export const APP_DESCRIPTION = '한국 퍼리 커뮤니티를 위한 특별한 공간';
export const APP_URL = process.env.NEXTAUTH_URL || 'https://kemo.town';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Content limits
export const MAX_POST_LENGTH = 500;
export const MAX_COMMENT_LENGTH = 1000;
export const MAX_BIO_LENGTH = 500;
export const MAX_EVENT_DESCRIPTION_LENGTH = 10000;
export const MAX_USERNAME_LENGTH = 30;
export const MIN_USERNAME_LENGTH = 3;

// Timeline
export const TIMELINE_POLL_INTERVAL = 30000; // 30 seconds fallback
export const SSE_HEARTBEAT_INTERVAL = 15000; // 15 seconds

// Reactions
export const AVAILABLE_REACTIONS = ['thumbsup', 'heart', 'laugh', 'wow', 'sad'] as const;
export type ReactionType = (typeof AVAILABLE_REACTIONS)[number];

export const REACTION_EMOJI_MAP: Record<ReactionType, string> = {
  thumbsup: '👍',
  heart: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
};

// Event status colors
export const EVENT_STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
} as const;

// RSVP status colors
export const RSVP_STATUS_COLORS = {
  ATTENDING: 'bg-green-100 text-green-800',
  CONSIDERING: 'bg-yellow-100 text-yellow-800',
  NOT_ATTENDING: 'bg-red-100 text-red-800',
  WAITLISTED: 'bg-purple-100 text-purple-800',
} as const;

// Korean labels for statuses
export const EVENT_STATUS_LABELS = {
  DRAFT: '초안',
  PUBLISHED: '공개',
  CANCELLED: '취소됨',
  COMPLETED: '완료',
} as const;

export const RSVP_STATUS_LABELS = {
  ATTENDING: '참가',
  CONSIDERING: '고려중',
  NOT_ATTENDING: '불참',
  WAITLISTED: '대기',
} as const;

// Bot types
export const BOT_TYPE_LABELS = {
  SYSTEM: '시스템',
  WELCOME: '환영봇',
  EVENT_NOTIFY: '이벤트 알림',
  EVENT_MOD: '이벤트 관리',
} as const;

// Social link types
export const SOCIAL_LINK_TYPES = [
  { key: 'twitter', label: 'Twitter/X', icon: 'twitter' },
  { key: 'telegram', label: 'Telegram', icon: 'telegram' },
  { key: 'discord', label: 'Discord', icon: 'discord' },
  { key: 'furaffinity', label: 'FurAffinity', icon: 'furaffinity' },
  { key: 'instagram', label: 'Instagram', icon: 'instagram' },
  { key: 'website', label: '웹사이트', icon: 'globe' },
] as const;

// Interest tags (predefined options)
export const INTEREST_TAGS = [
  '퍼슈트',
  '일러스트',
  '게임',
  '음악',
  '사진',
  '영상',
  'VR',
  '온라인',
  '오프라인',
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
] as const;

// Species options
export const SPECIES_OPTIONS = [
  '늑대',
  '여우',
  '고양이',
  '개',
  '토끼',
  '용',
  '새',
  '뱀',
  '호랑이',
  '사자',
  '곰',
  '너구리',
  '다람쥐',
  '하이에나',
  '기타',
] as const;
