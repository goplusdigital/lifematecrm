"use client";

import React from "react";

type DobDatePickerProps = {
  locale: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder: string;
  inputClassName?: string;
};

export default function DobDatePicker({
  locale,
  value,
  onChange,
  placeholder,
  inputClassName,
}: DobDatePickerProps) {
  const currentDate = new Date();
  const MIN_YEAR = currentDate.getFullYear() - 119;
  const MAX_YEAR = currentDate.getFullYear();
  const YEAR_RANGE_SPAN = 12;
  const RANGE_BLOCKS_PER_PAGE = 10;

  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [calendarStep, setCalendarStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [selectedYear, setSelectedYear] = React.useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<number | null>(null);
  const [yearRangeStart, setYearRangeStart] = React.useState(MIN_YEAR);

  const monthNames =
    locale === "th"
      ? [
          "มกราคม",
          "กุมภาพันธ์",
          "มีนาคม",
          "เมษายน",
          "พฤษภาคม",
          "มิถุนายน",
          "กรกฎาคม",
          "สิงหาคม",
          "กันยายน",
          "ตุลาคม",
          "พฤศจิกายน",
          "ธันวาคม",
        ]
      : [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

  const weekdayNames = locale === "th" ? ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getRangeStartByYear = (year: number) =>
    Math.floor((year - MIN_YEAR) / YEAR_RANGE_SPAN) * YEAR_RANGE_SPAN + MIN_YEAR;

  const lastRangeStart = getRangeStartByYear(MAX_YEAR);
  const maxPageStart = Math.max(MIN_YEAR, lastRangeStart - (RANGE_BLOCKS_PER_PAGE - 1) * YEAR_RANGE_SPAN);
  const hasMultipleRangePages = maxPageStart > MIN_YEAR;
  const canGoPrevRangePage = yearRangeStart > MIN_YEAR;
  const canGoNextRangePage = yearRangeStart < maxPageStart;

  const displayYear = (year: number) => (locale === "th" ? year + 543 : year);

  const openCalendar = () => {
    const baseDate = value ?? new Date(currentDate.getFullYear() - 20, 0, 1);
    const baseYear = Math.min(Math.max(baseDate.getFullYear(), MIN_YEAR), MAX_YEAR);
    setSelectedYear(baseYear);
    setSelectedMonth(baseDate.getMonth());
    setYearRangeStart(MIN_YEAR);
    setCalendarStep(value ? 4 : 1);
    setCalendarOpen(true);
  };

  const closeCalendar = () => {
    setCalendarOpen(false);
  };

  const yearRangeBlocks = React.useMemo(() => {
    const blocks: number[] = [];
    for (let i = 0; i < RANGE_BLOCKS_PER_PAGE; i++) {
      const start = yearRangeStart + i * YEAR_RANGE_SPAN;
      if (start > MAX_YEAR) {
        break;
      }
      blocks.push(start);
    }
    return blocks;
  }, [yearRangeStart, MAX_YEAR]);

  const yearsInSelectedRange = React.useMemo(() => {
    const years: number[] = [];
    for (let year = yearRangeStart; year < yearRangeStart + YEAR_RANGE_SPAN && year <= MAX_YEAR; year++) {
      years.push(year);
    }
    return years;
  }, [yearRangeStart, MAX_YEAR]);

  const daysInMonth = React.useMemo(() => {
    if (selectedYear == null || selectedMonth == null) {
      return [] as number[];
    }
    const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  }, [selectedYear, selectedMonth]);

  const firstDayOffset = React.useMemo(() => {
    if (selectedYear == null || selectedMonth == null) {
      return 0;
    }
    return new Date(selectedYear, selectedMonth, 1).getDay();
  }, [selectedYear, selectedMonth]);

  const isFutureDate = (year: number, month: number, day: number) => {
    const candidate = new Date(year, month, day);
    return candidate > currentDate;
  };

  const formatDateDisplay = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = displayYear(date.getFullYear());
    return `${day}/${month}/${year}`;
  };

  const selectDay = (day: number) => {
    if (selectedYear == null || selectedMonth == null) {
      return;
    }
    if (isFutureDate(selectedYear, selectedMonth, day)) {
      return;
    }
    onChange(new Date(selectedYear, selectedMonth, day));
    closeCalendar();
  };

  return (
    <>
      <input
        type="text"
        readOnly
        onClick={openCalendar}
        value={value ? formatDateDisplay(value) : ""}
        placeholder={placeholder}
        className={
          inputClassName ??
          "w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#F35F1A] font-prompt text-sm bg-white text-gray-700 cursor-pointer"
        }
      />

      {calendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm max-h-[85dvh] overflow-y-auto rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-prompt text-sm font-bold text-gray-800">
                {calendarStep === 1 && (locale === "th" ? "Step 1: เลือกช่วงปี พ.ศ." : "Step 1: Select year range")}
                {calendarStep === 2 && "Step 2: เลือกปีเกิด"}
                {calendarStep === 3 && "Step 3: เลือกเดือนเกิด"}
                {calendarStep === 4 && "Step 4: เลือกวันเกิด"}
              </p>
              <button
                onClick={closeCalendar}
                className="rounded-md px-2 py-1 font-prompt text-xs text-gray-500 hover:bg-gray-100"
              >
                ปิด
              </button>
            </div>

            {calendarStep === 1 && (
              <>
                {hasMultipleRangePages && (
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      disabled={!canGoPrevRangePage}
                      onClick={() =>
                        setYearRangeStart((prev) => Math.max(MIN_YEAR, prev - YEAR_RANGE_SPAN * RANGE_BLOCKS_PER_PAGE))
                      }
                      className="rounded-md border border-gray-200 px-3 py-1 text-xs font-prompt disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ย้อน
                    </button>
                    <button
                      disabled={!canGoNextRangePage}
                      onClick={() =>
                        setYearRangeStart((prev) => Math.min(maxPageStart, prev + YEAR_RANGE_SPAN * RANGE_BLOCKS_PER_PAGE))
                      }
                      className="rounded-md border border-gray-200 px-3 py-1 text-xs font-prompt disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ถัดไป
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {yearRangeBlocks.map((startYear) => {
                    const endYear = Math.min(startYear + YEAR_RANGE_SPAN - 1, MAX_YEAR);
                    const isSelectedRange = selectedYear != null && selectedYear >= startYear && selectedYear <= endYear;
                    return (
                      <button
                        key={startYear}
                        onClick={() => {
                          setYearRangeStart(startYear);
                          setCalendarStep(2);
                        }}
                        className={`rounded-lg border px-3 py-2 text-sm font-prompt ${
                          isSelectedRange
                            ? "border-[#F35F1A] bg-[#F35F1A] text-white"
                            : "border-gray-200 text-gray-700 hover:border-[#F35F1A] hover:text-[#F35F1A]"
                        }`}
                      >
                        {displayYear(startYear)} - {displayYear(endYear)}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {calendarStep === 2 && (
              <>
                <button
                  onClick={() => setCalendarStep(1)}
                  className="mb-3 rounded-md border border-gray-200 px-3 py-1 text-xs font-prompt"
                >
                  ย้อนกลับ
                </button>
                <div className="grid grid-cols-3 gap-2">
                  {yearsInSelectedRange.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year);
                        setCalendarStep(3);
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm font-prompt ${
                        selectedYear === year
                          ? "border-[#F35F1A] bg-[#F35F1A] text-white"
                          : "border-gray-200 text-gray-700 hover:border-[#F35F1A] hover:text-[#F35F1A]"
                      }`}
                    >
                      {displayYear(year)}
                    </button>
                  ))}
                </div>
              </>
            )}

            {calendarStep === 3 && (
              <>
                <button
                  onClick={() => setCalendarStep(2)}
                  className="mb-3 rounded-md border border-gray-200 px-3 py-1 text-xs font-prompt"
                >
                  ย้อนกลับ
                </button>
                <div className="grid grid-cols-3 gap-2">
                  {monthNames.map((monthName, index) => (
                    <button
                      key={monthName}
                      onClick={() => {
                        setSelectedMonth(index);
                        setCalendarStep(4);
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm font-prompt ${
                        selectedMonth === index
                          ? "border-[#F35F1A] bg-[#F35F1A] text-white"
                          : "border-gray-200 text-gray-700 hover:border-[#F35F1A] hover:text-[#F35F1A]"
                      }`}
                    >
                      {monthName}
                    </button>
                  ))}
                </div>
              </>
            )}

            {calendarStep === 4 && selectedYear != null && selectedMonth != null && (
              <>
                <button
                  onClick={() => setCalendarStep(3)}
                  className="mb-3 rounded-md border border-gray-200 px-3 py-1 text-xs font-prompt"
                >
                  ย้อนกลับ
                </button>
                <p className="mb-3 text-center font-prompt text-sm font-medium text-gray-700">
                  {monthNames[selectedMonth]} {displayYear(selectedYear)}
                </p>
                <div className="mb-2 grid grid-cols-7 gap-1">
                  {weekdayNames.map((weekday) => (
                    <div key={weekday} className="text-center font-prompt text-xs text-gray-500">
                      {weekday}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOffset }).map((_, idx) => (
                    <div key={`blank-${idx}`} />
                  ))}
                  {daysInMonth.map((day) => {
                    const disabled = isFutureDate(selectedYear, selectedMonth, day);
                    const active =
                      !!value &&
                      value.getFullYear() === selectedYear &&
                      value.getMonth() === selectedMonth &&
                      value.getDate() === day;
                    return (
                      <button
                        key={day}
                        disabled={disabled}
                        onClick={() => selectDay(day)}
                        className={`h-8 rounded-md text-xs font-prompt ${active ? "bg-[#F35F1A] text-white" : "text-gray-700"} ${
                          disabled ? "cursor-not-allowed bg-gray-100 text-gray-300" : "hover:bg-[#F35F1A]/10"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
