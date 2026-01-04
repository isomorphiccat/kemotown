/**
 * ScheduleWidget Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScheduleWidget } from '../ScheduleWidget';
import type { ScheduleItem } from '../../schema';

// Mock date to control test timing
const MOCK_NOW = new Date('2026-02-01T12:00:00Z');

describe('ScheduleWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createScheduleItem = (overrides: Partial<ScheduleItem> = {}): ScheduleItem => ({
    id: 'item-1',
    title: 'Opening Ceremony',
    startAt: '2026-02-01T10:00:00Z',
    endAt: '2026-02-01T11:00:00Z',
    location: 'Main Hall',
    category: 'Ceremony',
    hosts: [],
    requiresRsvp: false,
    tags: [],
    ...overrides,
  });

  describe('Empty State', () => {
    it('should show empty message when no schedule', () => {
      render(<ScheduleWidget schedule={[]} />);
      expect(screen.getByText('예정된 일정이 없습니다')).toBeDefined();
    });
  });

  describe('Today\'s Events', () => {
    it('should render schedule items', () => {
      const schedule: ScheduleItem[] = [
        createScheduleItem({
          id: 'item-1',
          title: 'Opening Ceremony',
          startAt: '2026-02-01T10:00:00Z',
          endAt: '2026-02-01T11:00:00Z',
        }),
      ];

      render(<ScheduleWidget schedule={schedule} />);
      expect(screen.getByText('Opening Ceremony')).toBeDefined();
    });

    it('should show location when provided', () => {
      const schedule: ScheduleItem[] = [
        createScheduleItem({
          location: 'Main Hall',
          startAt: '2026-02-01T10:00:00Z',
          endAt: '2026-02-01T11:00:00Z',
        }),
      ];

      render(<ScheduleWidget schedule={schedule} />);
      expect(screen.getByText('Main Hall')).toBeDefined();
    });

    it('should show capacity when provided', () => {
      const schedule: ScheduleItem[] = [
        createScheduleItem({
          capacity: 100,
          startAt: '2026-02-01T10:00:00Z',
          endAt: '2026-02-01T11:00:00Z',
        }),
      ];

      render(<ScheduleWidget schedule={schedule} />);
      expect(screen.getByText('100명')).toBeDefined();
    });

    it('should show "in progress" badge for ongoing events', () => {
      const schedule: ScheduleItem[] = [
        createScheduleItem({
          startAt: '2026-02-01T11:00:00Z',
          endAt: '2026-02-01T13:00:00Z', // Currently ongoing (12:00 is within)
        }),
      ];

      render(<ScheduleWidget schedule={schedule} />);
      expect(screen.getByText('진행 중')).toBeDefined();
    });
  });

  describe('Upcoming Events', () => {
    it('should show upcoming events when no today events', () => {
      const schedule: ScheduleItem[] = [
        createScheduleItem({
          id: 'future-1',
          title: 'Future Event',
          startAt: '2026-02-05T14:00:00Z',
          endAt: '2026-02-05T16:00:00Z',
        }),
      ];

      render(<ScheduleWidget schedule={schedule} />);
      expect(screen.getByText('Future Event')).toBeDefined();
    });
  });

  describe('Max Items', () => {
    it('should respect maxItems prop', () => {
      const schedule: ScheduleItem[] = Array.from({ length: 10 }, (_, i) =>
        createScheduleItem({
          id: `item-${i}`,
          title: `Event ${i + 1}`,
          startAt: `2026-02-01T${(10 + i).toString().padStart(2, '0')}:00:00Z`,
          endAt: `2026-02-01T${(11 + i).toString().padStart(2, '0')}:00:00Z`,
        })
      );

      render(<ScheduleWidget schedule={schedule} maxItems={3} />);

      expect(screen.getByText('Event 1')).toBeDefined();
      expect(screen.getByText('Event 2')).toBeDefined();
      expect(screen.getByText('Event 3')).toBeDefined();
      expect(screen.queryByText('Event 4')).toBeNull();
    });
  });

  describe('Styling', () => {
    it('should accept className prop', () => {
      const schedule: ScheduleItem[] = [
        createScheduleItem({
          startAt: '2026-02-01T10:00:00Z',
          endAt: '2026-02-01T11:00:00Z',
        }),
      ];

      const { container } = render(
        <ScheduleWidget schedule={schedule} className="custom-class" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.classList.contains('custom-class')).toBe(true);
    });
  });
});
