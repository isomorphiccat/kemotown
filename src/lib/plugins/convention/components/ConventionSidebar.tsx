'use client';

/**
 * ConventionSidebar Component
 * Sidebar with convention info, schedule, and quick links
 */

import { Calendar, MapPin, Store, Users, Info, Wifi, Car, Phone } from 'lucide-react';
import { ScheduleWidget } from './ScheduleWidget';
import { DealerList } from './DealerList';
import type { PluginContextProps } from '../../types';
import type { ConventionPluginData } from '../schema';

export function ConventionSidebar({
  pluginData,
}: PluginContextProps) {
  const conData = pluginData as ConventionPluginData;

  return (
    <div className="space-y-6">
      {/* Quick Info */}
      <div className="card-elevated p-4">
        <h3 className="font-semibold text-forest-800 dark:text-cream-100 mb-4 flex items-center gap-2">
          <Info className="w-4 h-4" />
          행사 정보
        </h3>

        <div className="space-y-3">
          {/* Venue */}
          {conData.venueAddress && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-forest-100 dark:bg-forest-800 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-forest-600 dark:text-forest-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-forest-800 dark:text-cream-100">
                  장소
                </p>
                <p className="text-xs text-warm-500">{conData.venueAddress}</p>
                {conData.venueMapUrl && (
                  <a
                    href={conData.venueMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-forest-600 dark:text-forest-400 hover:underline"
                  >
                    지도 보기 →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Dealers Room Hours */}
          {conData.dealersRoomHours && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                <Store className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-forest-800 dark:text-cream-100">
                  딜러룸
                </p>
                <p className="text-xs text-warm-500 whitespace-pre-line">
                  {conData.dealersRoomHours}
                </p>
              </div>
            </div>
          )}

          {/* Wifi Info */}
          {conData.wifiInfo && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Wifi className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-forest-800 dark:text-cream-100">
                  와이파이
                </p>
                <p className="text-xs text-warm-500">{conData.wifiInfo}</p>
              </div>
            </div>
          )}

          {/* Parking Info */}
          {conData.parkingInfo && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-warm-100 dark:bg-warm-800 flex items-center justify-center shrink-0">
                <Car className="w-4 h-4 text-warm-600 dark:text-warm-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-forest-800 dark:text-cream-100">
                  주차
                </p>
                <p className="text-xs text-warm-500">{conData.parkingInfo}</p>
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {conData.emergencyContact && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-forest-800 dark:text-cream-100">
                  비상연락처
                </p>
                <p className="text-xs text-warm-500">{conData.emergencyContact}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Today's Schedule */}
      {conData.schedule && conData.schedule.length > 0 && (
        <div className="card-elevated p-4">
          <h3 className="font-semibold text-forest-800 dark:text-cream-100 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            오늘 일정
          </h3>
          <ScheduleWidget schedule={conData.schedule} />
        </div>
      )}

      {/* Dealers Preview */}
      {conData.dealers && conData.dealers.length > 0 && (
        <div className="card-elevated p-4">
          <h3 className="font-semibold text-forest-800 dark:text-cream-100 mb-4 flex items-center gap-2">
            <Store className="w-4 h-4" />
            딜러
          </h3>
          <DealerList dealers={conData.dealers.slice(0, 5)} />
          {conData.dealers.length > 5 && (
            <button
              type="button"
              className="w-full mt-3 py-2 text-sm font-medium text-forest-600 dark:text-forest-400 hover:text-forest-700 dark:hover:text-forest-300 transition-colors"
            >
              {conData.dealers.length - 5}개 더 보기 →
            </button>
          )}
        </div>
      )}

      {/* Who's Here (if enabled) */}
      {conData.enableWhoIsHere && (
        <div className="card-elevated p-4">
          <h3 className="font-semibold text-forest-800 dark:text-cream-100 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            지금 여기에
          </h3>
          <p className="text-sm text-warm-500 text-center py-4">
            체크인하고 주변의 참가자를 찾아보세요
          </p>
        </div>
      )}
    </div>
  );
}
