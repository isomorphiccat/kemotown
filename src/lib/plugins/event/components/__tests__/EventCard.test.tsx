/**
 * EventCard Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventCard } from '../EventCard';
import type { PluginContextProps } from '../../../types';
import type { EventPluginData } from '../../schema';

const mockEventData: EventPluginData = {
  startAt: '2026-02-01T14:00:00Z',
  endAt: '2026-02-01T18:00:00Z',
  timezone: 'Asia/Seoul',
  isAllDay: false,
  locationType: 'physical',
  location: {
    name: 'Cozy Cafe',
    address: 'Seoul, South Korea',
    isPublic: true,
  },
  rsvpOptions: ['attending', 'not_attending'],
  capacity: 50,
  hasWaitlist: true,
  allowGuestRsvp: false,
  maxGuestsPerRsvp: 0,
  cost: 0,
  paymentRequired: false,
  requireApproval: false,
  allowRsvpComments: true,
  reminders: [],
  cancelledAt: null,
  postponedTo: null,
};

const mockContext: PluginContextProps['context'] = {
  id: 'evt-1',
  slug: 'furry-meetup',
  name: 'Furry Meetup Seoul',
  avatarUrl: null,
  bannerUrl: null,
};

describe('EventCard', () => {
  describe('Standard Variant', () => {
    it('should render event name', () => {
      render(
        <EventCard context={mockContext} pluginData={mockEventData} />
      );
      expect(screen.getByText('Furry Meetup Seoul')).toBeDefined();
    });

    it('should render location when physical', () => {
      render(
        <EventCard context={mockContext} pluginData={mockEventData} />
      );
      expect(screen.getByText('Cozy Cafe')).toBeDefined();
    });

    it('should show capacity when defined', () => {
      render(
        <EventCard context={mockContext} pluginData={mockEventData} />
      );
      // Capacity shows as "최대 50명"
      expect(screen.getByText(/최대 50명/)).toBeDefined();
    });

    it('should link to event page', () => {
      render(
        <EventCard context={mockContext} pluginData={mockEventData} />
      );
      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe('/c/furry-meetup');
    });
  });

  describe('Compact Variant', () => {
    it('should render in compact mode', () => {
      render(
        <EventCard context={mockContext} pluginData={mockEventData} compact />
      );
      expect(screen.getByText('Furry Meetup Seoul')).toBeDefined();
    });
  });

  describe('Online Events', () => {
    it('should not show location for online events', () => {
      const onlineEventData: EventPluginData = {
        ...mockEventData,
        locationType: 'online',
        location: undefined,
        onlineUrl: 'https://zoom.us/meeting',
      };

      render(
        <EventCard context={mockContext} pluginData={onlineEventData} />
      );
      // Online events shouldn't show "Cozy Cafe"
      expect(screen.queryByText('Cozy Cafe')).toBeNull();
    });
  });

  describe('Event Status', () => {
    it('should show ended status for past events', () => {
      const endedEvent: EventPluginData = {
        ...mockEventData,
        startAt: '2020-01-01T14:00:00Z',
        endAt: '2020-01-01T18:00:00Z',
      };

      render(
        <EventCard context={mockContext} pluginData={endedEvent} />
      );
      // Ended events show "종료" badge
      expect(screen.getByText('종료')).toBeDefined();
    });
  });

  describe('Styling', () => {
    it('should accept className prop', () => {
      const { container } = render(
        <EventCard
          context={mockContext}
          pluginData={mockEventData}
          className="custom-class"
        />
      );
      const link = container.firstChild as HTMLElement;
      expect(link.classList.contains('custom-class')).toBe(true);
    });
  });
});
