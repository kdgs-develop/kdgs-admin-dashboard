"use client";

import { FC, useRef } from "react";

interface DatePickerProps {
  date: Date | null | undefined;
  setDate: (date: Date | null) => void;
}

export const DatePicker: FC<DatePickerProps> = ({ date, setDate }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // This function limits the year to 4 digits by enforcing a date range
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // If the input is empty, clear the date
    if (!e.target.value) {
      setDate(null);
      return;
    }

    const newDate = new Date(e.target.value);

    // If the year is greater than 9999, reset to 9999
    if (newDate.getFullYear() > 9999) {
      // Create a new date with the year limited to 9999 but keeping month and day
      const limitedDate = new Date(9999, newDate.getMonth(), newDate.getDate());

      // Update the input value to use the limited date
      if (inputRef.current) {
        const isoDate = limitedDate.toISOString().split("T")[0];
        inputRef.current.value = isoDate;
      }

      setDate(limitedDate);
    } else {
      setDate(newDate);
    }
  };

  return (
    <input
      ref={inputRef}
      type="date"
      value={date ? date.toISOString().split("T")[0] : ""}
      onChange={handleDateChange}
      min="1000-01-01"
      max="9999-12-31"
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
};
