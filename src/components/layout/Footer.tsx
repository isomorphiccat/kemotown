/**
 * Footer Component
 * Site footer
 */

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'border-t bg-background',
        className
      )}
    >
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gradient">Kemotown</h3>
            <p className="text-sm text-muted-foreground font-korean">
              한국 퍼리 커뮤니티를 위한 특별한 공간
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <h4 className="font-semibold">탐색</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  홈
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  이벤트
                </Link>
              </li>
              <li>
                <Link
                  href="/users"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  커뮤니티
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="font-semibold">리소스</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/notifications"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  알림
                </Link>
              </li>
              <li>
                <Link
                  href="/messages"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  메시지
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="font-semibold">법적 고지</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  이용약관
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Kemotown. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
