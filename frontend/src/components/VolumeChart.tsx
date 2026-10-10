/**
 * Weekly training volume (sum of weight × reps) as a single-series bar chart.
 * One series, so no legend: the card title names it. Hover shows a tooltip
 * per week; "Show table" gives the same numbers as an accessible table.
 */
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'

import type { VolumeWeek } from '../api/types'
import { useExercises } from '../hooks/useExercises'
import { useVolume } from '../hooks/useProgress'
import { addDays, formatCompact, formatNumber, formatShortDate, startOfWeek, today, WEIGHT_UNIT } from '../lib/format'
import { Card, ErrorMessage, Select, Spinner } from './ui'

const RANGES = [
  { weeks: 4, label: '4 weeks' },
  { weeks: 12, label: '12 weeks' },
  { weeks: 26, label: '6 months' },
  { weeks: 52, label: '1 year' },
] as const

function VolumeTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const week = payload[0].payload as VolumeWeek
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="font-medium">Week of {formatShortDate(week.week_start)}</p>
      <p className="mt-1 tabular-nums">
        {formatNumber(week.total_volume)} {WEIGHT_UNIT}
      </p>
      <p className="text-muted">
        {week.workout_count} {week.workout_count === 1 ? 'workout' : 'workouts'} · {week.set_count}{' '}
        {week.set_count === 1 ? 'set' : 'sets'}
      </p>
    </div>
  )
}

export function VolumeChart() {
  const [weeks, setWeeks] = useState<number>(12)
  const [exerciseId, setExerciseId] = useState('')
  const [showTable, setShowTable] = useState(false)

  const endDate = today()
  // The API buckets by Monday-start week: start on the Monday N-1 weeks before
  // this week's Monday, so the chart shows exactly N bars.
  const startDate = addDays(startOfWeek(endDate), -(weeks - 1) * 7)
  const { data, isPending, isFetching, error } = useVolume({ startDate, endDate, exerciseId: exerciseId || undefined })
  const exercises = useExercises()

  const exerciseOptions = useMemo(
    () => [...(exercises.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [exercises.data],
  )
  const total = data?.weeks.reduce((sum, w) => sum + w.total_volume, 0) ?? 0
  const hasData = total > 0

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Weekly volume</h2>
          <p className="text-sm text-muted">
            Weight × reps, in {WEIGHT_UNIT}
            {data && hasData && (
              <>
                {' · '}
                <span className="tabular-nums">{formatNumber(total)}</span> total
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isFetching && !isPending && <Spinner small />}
          <Select aria-label="Exercise" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)} className="w-44">
            <option value="">All exercises</option>
            {exerciseOptions.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </Select>
          <div role="group" aria-label="Time range" className="flex rounded-lg border border-border p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.weeks}
                type="button"
                aria-pressed={weeks === r.weeks}
                onClick={() => setWeeks(r.weeks)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  weeks === r.weeks ? 'bg-surface-2 text-text' : 'text-muted hover:text-text'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ErrorMessage error={error} className="mt-4" />

      <div className="relative mt-4 h-64">
        {isPending ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : data && !hasData ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
            No sets logged in this period{exerciseId ? ' for this exercise' : ''}.
          </div>
        ) : data ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.weeks} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="20%">
              <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" />
              <XAxis
                dataKey="week_start"
                tickFormatter={formatShortDate}
                tick={{ fill: 'var(--color-subtle)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--color-border)' }}
                tickLine={false}
                minTickGap={16}
              />
              <YAxis
                tickFormatter={(v: number) => formatCompact(v)}
                tick={{ fill: 'var(--color-subtle)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                content={VolumeTooltip}
                cursor={{ fill: 'var(--color-surface-2)' }}
                isAnimationActive={false}
              />
              <Bar
                dataKey="total_volume"
                name="Volume"
                fill="var(--color-chart-1)"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      {data && hasData && (
        <div className="mt-3">
          <button type="button" onClick={() => setShowTable((v) => !v)} className="text-xs font-medium text-accent hover:underline">
            {showTable ? 'Hide table' : 'Show table'}
          </button>
          {showTable && (
            <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface-2 text-left text-xs text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Week of</th>
                    <th className="px-3 py-2 text-right font-medium">Volume ({WEIGHT_UNIT})</th>
                    <th className="px-3 py-2 text-right font-medium">Workouts</th>
                    <th className="px-3 py-2 text-right font-medium">Sets</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {data.weeks.map((w) => (
                    <tr key={w.week_start} className="border-t border-border">
                      <td className="px-3 py-1.5">{formatShortDate(w.week_start)}</td>
                      <td className="px-3 py-1.5 text-right">{formatNumber(w.total_volume)}</td>
                      <td className="px-3 py-1.5 text-right">{w.workout_count}</td>
                      <td className="px-3 py-1.5 text-right">{w.set_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
