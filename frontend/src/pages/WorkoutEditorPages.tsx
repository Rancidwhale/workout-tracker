import { Link, useNavigate, useParams } from 'react-router-dom'

import { ApiError } from '../api/client'
import { EmptyState, ErrorMessage, PageHeader, PageLoader } from '../components/ui'
import { WorkoutForm } from '../components/WorkoutForm'
import { useCreateWorkout, useUpdateWorkout, useWorkout } from '../hooks/useWorkouts'

export function NewWorkoutPage() {
  const navigate = useNavigate()
  const createWorkout = useCreateWorkout()

  return (
    <>
      <PageHeader title="Log workout" />
      <WorkoutForm
        submitLabel="Save workout"
        submitting={createWorkout.isPending}
        error={createWorkout.error}
        onSubmit={(input) =>
          createWorkout.mutate(input, { onSuccess: (created) => navigate(`/workouts/${created.id}`, { replace: true }) })
        }
        onCancel={() => navigate(-1)}
      />
    </>
  )
}

export function EditWorkoutPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: workout, isPending, error } = useWorkout(id)
  const updateWorkout = useUpdateWorkout(id)

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

  return (
    <>
      <PageHeader title="Edit workout" subtitle={workout.name} />
      <WorkoutForm
        // Remount if a different workout loads, so the draft resets.
        key={workout.id}
        initial={workout}
        submitLabel="Save changes"
        submitting={updateWorkout.isPending}
        error={updateWorkout.error}
        onSubmit={(input) => updateWorkout.mutate(input, { onSuccess: () => navigate(`/workouts/${id}`, { replace: true }) })}
        onCancel={() => navigate(`/workouts/${id}`)}
      />
    </>
  )
}
