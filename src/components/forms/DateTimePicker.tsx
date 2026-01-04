/**
 * DateTimePicker Component
 * Korean-friendly date and time picker
 */

'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  showTime?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = '날짜를 선택하세요',
  className,
  showTime = true,
}: DateTimePickerProps) {
  const [dateInput, setDateInput] = React.useState('');
  const [timeInput, setTimeInput] = React.useState('');

  // Initialize from value
  React.useEffect(() => {
    if (value) {
      setDateInput(format(value, 'yyyy-MM-dd'));
      if (showTime) {
        setTimeInput(format(value, 'HH:mm'));
      }
    }
  }, [value, showTime]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateInput(newDate);

    if (newDate) {
      const [year, month, day] = newDate.split('-').map(Number);
      let date: Date;

      if (showTime && timeInput) {
        const [hours, minutes] = timeInput.split(':').map(Number);
        date = new Date(year, month - 1, day, hours, minutes);
      } else {
        date = new Date(year, month - 1, day);
      }

      onChange(date);
    } else {
      onChange(undefined);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeInput(newTime);

    if (dateInput && newTime) {
      const [year, month, day] = dateInput.split('-').map(Number);
      const [hours, minutes] = newTime.split(':').map(Number);
      const date = new Date(year, month - 1, day, hours, minutes);
      onChange(date);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2">
        {/* Date Input */}
        <div className="relative flex-1">
          <Input
            type="date"
            value={dateInput}
            onChange={handleDateChange}
            placeholder={placeholder}
            className="pr-10"
          />
          <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Time Input */}
        {showTime && (
          <Input
            type="time"
            value={timeInput}
            onChange={handleTimeChange}
            className="w-32"
          />
        )}
      </div>

      {/* Display Selected Date */}
      {value && (
        <p className="text-sm text-muted-foreground">
          선택된 날짜:{' '}
          {format(value, showTime ? 'PPP p' : 'PPP', { locale: ko })}
        </p>
      )}
    </div>
  );
}
