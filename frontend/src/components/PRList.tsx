import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { usePersonalRecords } from '../hooks/useProgress'
import { formatDate, formatNumber, WEIGHT_UNIT } from '../lib/format'
import { Card, ErrorMessage, Input, Spinner } from './ui'

const COLLAPSED_COUNT = 8

export function PRList() {
  const { data, isPending, error } = usePersonalRecords()
  const [filter, setFilter] = useState('')
  const [expanded, setExpanded] = useState(false)

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return (data ?? []).filter((pr) => pr.exercise_name.toLowerCase().includes(q))
  }, [data, filter])
  const visible = expanded || filter ? filtered : filtered.slice(0, COLLAPSED_COUNT)

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Personal records</h2>
          <p className="text-sm text-muted">Heaviest set per exercise</p>
        </div>
        {data && data.length > COLLAPSED_COUNT && (
          <Input
            type="search"
            aria-label="Filter exercises"
            placeholder="Filter exercises…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-48"
          />
        )}
      </div>

      {isPending && (
        <div className="py-6">
          <Spinner />
        </div>
      )}
      <ErrorMessage error={error} className="mt-3" />

      {data && data.length === 0 && (
        <p className="mt-4 text-sm text-muted">Your best lifts will show up here once you log some sets.</p>
      )}

      {data && data.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="pb-2 font-medium">Exercise</th>
                <th className="pb-2 text-right font-medium">Best set</th>
                <th className="pb-2 text-right font-medium" title="Estimated one-rep max (Epley)">
                  Est. 1RM
                </th>
                <th className="hidden pb-2 pl-4 text-right font-medium sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {visible.map((pr) => (
                <tr key={pr.exercise_id} className="border-t border-border">
                  <td className="py-2 pr-3 font-medium">{pr.exercise_name}</td>
                  <td className="py-2 text-right whitespace-nowrap">
                    {formatNumber(pr.weight)} {WEIGHT_UNIT} × {pr.reps}
                  </td>
                  <td className="py-2 text-right whitespace-nowrap text-muted">
                    {formatNumber(pr.estimated_1rm)} {WEIGHT_UNIT}
                  </td>
                  <td className="hidden py-2 pl-4 text-right whitespace-nowrap sm:table-cell">
                    <Link to={`/workouts/${pr.workout_id}`} className="text-accent hover:underline">
                      {formatDate(pr.workout_date, { weekday: undefined })}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filter && filtered.length === 0 && <p className="mt-3 text-sm text-muted">No exercises match “{filter}”.</p>}
          {!filter && filtered.length > COLLAPSED_COUNT && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-3 text-xs font-medium text-accent hover:underline">
              {expanded ? 'Show fewer' : `Show all ${filtered.length}`}
            </button>
          )}
        </div>
      )}
    </Card>
  )
}
