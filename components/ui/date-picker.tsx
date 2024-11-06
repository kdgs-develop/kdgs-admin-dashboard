"use client"

import { FC } from 'react';

interface DatePickerProps {
  date: Date | null | undefined;
  setDate: (date: Date | null) => void;
}

export const DatePicker: FC<DatePickerProps> = ({ date, setDate }) => {
  return (
    <input
      type="date"
      value={date ? date.toISOString().split('T')[0] : ''}
      onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : null)}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
};