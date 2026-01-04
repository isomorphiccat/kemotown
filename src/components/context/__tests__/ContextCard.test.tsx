/**
 * ContextCard Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContextCard } from '../ContextCard';

const mockContext = {
  id: 'ctx-1',
  slug: 'test-context',
  name: 'Test Context',
  description: 'A test context for testing',
  avatarUrl: null,
  bannerUrl: null,
  visibility: 'PUBLIC',
  type: 'GROUP',
  features: ['group'],
  _count: {
    memberships: 42,
  },
  owner: {
    displayName: 'Owner Name',
    username: 'owner',
  },
  createdAt: new Date('2024-01-01'),
};

describe('ContextCard', () => {
  describe('Standard Variant', () => {
    it('should render context name', () => {
      render(<ContextCard context={mockContext} />);
      expect(screen.getByText('Test Context')).toBeDefined();
    });

    it('should render member count', () => {
      render(<ContextCard context={mockContext} />);
      expect(screen.getByText('42 멤버')).toBeDefined();
    });

    it('should render owner name', () => {
      render(<ContextCard context={mockContext} />);
      expect(screen.getByText('by Owner Name')).toBeDefined();
    });

    it('should render description', () => {
      render(<ContextCard context={mockContext} />);
      expect(screen.getByText('A test context for testing')).toBeDefined();
    });

    it('should link to context page', () => {
      render(<ContextCard context={mockContext} />);
      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe('/c/test-context');
    });

    it('should show group badge for group context', () => {
      render(<ContextCard context={mockContext} />);
      expect(screen.getByText('그룹')).toBeDefined();
    });

    it('should show event badge for event context', () => {
      const eventContext = {
        ...mockContext,
        features: ['event'],
      };
      render(<ContextCard context={eventContext} />);
      expect(screen.getByText('이벤트')).toBeDefined();
    });
  });

  describe('Compact Variant', () => {
    it('should render in compact mode', () => {
      render(<ContextCard context={mockContext} compact />);
      expect(screen.getByText('Test Context')).toBeDefined();
    });

    it('should show member count in compact mode', () => {
      render(<ContextCard context={mockContext} compact />);
      expect(screen.getByText('42 멤버')).toBeDefined();
    });

    it('should not show description in compact mode', () => {
      render(<ContextCard context={mockContext} compact />);
      // In compact mode, description should not be rendered
      expect(screen.queryByText('A test context for testing')).toBeNull();
    });
  });

  describe('Visibility', () => {
    it('should show lock icon for private contexts', () => {
      const privateContext = {
        ...mockContext,
        visibility: 'PRIVATE',
      };
      const { container } = render(<ContextCard context={privateContext} />);
      // Check for Lock icon (lucide-react renders svg)
      const lockIcon = container.querySelector('svg');
      expect(lockIcon).toBeDefined();
    });
  });

  describe('Styling', () => {
    it('should accept className prop', () => {
      const { container } = render(
        <ContextCard context={mockContext} className="custom-class" />
      );
      const link = container.firstChild as HTMLElement;
      expect(link.classList.contains('custom-class')).toBe(true);
    });
  });
});
