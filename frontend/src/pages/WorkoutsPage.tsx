import { Link, useSearchParams } from 'react-router-dom'

import { buttonClass } from '../components/buttonClass'
import { Button, EmptyState, ErrorMessage, Input, PageHeader, PageLoader, Spinner } from '../components/ui'
import { useWorkouts } from '../hooks/useWorkouts'
import { formatDate } from '../lib/format'

const PAGE_SIZE = 10

export function WorkoutsPage() {
  // Page and filters live in the URL so back/forward and shared links keep them.
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const startDate = params.get('from') ?? ''
  const endDate = params.get('to') ?? ''

  const { data, isPending, isFetching, isPlaceholderData, error } = useWorkouts({
    page,
    pageSize: PAGE_SIZE,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  function setParam(key: string, value: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      if (key !== 'page') next.delete('page') // filters reset to page 1
      return next
    })
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  const filtered = Boolean(startDate || endDate)
  const rangeInvalid = Boolean(startDate && endDate && startDate > endDate)

  return (
    <>
      <PageHeader
        title="Workouts"
        subtitle={data ? `${data.total} ${data.total === 1 ? 'workout' : 'workouts'}${filtered ? ' in range' : ''}` : undefined}
        actions={
          <Link to="/workouts/new" className={buttonClass('primary')}>
            + Log workout
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Input label="From" type="date" value={startDate} max={endDate || undefined} onChange={(e) => setParam('from', e.target.value)} className="w-40" />
        <Input label="To" type="date" value={endDate} min={startDate || undefined} onChange={(e) => setParam('to', e.target.value)} className="w-40" />
        {filtered && (
          <Button variant="ghost" onClick={() => setParams({})}>
            Clear dates
          </Button>
        )}
        {isFetching && !isPending && <Spinner small />}
      </div>

      {rangeInvalid ? (
        <ErrorMessage error="“From” must be on or before “To”." />
      ) : (
        <ErrorMessage error={error} />
      )}

      {isPending && !rangeInvalid && <PageLoader />}

      {data && data.items.length === 0 && (
        <EmptyState title={filtered ? 'No workouts in this date range' : 'No workouts yet'}>
          {filtered ? (
            'Try a wider range.'
          ) : (
            <Link to="/workouts/new" className="font-medium text-accent hover:underline">
              Log your first workout
            </Link>
          )}
        </EmptyState>
      )}

      {data && data.items.length > 0 && (
        <>
          <ul className={`divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface ${isPlaceholderData ? 'opacity-60' : ''}`}>
            {data.items.map((w) => (
              <li key={w.id}>
                <Link to={`/workouts/${w.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-surface-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{w.name}</p>
                    {w.notes && <p className="truncate text-sm text-muted">{w.notes}</p>}
                  </div>
                  <time dateTime={w.workout_date} className="shrink-0 text-sm text-muted">
                    {formatDate(w.workout_date)}
                  </time>
                  <span aria-hidden className="text-subtle">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}>
                ← Newer
              </Button>
              <span className="text-sm text-muted">
                Page {page} of {totalPages}
              </span>
              <Button variant="secondary" disabled={page >= totalPages} onClick={() => setParam('page', String(page + 1))}>
                Older →
              </Button>
            </nav>
          )}
        </>
      )}
    </>
  )
}
