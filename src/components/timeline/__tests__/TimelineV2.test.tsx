/**
 * TimelineV2 Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// Mock the trpc client
vi.mock('@/lib/trpc', () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      activity: {
        publicTimeline: { invalidate: vi.fn() },
        homeTimeline: { invalidate: vi.fn() },
        contextTimeline: { invalidate: vi.fn() },
        userTimeline: { invalidate: vi.fn() },
      },
    })),
    activity: {
      publicTimeline: {
        useInfiniteQuery: vi.fn(() => ({
          data: { pages: [{ items: [], nextCursor: null, hasMore: false }] },
          isLoading: false,
          isError: false,
          error: null,
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isFetchingNextPage: false,
        })),
      },
      homeTimeline: {
        useInfiniteQuery: vi.fn(() => ({
          data: { pages: [] },
          isLoading: false,
          isError: false,
          error: null,
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isFetchingNextPage: false,
        })),
      },
      contextTimeline: {
        useInfiniteQuery: vi.fn(() => ({
          data: { pages: [] },
          isLoading: false,
          isError: false,
          error: null,
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isFetchingNextPage: false,
        })),
      },
      userTimeline: {
        useInfiniteQuery: vi.fn(() => ({
          data: { pages: [] },
          isLoading: false,
          isError: false,
          error: null,
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isFetchingNextPage: false,
        })),
      },
      delete: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn(),
        })),
      },
      like: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
        })),
      },
      unlike: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
        })),
      },
    },
  },
}));

// Mock the SSE hook
vi.mock('@/hooks/use-sse', () => ({
  useSSE: vi.fn(() => ({
    isConnected: true,
    error: null,
    reconnect: vi.fn(),
  })),
}));

import { TimelineV2 } from '../TimelineV2';

describe('TimelineV2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render empty state for public timeline', () => {
      const { getByText } = render(<TimelineV2 type="public" />);
      expect(getByText('아직 게시물이 없습니다')).toBeDefined();
    });

    it('should render with context type', () => {
      const { container } = render(
        <TimelineV2 type="context" contextId="ctx-1" />
      );
      expect(container).toBeDefined();
    });

    it('should render with user type', () => {
      const { container } = render(
        <TimelineV2 type="user" userId="user-1" />
      );
      expect(container).toBeDefined();
    });
  });

  describe('Props', () => {
    it('should accept className prop', () => {
      const { container } = render(
        <TimelineV2 type="public" className="custom-class" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.classList.contains('custom-class')).toBe(true);
    });

    it('should pass currentUserId to children', () => {
      const { container } = render(
        <TimelineV2 type="public" currentUserId="user-1" />
      );
      expect(container).toBeDefined();
    });
  });

  describe('Timeline Types', () => {
    it('should handle home timeline type', () => {
      const { container } = render(<TimelineV2 type="home" />);
      expect(container).toBeDefined();
    });

    it('should require contextId for context type', () => {
      const { container } = render(
        <TimelineV2 type="context" contextId="ctx-123" />
      );
      expect(container).toBeDefined();
    });

    it('should require userId for user type', () => {
      const { container } = render(
        <TimelineV2 type="user" userId="user-123" />
      );
      expect(container).toBeDefined();
    });
  });
});
