'use client';

/**
 * SocialLinks Component
 * Display user's social media links
 */

import {
  Twitter,
  Send,
  MessageCircle,
  Instagram,
  Globe,
  type LucideIcon,
} from 'lucide-react';

interface SocialLinksProps {
  socialLinks: Record<string, string> | null;
}

const socialIcons: Record<string, LucideIcon> = {
  twitter: Twitter,
  telegram: Send,
  discord: MessageCircle,
  instagram: Instagram,
  website: Globe,
};

const socialLabels: Record<string, string> = {
  twitter: 'Twitter',
  telegram: 'Telegram',
  discord: 'Discord',
  furaffinity: 'FurAffinity',
  instagram: 'Instagram',
  website: 'Website',
};

export function SocialLinks({ socialLinks }: SocialLinksProps) {
  if (!socialLinks || Object.keys(socialLinks).length === 0) {
    return null;
  }

  const links = Object.entries(socialLinks).filter(([, url]) => url);

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="bg-cream-50/80 dark:bg-forest-900/60 backdrop-blur-sm rounded-2xl border border-warm-200/60 dark:border-forest-800/60 shadow-sm p-6 mb-6">
      <h2 className="text-xl font-display font-bold text-forest-800 dark:text-cream-100 mb-4 font-korean">소셜 링크</h2>
      <div className="flex flex-wrap gap-3">
        {links.map(([platform, url]) => {
          const Icon = socialIcons[platform];
          const label = socialLabels[platform] || platform;

          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-warm-100/60 dark:bg-forest-800/60 hover:bg-warm-200/60 dark:hover:bg-forest-700/60 rounded-xl transition-colors text-forest-700 dark:text-forest-300 border border-warm-200/40 dark:border-forest-700/40"
            >
              {Icon && <Icon className="w-5 h-5" />}
              <span className="text-sm font-medium">{label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
