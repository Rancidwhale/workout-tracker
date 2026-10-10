// Mirrors the backend's Pydantic schemas (backend/app/schemas/*).
// Dates are ISO "YYYY-MM-DD" strings; decimals arrive as strings on workout
// sets (exact NUMERIC) and as numbers on progress aggregates.

export interface User {
  id: string
  email: string
  display_name: string | null
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'traps',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'quads',
  'hamstrings',
  'glutes',
  'adductors',
  'calves',
  'core',
  'full_body',
] as const
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export interface Exercise {
  id: string
  name: string
  muscle_group: string
  equipment: string | null
  is_custom: boolean
}

export interface ExerciseCreate {
  name: string
  muscle_group: MuscleGroup
  equipment?: string | null
}

export interface SetIn {
  weight: string
  reps: number
  rpe?: string | null
}

export interface WorkoutExerciseIn {
  exercise_id: string
  sets: SetIn[]
}

export interface WorkoutIn {
  name: string
  workout_date: string
  notes: string | null
  exercises: WorkoutExerciseIn[]
}

export interface WorkoutSet {
  id: string
  set_number: number
  weight: string
  reps: number
  rpe: string | null
}

export interface WorkoutExercise {
  id: string
  exercise_id: string
  exercise_name: string
  order_index: number
  sets: WorkoutSet[]
}

export interface WorkoutSummary {
  id: string
  name: string
  workout_date: string
  notes: string | null
  created_at: string
}

export interface WorkoutDetail extends WorkoutSummary {
  exercises: WorkoutExercise[]
}

export interface WorkoutPage {
  items: WorkoutSummary[]
  total: number
  page: number
  page_size: number
}

export interface VolumeWeek {
  week_start: string
  total_volume: number
  workout_count: number
  set_count: number
}

export interface VolumeTrend {
  start_date: string
  end_date: string
  exercise_id: string | null
  weeks: VolumeWeek[]
}

export interface PersonalRecord {
  exercise_id: string
  exercise_name: string
  weight: number
  reps: number
  estimated_1rm: number
  workout_id: string
  workout_date: string
}

export interface Streaks {
  current_streak: number
  longest_streak: number
  total_workout_days: number
  last_workout_date: string | null
}
