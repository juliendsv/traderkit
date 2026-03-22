'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  dayMap: Record<string, number> // YYYY-MM-DD -> pnl
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay() // 0=Sun
}

function colorForPnl(pnl: number): string {
  if (pnl === 0) return 'bg-zinc-800 text-zinc-500'
  if (pnl > 0) {
    if (pnl > 500) return 'bg-emerald-700 text-emerald-100'
    if (pnl > 100) return 'bg-emerald-800 text-emerald-200'
    return 'bg-emerald-950 text-emerald-400'
  } else {
    if (pnl < -500) return 'bg-red-800 text-red-100'
    if (pnl < -100) return 'bg-red-900 text-red-200'
    return 'bg-red-950 text-red-400'
  }
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December']

export function PnlCalendar({ dayMap }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  function goMonth(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => goMonth(-1)}
          className="p-2 text-zinc-400 hover:text-white transition-colors"
        >
          ←
        </button>
        <h2 className="text-white font-medium">{MONTHS[month]} {year}</h2>
        <button
          onClick={() => goMonth(1)}
          className="p-2 text-zinc-400 hover:text-white transition-colors"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs text-zinc-500 font-medium py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />
          }
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const pnl = dayMap[dateKey]
          const hasData = pnl !== undefined
          const isToday = dateKey === today.toISOString().slice(0, 10)

          return (
            <div
              key={dateKey}
              className={cn(
                'aspect-square rounded-md flex flex-col items-center justify-center p-1 text-xs',
                hasData ? colorForPnl(pnl) : 'bg-zinc-900 text-zinc-600',
                isToday && 'ring-1 ring-zinc-400'
              )}
              title={hasData ? `${dateKey}: $${pnl.toFixed(2)}` : dateKey}
            >
              <span className="font-medium">{day}</span>
              {hasData && (
                <span className="text-[9px] mt-0.5 tabular-nums">
                  {pnl >= 0 ? '+' : ''}{pnl >= 100 || pnl <= -100
                    ? `$${Math.round(pnl)}`
                    : `$${pnl.toFixed(0)}`}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-4 text-xs text-zinc-500 pt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-700" />
          Profitable
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-800" />
          Loss
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-zinc-800" />
          No trades
        </div>
      </div>
    </div>
  )
}
