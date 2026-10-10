/**
 * Create/edit form for a workout: name, date, notes, and an ordered list of
 * exercises, each with an ordered list of sets. Order on screen is the order
 * sent to the API (which derives order_index / set_number from it).
 */
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { MUSCLE_GROUPS } from '../api/types'
import type { Exercise, MuscleGroup, WorkoutDetail, WorkoutIn } from '../api/types'
import { useCreateExercise, useExercises } from '../hooks/useExercises'
import { formatNumber, muscleGroupLabel, today, WEIGHT_UNIT } from '../lib/format'
import { Button, Card, ErrorMessage, Input, Select, Spinner } from './ui'

// --- Draft state ----------------------------------------------------------------

interface SetDraft {
  key: string
  weight: string
  reps: string
  rpe: string
}

interface ExerciseDraft {
  key: string
  exerciseId: string
  sets: SetDraft[]
}

interface WorkoutDraft {
  name: string
  date: string
  notes: string
  exercises: ExerciseDraft[]
}

type Errors = Record<string, string>

let keySeq = 0
const newKey = () => `k${++keySeq}`

const emptySet = (): SetDraft => ({ key: newKey(), weight: '', reps: '', rpe: '' })
const emptyExercise = (): ExerciseDraft => ({ key: newKey(), exerciseId: '', sets: [emptySet()] })

function draftFromWorkout(workout?: WorkoutDetail): WorkoutDraft {
  if (!workout) return { name: '', date: today(), notes: '', exercises: [emptyExercise()] }
  return {
    name: workout.name,
    date: workout.workout_date,
    notes: workout.notes ?? '',
    exercises: workout.exercises.map((we) => ({
      key: newKey(),
      exerciseId: we.exercise_id,
      sets: we.sets.map((s) => ({
        key: newKey(),
        weight: formatPlain(s.weight),
        reps: String(s.reps),
        rpe: s.rpe === null ? '' : formatPlain(s.rpe),
      })),
    })),
  }
}

/** "70.50" -> "70.5", "60.00" -> "60" for editing. */
function formatPlain(decimal: string): string {
  return String(Number(decimal))
}

// --- Validation (mirrors backend/app/schemas/workout.py) --------------------------

const WEIGHT_RE = /^\d{1,4}(\.\d{1,2})?$/ // NUMERIC(6,2): 0 - 9999.99
const RPE_RE = /^\d{1,2}(\.\d)?$/ // NUMERIC(3,1)

function validate(draft: WorkoutDraft): Errors {
  const errors: Errors = {}
  if (!draft.name.trim()) errors.name = 'Give the workout a name'
  else if (draft.name.trim().length > 150) errors.name = 'Keep it under 150 characters'
  if (!draft.date) errors.date = 'Pick a date'

  for (const ex of draft.exercises) {
    if (!ex.exerciseId) errors[`ex.${ex.key}`] = 'Choose an exercise'
    if (ex.sets.length === 0) errors[`ex.${ex.key}`] = 'Add at least one set'
    for (const s of ex.sets) {
      const weight = s.weight.trim()
      if (!WEIGHT_RE.test(weight)) errors[`set.${s.key}.weight`] = '0 – 9999.99, up to 2 decimals'

      const reps = Number(s.reps)
      if (!/^\d+$/.test(s.reps.trim()) || reps < 1 || reps > 1000) {
        errors[`set.${s.key}.reps`] = 'Whole number, 1 – 1000'
      }

      const rpe = s.rpe.trim()
      if (rpe && (!RPE_RE.test(rpe) || Number(rpe) < 1 || Number(rpe) > 10)) {
        errors[`set.${s.key}.rpe`] = '1 – 10, one decimal'
      }
    }
  }
  return errors
}

function toPayload(draft: WorkoutDraft): WorkoutIn {
  return {
    name: draft.name.trim(),
    workout_date: draft.date,
    notes: draft.notes.trim() || null,
    exercises: draft.exercises.map((ex) => ({
      exercise_id: ex.exerciseId,
      sets: ex.sets.map((s) => ({
        weight: s.weight.trim(),
        reps: Number(s.reps),
        rpe: s.rpe.trim() || null,
      })),
    })),
  }
}

// --- Exercise picker ------------------------------------------------------------

function groupExercises(exercises: Exercise[]): [string, Exercise[]][] {
  const byGroup = new Map<string, Exercise[]>()
  for (const ex of exercises) {
    const list = byGroup.get(ex.muscle_group) ?? []
    list.push(ex)
    byGroup.set(ex.muscle_group, list)
  }
  // Known groups in their canonical order, then anything else (old custom groups).
  const order = [...MUSCLE_GROUPS, ...[...byGroup.keys()].filter((g) => !(MUSCLE_GROUPS as readonly string[]).includes(g)).sort()]
  return order
    .filter((g) => byGroup.has(g))
    .map((g) => [g, byGroup.get(g)!.sort((a, b) => a.name.localeCompare(b.name))])
}

function NewExercisePanel({ onCreated, onCancel }: { onCreated: (ex: Exercise) => void; onCancel: () => void }) {
  const createExercise = useCreateExercise()
  const [name, setName] = useState('')
  const [group, setGroup] = useState<MuscleGroup | ''>('')
  const [equipment, setEquipment] = useState('')
  const [errors, setErrors] = useState<Errors>({})

  function submit() {
    const next: Errors = {}
    if (!name.trim()) next.name = 'Enter a name'
    if (!group) next.group = 'Choose a muscle group'
    setErrors(next)
    if (Object.keys(next).length || !group) return
    createExercise.mutate(
      { name: name.trim(), muscle_group: group, equipment: equipment.trim() || null },
      { onSuccess: onCreated },
    )
  }

  return (
    // This panel sits inside the workout <form>; Enter here creates the
    // exercise instead of submitting the whole workout.
    <div
      className="mt-3 rounded-lg border border-border bg-surface-2 p-3"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
          e.preventDefault()
          submit()
        }
      }}
    >
      <p className="mb-2 text-sm font-medium">New custom exercise</p>
      <ErrorMessage error={createExercise.error} className="mb-2" />
      <div className="grid gap-2 sm:grid-cols-3">
        <Input placeholder="Name" aria-label="Exercise name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoFocus />
        <Select aria-label="Muscle group" value={group} onChange={(e) => setGroup(e.target.value as MuscleGroup)} error={errors.group}>
          <option value="">Muscle group…</option>
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {muscleGroupLabel(g)}
            </option>
          ))}
        </Select>
        <Input placeholder="Equipment (optional)" aria-label="Equipment" value={equipment} onChange={(e) => setEquipment(e.target.value)} />
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} loading={createExercise.isPending}>
          Add exercise
        </Button>
      </div>
    </div>
  )
}

// --- Form -----------------------------------------------------------------------

interface WorkoutFormProps {
  initial?: WorkoutDetail
  submitLabel: string
  submitting: boolean
  error: unknown
  onSubmit: (input: WorkoutIn) => void
  onCancel: () => void
}

export function WorkoutForm({ initial, submitLabel, submitting, error, onSubmit, onCancel }: WorkoutFormProps) {
  const exercisesQuery = useExercises()
  const [draft, setDraft] = useState<WorkoutDraft>(() => draftFromWorkout(initial))
  // Errors show (and update live) only after the first submit attempt.
  const [attempted, setAttempted] = useState(false)
  const errors = useMemo(() => (attempted ? validate(draft) : {}), [attempted, draft])
  const [creatingFor, setCreatingFor] = useState<string | null>(null)

  const grouped = useMemo(() => groupExercises(exercisesQuery.data ?? []), [exercisesQuery.data])

  const update = (fn: (d: WorkoutDraft) => WorkoutDraft) => setDraft(fn)

  const updateExercise = (key: string, fn: (ex: ExerciseDraft) => ExerciseDraft) =>
    update((d) => ({ ...d, exercises: d.exercises.map((ex) => (ex.key === key ? fn(ex) : ex)) }))

  const updateSet = (exKey: string, setKey: string, patch: Partial<SetDraft>) =>
    updateExercise(exKey, (ex) => ({ ...ex, sets: ex.sets.map((s) => (s.key === setKey ? { ...s, ...patch } : s)) }))

  function moveExercise(index: number, delta: number) {
    update((d) => {
      const exercises = [...d.exercises]
      const [moved] = exercises.splice(index, 1)
      exercises.splice(index + delta, 0, moved)
      return { ...d, exercises }
    })
  }

  function addSet(exKey: string) {
    // New sets start as a copy of the previous one: most sets repeat weight/reps.
    updateExercise(exKey, (ex) => {
      const last = ex.sets.at(-1)
      return { ...ex, sets: [...ex.sets, last ? { ...last, key: newKey() } : emptySet()] }
    })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setAttempted(true)
    if (Object.keys(validate(draft)).length) return
    onSubmit(toPayload(draft))
  }

  const totalVolume = draft.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0),
    0,
  )
  const errorCount = Object.keys(errors).length

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Card>
        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <Input
            label="Workout name"
            placeholder="e.g. Push day"
            value={draft.name}
            maxLength={150}
            onChange={(e) => update((d) => ({ ...d, name: e.target.value }))}
            error={errors.name}
          />
          <Input
            label="Date"
            type="date"
            value={draft.date}
            onChange={(e) => update((d) => ({ ...d, date: e.target.value }))}
            error={errors.date}
          />
        </div>
        <div className="mt-4">
          <label htmlFor="workout-notes" className="mb-1 block text-sm font-medium text-muted">
            Notes (optional)
          </label>
          <textarea
            id="workout-notes"
            rows={2}
            value={draft.notes}
            onChange={(e) => update((d) => ({ ...d, notes: e.target.value }))}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            placeholder="How did it feel?"
          />
        </div>
      </Card>

      {exercisesQuery.isPending && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Spinner small /> Loading exercises…
        </div>
      )}
      <ErrorMessage error={exercisesQuery.error} />

      {draft.exercises.map((ex, index) => (
        <Card key={ex.key}>
          <div className="flex items-start gap-2">
            <span className="mt-2 flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-muted">
              {index + 1}
            </span>
            <Select
              aria-label={`Exercise ${index + 1}`}
              className="min-w-0 flex-1"
              value={ex.exerciseId}
              onChange={(e) => updateExercise(ex.key, (x) => ({ ...x, exerciseId: e.target.value }))}
              error={errors[`ex.${ex.key}`]}
            >
              <option value="">Choose an exercise…</option>
              {grouped.map(([group, list]) => (
                <optgroup key={group} label={muscleGroupLabel(group)}>
                  {list.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                      {x.is_custom ? ' (custom)' : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
            <div className="flex shrink-0">
              <IconButton label="Move up" disabled={index === 0} onClick={() => moveExercise(index, -1)}>
                ↑
              </IconButton>
              <IconButton label="Move down" disabled={index === draft.exercises.length - 1} onClick={() => moveExercise(index, 1)}>
                ↓
              </IconButton>
              <IconButton
                label="Remove exercise"
                onClick={() => update((d) => ({ ...d, exercises: d.exercises.filter((x) => x.key !== ex.key) }))}
              >
                ✕
              </IconButton>
            </div>
          </div>

          {creatingFor === ex.key ? (
            <NewExercisePanel
              onCancel={() => setCreatingFor(null)}
              onCreated={(created) => {
                updateExercise(ex.key, (x) => ({ ...x, exerciseId: created.id }))
                setCreatingFor(null)
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setCreatingFor(ex.key)}
              className="mt-1 ml-8 text-xs font-medium text-accent hover:underline"
            >
              Can't find it? Create a custom exercise
            </button>
          )}

          <div className="mt-3 sm:ml-8">
            <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 px-1 pb-1 text-xs font-medium text-subtle">
              <span>Set</span>
              <span>Weight ({WEIGHT_UNIT})</span>
              <span>Reps</span>
              <span>RPE</span>
              <span />
            </div>
            {ex.sets.map((s, setIndex) => (
              <div key={s.key} className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] items-start gap-2 py-1">
                <span className="pt-2 text-center text-sm font-medium text-muted">{setIndex + 1}</span>
                <Input
                  aria-label={`Set ${setIndex + 1} weight`}
                  inputMode="decimal"
                  placeholder="0"
                  value={s.weight}
                  onChange={(e) => updateSet(ex.key, s.key, { weight: e.target.value })}
                  error={errors[`set.${s.key}.weight`]}
                />
                <Input
                  aria-label={`Set ${setIndex + 1} reps`}
                  inputMode="numeric"
                  placeholder="0"
                  value={s.reps}
                  onChange={(e) => updateSet(ex.key, s.key, { reps: e.target.value })}
                  error={errors[`set.${s.key}.reps`]}
                />
                <Input
                  aria-label={`Set ${setIndex + 1} RPE`}
                  inputMode="decimal"
                  placeholder="–"
                  value={s.rpe}
                  onChange={(e) => updateSet(ex.key, s.key, { rpe: e.target.value })}
                  error={errors[`set.${s.key}.rpe`]}
                />
                <IconButton
                  label={`Remove set ${setIndex + 1}`}
                  onClick={() => updateExercise(ex.key, (x) => ({ ...x, sets: x.sets.filter((y) => y.key !== s.key) }))}
                >
                  ✕
                </IconButton>
              </div>
            ))}
            <Button type="button" variant="ghost" className="mt-1 px-2 py-1 text-xs" onClick={() => addSet(ex.key)}>
              + Add set
            </Button>
          </div>
        </Card>
      ))}

      <Button
        type="button"
        variant="secondary"
        className="w-full border-dashed"
        onClick={() => update((d) => ({ ...d, exercises: [...d.exercises, emptyExercise()] }))}
      >
        + Add exercise
      </Button>

      <ErrorMessage error={error} />

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur">
        <p className="text-sm text-muted">
          Total volume <span className="font-semibold text-text">{formatNumber(totalVolume)} {WEIGHT_UNIT}</span>
        </p>
        {errorCount > 0 && <p className="text-sm text-danger">Fix the highlighted fields</p>}
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}

function IconButton({ label, children, ...rest }: { label: string; children: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-lg text-sm text-subtle hover:bg-surface-2 hover:text-text disabled:pointer-events-none disabled:opacity-30"
      {...rest}
    >
      {children}
    </button>
  )
}
