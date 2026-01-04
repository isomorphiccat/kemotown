/**
 * ConventionCard Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConventionCard } from '../ConventionCard';
import type { PluginContextProps } from '../../../types';
import type { ConventionPluginData } from '../../schema';

const mockConventionData: ConventionPluginData = {
  schedule: [],
  scheduleDays: ['2026-02-01T00:00:00Z', '2026-02-02T00:00:00Z', '2026-02-03T00:00:00Z'],
  maps: [],
  venueAddress: 'Coex Convention Center, Seoul',
  venueMapUrl: 'https://maps.google.com/coex',
  dealers: [
    {
      id: 'dealer-1',
      name: 'Artist 1',
      tableNumber: 'A-1',
    },
  ],
  dealersRoomHours: '10:00 - 18:00',
  roomParties: [],
  allowUserParties: true,
  enableWhoIsHere: true,
  whoIsHereRadius: 0,
  enablePhotoPosts: true,
  hashTags: ['furcon', 'korea'],
};

const mockContext: PluginContextProps['context'] = {
  id: 'con-1',
  slug: 'furry-con-korea',
  name: 'Furry Con Korea 2026',
  avatarUrl: null,
  bannerUrl: null,
};

describe('ConventionCard', () => {
  describe('Standard Variant', () => {
    it('should render convention name', () => {
      render(
        <ConventionCard context={mockContext} pluginData={mockConventionData} />
      );
      expect(screen.getByText('Furry Con Korea 2026')).toBeDefined();
    });

    it('should render venue address', () => {
      render(
        <ConventionCard context={mockContext} pluginData={mockConventionData} />
      );
      expect(screen.getByText('Coex Convention Center')).toBeDefined();
    });

    it('should show dealer count', () => {
      render(
        <ConventionCard context={mockContext} pluginData={mockConventionData} />
      );
      expect(screen.getByText('1 딜러')).toBeDefined();
    });

    it('should render hashtags', () => {
      render(
        <ConventionCard context={mockContext} pluginData={mockConventionData} />
      );
      expect(screen.getByText('#furcon')).toBeDefined();
      expect(screen.getByText('#korea')).toBeDefined();
    });

    it('should show multi-day badge', () => {
      render(
        <ConventionCard context={mockContext} pluginData={mockConventionData} />
      );
      expect(screen.getByText('3일간')).toBeDefined();
    });

    it('should link to convention page', () => {
      render(
        <ConventionCard context={mockContext} pluginData={mockConventionData} />
      );
      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe('/c/furry-con-korea');
    });
  });

  describe('Compact Variant', () => {
    it('should render in compact mode', () => {
      render(
        <ConventionCard context={mockContext} pluginData={mockConventionData} compact />
      );
      expect(screen.getByText('Furry Con Korea 2026')).toBeDefined();
    });

    it('should show member count in compact mode', () => {
      render(
        <ConventionCard
          context={mockContext}
          pluginData={mockConventionData}
          compact
          memberCount={500}
        />
      );
      // Member count is rendered with locale formatting
      expect(screen.getByText(/500/)).toBeDefined();
    });
  });

  describe('Convention Status', () => {
    it('should show upcoming status for future convention', () => {
      const futureConData: ConventionPluginData = {
        ...mockConventionData,
        scheduleDays: ['2027-02-01T00:00:00Z'],
      };

      render(
        <ConventionCard context={mockContext} pluginData={futureConData} />
      );
      expect(screen.getByText('예정')).toBeDefined();
    });
  });

  describe('Styling', () => {
    it('should accept className prop', () => {
      const { container } = render(
        <ConventionCard
          context={mockContext}
          pluginData={mockConventionData}
          className="custom-class"
        />
      );
      const link = container.firstChild as HTMLElement;
      expect(link.classList.contains('custom-class')).toBe(true);
    });
  });
});
