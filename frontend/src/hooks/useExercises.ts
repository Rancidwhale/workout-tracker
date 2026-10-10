import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../api/client'
import type { Exercise, ExerciseCreate } from '../api/types'

const exerciseKeys = {
  all: ['exercises'] as const,
}

/** The full library (built-ins + the user's custom exercises). It rarely changes. */
export function useExercises() {
  return useQuery({
    queryKey: exerciseKeys.all,
    queryFn: () => api<Exercise[]>('/exercises'),
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ExerciseCreate) =>
      api<Exercise>('/exercises', { method: 'POST', body: input }),
    onSuccess: (created) => {
      queryClient.setQueryData<Exercise[]>(exerciseKeys.all, (prev) =>
        prev ? [...prev, created].sort((a, b) => a.name.localeCompare(b.name)) : prev,
      )
    },
  })
}
