"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format } from "date-fns"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  className?: string
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({ className, date, setDate }: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const presetRanges = [
    {
      label: "Today",
      range: {
        from: new Date(),
        to: new Date(),
      },
    },
    {
      label: "Yesterday",
      range: {
        from: addDays(new Date(), -1),
        to: addDays(new Date(), -1),
      },
    },
    {
      label: "Last 7 days",
      range: {
        from: addDays(new Date(), -7),
        to: new Date(),
      },
    },
    {
      label: "Last 30 days",
      range: {
        from: addDays(new Date(), -30),
        to: new Date(),
      },
    },
    {
      label: "Last 3 months",
      range: {
        from: addDays(new Date(), -90),
        to: new Date(),
      },
    },
    {
      label: "Last 6 months",
      range: {
        from: addDays(new Date(), -180),
        to: new Date(),
      },
    },
    {
      label: "Last year",
      range: {
        from: addDays(new Date(), -365),
        to: new Date(),
      },
    },
  ]

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="flex flex-col gap-2 p-3 border-r">
              <div className="text-sm font-medium">Quick Select</div>
              {presetRanges.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  className="justify-start text-sm h-8"
                  onClick={() => {
                    setDate(preset.range)
                    setIsOpen(false)
                  }}
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                variant="ghost"
                className="justify-start text-sm h-8"
                onClick={() => {
                  setDate(undefined)
                  setIsOpen(false)
                }}
              >
                Clear
              </Button>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
