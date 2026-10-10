import { Link, useNavigate, useParams } from 'react-router-dom'

import { ApiError } from '../api/client'
import { buttonClass } from '../components/buttonClass'
import { Button, Card, EmptyState, ErrorMessage, PageHeader, PageLoader } from '../components/ui'
import { useDeleteWorkout, useWorkout } from '../hooks/useWorkouts'
import { formatDate, formatNumber, WEIGHT_UNIT } from '../lib/format'

export function WorkoutDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: workout, isPending, error } = useWorkout(id)
  const deleteWorkout = useDeleteWorkout()

  if (isPending) return <PageLoader />
  if (error instanceof ApiError && error.status === 404) {
    return (
      <EmptyState title="Workout not found">
        <Link to="/workouts" className="font-medium text-accent hover:underline">
          Back to workouts
        </Link>
      </EmptyState>
    )
  }
  if (error || !workout) return <ErrorMessage error={error} />

  const totalVolume = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + Number(set.weight) * set.reps, 0),
    0,
  )
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)

  function onDelete() {
    if (!workout || !window.confirm(`Delete “${workout.name}”? This can't be undone.`)) return
    deleteWorkout.mutate(workout.id, { onSuccess: () => navigate('/workouts', { replace: true }) })
  }

  return (
    <>
      <Link to="/workouts" className="mb-3 inline-block text-sm text-muted hover:text-text">
        ← Workouts
      </Link>
      <PageHeader
        title={workout.name}
        subtitle={formatDate(workout.workout_date, { weekday: 'long' })}
        actions={
          <>
            <Link to={`/workouts/${workout.id}/edit`} className={buttonClass('secondary')}>
              Edit
            </Link>
            <Button variant="danger" onClick={onDelete} loading={deleteWorkout.isPending}>
              Delete
            </Button>
          </>
        }
      />
      <ErrorMessage error={deleteWorkout.error} className="mb-4" />

      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Exercises', value: workout.exercises.length },
          { label: 'Sets', value: totalSets },
          { label: `Volume (${WEIGHT_UNIT})`, value: formatNumber(totalVolume) },
        ].map((stat) => (
          <Card key={stat.label} className="!p-4">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{stat.value}</p>
          </Card>
        ))}
      </div>

      {workout.notes && (
        <Card className="mb-4">
          <p className="text-sm font-medium text-muted">Notes</p>
          <p className="mt-1 whitespace-pre-line">{workout.notes}</p>
        </Card>
      )}

      {workout.exercises.length === 0 ? (
        <EmptyState title="No exercises logged">
          <Link to={`/workouts/${workout.id}/edit`} className="font-medium text-accent hover:underline">
            Add some
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {workout.exercises.map((ex, i) => {
            const volume = ex.sets.reduce((s, set) => s + Number(set.weight) * set.reps, 0)
            return (
              <Card key={ex.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-semibold">
                    <span className="mr-2 text-subtle">{i + 1}.</span>
                    {ex.exercise_name}
                  </h2>
                  <p className="shrink-0 text-sm text-muted tabular-nums">
                    {formatNumber(volume)} {WEIGHT_UNIT}
                  </p>
                </div>
                <table className="mt-3 w-full table-fixed text-sm">
                  <thead className="text-left text-xs text-muted">
                    <tr>
                      <th className="w-16 pb-1 font-medium">Set</th>
                      <th className="pb-1 text-right font-medium">Weight</th>
                      <th className="pb-1 text-right font-medium">Reps</th>
                      <th className="pb-1 text-right font-medium">RPE</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {ex.sets.map((s) => (
                      <tr key={s.id} className="border-t border-border">
                        <td className="py-1.5 text-muted">{s.set_number}</td>
                        <td className="py-1.5 text-right">
                          {formatNumber(s.weight)} {WEIGHT_UNIT}
                        </td>
                        <td className="py-1.5 text-right">{s.reps}</td>
                        <td className="py-1.5 text-right text-muted">{s.rpe === null ? '–' : formatNumber(s.rpe)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
