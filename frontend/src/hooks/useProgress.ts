import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { api } from '../api/client'
import type { PersonalRecord, Streaks, VolumeTrend } from '../api/types'
import { today } from '../lib/format'

export interface VolumeParams {
  startDate: string
  endDate: string
  exerciseId?: string
}

export function useVolume(params: VolumeParams) {
  return useQuery({
    queryKey: ['progress', 'volume', params],
    queryFn: () =>
      api<VolumeTrend>('/progress/volume', {
        query: {
          start_date: params.startDate,
          end_date: params.endDate,
          exercise_id: params.exerciseId,
        },
      }),
    placeholderData: keepPreviousData,
  })
}

export function usePersonalRecords() {
  return useQuery({
    queryKey: ['progress', 'prs'],
    queryFn: () => api<PersonalRecord[]>('/progress/prs'),
  })
}

export function useStreaks() {
  // Send the user's local date: the server's "today" may be a different day.
  const asOf = today()
  return useQuery({
    queryKey: ['progress', 'streaks', asOf],
    queryFn: () => api<Streaks>('/progress/streaks', { query: { as_of: asOf } }),
  })
}
