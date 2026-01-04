/**
 * GroupCard Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GroupCard } from '../GroupCard';
import type { PluginContextProps } from '../../../types';
import type { GroupPluginData } from '../../schema';

const mockGroupData: GroupPluginData = {
  groupType: 'community',
  memberCount: 150,
  tags: ['furry', 'korean', 'art'],
  rules: [
    'Be respectful',
    'No spam',
    'Keep it family-friendly',
  ],
  moderation: {
    slowModeSeconds: 0,
    requireApproval: false,
    restrictMedia: false,
    blockedWords: [],
  },
  features: {
    announcements: true,
    polls: true,
    events: true,
    media: true,
    links: true,
  },
  customRoles: [],
  welcomeMessage: 'Welcome to our community!',
  customFields: [],
};

const mockContext: PluginContextProps['context'] = {
  id: 'grp-1',
  slug: 'korean-furries',
  name: 'Korean Furries',
  avatarUrl: null,
  bannerUrl: null,
};

describe('GroupCard', () => {
  describe('Standard Variant', () => {
    it('should render group name', () => {
      render(
        <GroupCard context={mockContext} pluginData={mockGroupData} memberCount={150} />
      );
      expect(screen.getByText('Korean Furries')).toBeDefined();
    });

    it('should render member count', () => {
      render(
        <GroupCard context={mockContext} pluginData={mockGroupData} memberCount={150} />
      );
      // Text may be split across elements
      expect(screen.getByText(/150/)).toBeDefined();
      expect(screen.getByText(/멤버/)).toBeDefined();
    });

    it('should render group type badge', () => {
      render(
        <GroupCard context={mockContext} pluginData={mockGroupData} memberCount={150} />
      );
      expect(screen.getByText('커뮤니티')).toBeDefined();
    });

    it('should render tags', () => {
      render(
        <GroupCard context={mockContext} pluginData={mockGroupData} memberCount={150} />
      );
      // Tags are rendered without # prefix
      expect(screen.getByText('furry')).toBeDefined();
      expect(screen.getByText('korean')).toBeDefined();
    });

    it('should link to group page', () => {
      render(
        <GroupCard context={mockContext} pluginData={mockGroupData} memberCount={150} />
      );
      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe('/c/korean-furries');
    });
  });

  describe('Compact Variant', () => {
    it('should render in compact mode', () => {
      render(
        <GroupCard context={mockContext} pluginData={mockGroupData} memberCount={150} compact />
      );
      expect(screen.getByText('Korean Furries')).toBeDefined();
    });

    it('should show member count in compact mode', () => {
      render(
        <GroupCard context={mockContext} pluginData={mockGroupData} memberCount={150} compact />
      );
      // Text may be split across elements
      expect(screen.getByText(/150/)).toBeDefined();
      expect(screen.getByText(/멤버/)).toBeDefined();
    });
  });

  describe('Group Types', () => {
    it('should show interest badge for interest group', () => {
      const interestGroup: GroupPluginData = {
        ...mockGroupData,
        groupType: 'interest',
      };

      render(
        <GroupCard context={mockContext} pluginData={interestGroup} memberCount={100} />
      );
      expect(screen.getByText('관심사')).toBeDefined();
    });

    it('should show regional badge for regional group', () => {
      const regionalGroup: GroupPluginData = {
        ...mockGroupData,
        groupType: 'regional',
      };

      render(
        <GroupCard context={mockContext} pluginData={regionalGroup} memberCount={100} />
      );
      expect(screen.getByText('지역')).toBeDefined();
    });
  });

  describe('Styling', () => {
    it('should accept className prop', () => {
      const { container } = render(
        <GroupCard
          context={mockContext}
          pluginData={mockGroupData}
          memberCount={150}
          className="custom-class"
        />
      );
      const link = container.firstChild as HTMLElement;
      expect(link.classList.contains('custom-class')).toBe(true);
    });
  });
});
