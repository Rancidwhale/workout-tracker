import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../api/client'
import type { WorkoutDetail, WorkoutIn, WorkoutPage } from '../api/types'

export interface WorkoutListParams {
  page: number
  pageSize: number
  startDate?: string
  endDate?: string
}

export const workoutKeys = {
  all: ['workouts'] as const,
  list: (params: WorkoutListParams) => ['workouts', 'list', params] as const,
  detail: (id: string) => ['workouts', 'detail', id] as const,
}

export function useWorkouts(params: WorkoutListParams) {
  return useQuery({
    queryKey: workoutKeys.list(params),
    queryFn: () =>
      api<WorkoutPage>('/workouts', {
        query: {
          page: params.page,
          page_size: params.pageSize,
          start_date: params.startDate,
          end_date: params.endDate,
        },
      }),
    // Keep showing the current page while the next one loads.
    placeholderData: keepPreviousData,
  })
}

export function useWorkout(id: string | undefined) {
  return useQuery({
    queryKey: workoutKeys.detail(id ?? ''),
    queryFn: () => api<WorkoutDetail>(`/workouts/${id}`),
    enabled: Boolean(id),
  })
}

/** Any workout change can move volume, PRs and streaks. */
function useInvalidateWorkoutData() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: workoutKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['progress'] }),
    ])
}

export function useCreateWorkout() {
  const invalidate = useInvalidateWorkoutData()
  return useMutation({
    mutationFn: (input: WorkoutIn) =>
      api<WorkoutDetail>('/workouts', { method: 'POST', body: input }),
    onSuccess: invalidate,
  })
}

export function useUpdateWorkout(id: string) {
  const invalidate = useInvalidateWorkoutData()
  return useMutation({
    mutationFn: (input: WorkoutIn) =>
      api<WorkoutDetail>(`/workouts/${id}`, { method: 'PUT', body: input }),
    onSuccess: invalidate,
  })
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateWorkoutData()
  return useMutation({
    mutationFn: (id: string) => api<void>(`/workouts/${id}`, { method: 'DELETE' }),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: workoutKeys.detail(id) })
      return invalidate()
    },
  })
}
