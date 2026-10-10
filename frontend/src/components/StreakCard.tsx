import { useStreaks } from '../hooks/useProgress'
import { formatDate, today } from '../lib/format'
import { Card, ErrorMessage, Spinner } from './ui'

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
        {value}
        <span className="ml-1 text-base font-normal text-muted">{value === 1 ? unit : `${unit}s`}</span>
      </p>
    </div>
  )
}

export function StreakCard() {
  const { data, isPending, error } = useStreaks()

  let caption = ''
  if (data) {
    if (!data.last_workout_date) caption = 'Log your first workout to start a streak.'
    else if (data.current_streak > 0 && data.last_workout_date !== today()) caption = 'Train today to keep your streak going.'
    else if (data.current_streak > 0) caption = 'Trained today. Nice work.'
    else caption = `Last workout ${formatDate(data.last_workout_date)}.`
  }

  return (
    <Card>
      <h2 className="font-semibold">Streaks</h2>
      {isPending && (
        <div className="py-6">
          <Spinner />
        </div>
      )}
      <ErrorMessage error={error} className="mt-3" />
      {data && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <Stat label="Current streak" value={data.current_streak} unit="day" />
            <Stat label="Longest streak" value={data.longest_streak} unit="day" />
            <Stat label="Days trained" value={data.total_workout_days} unit="day" />
          </div>
          <p className="mt-4 text-sm text-muted">{caption}</p>
        </>
      )}
    </Card>
  )
}
