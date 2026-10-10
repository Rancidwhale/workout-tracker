"""
Progress / analytics routes. All aggregation is scoped to the caller.

GET /progress/volume   - weekly training volume (sum of weight * reps)
GET /progress/prs      - heaviest set per exercise (window function)
GET /progress/streaks  - current and longest daily workout streaks
"""
import uuid
from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Date, cast, distinct, func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.excercise import Exercise
from app.models.user import User
from app.models.workout import Workout
from app.models.workout_excercise import WorkoutExercise
from app.models.workout_set import WorkoutSet
from app.schemas.progress import PersonalRecord, Streaks, VolumeTrend, VolumeWeek

router = APIRouter()

DEFAULT_VOLUME_WEEKS = 12
MAX_VOLUME_WEEKS = 156


def _monday(d: date) -> date:
    return d - timedelta(days=d.weekday())


@router.get("/volume", response_model=VolumeTrend)
def volume_trend(
    start_date: Optional[date] = Query(default=None, description="Inclusive; default 12 weeks back"),
    end_date: Optional[date] = Query(default=None, description="Inclusive; default today"),
    exercise_id: Optional[uuid.UUID] = Query(default=None, description="Limit to one exercise"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    end_date = end_date or date.today()
    start_date = start_date or _monday(end_date) - timedelta(weeks=DEFAULT_VOLUME_WEEKS - 1)
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start_date must be on or before end_date",
        )
    if (_monday(end_date) - _monday(start_date)).days // 7 + 1 > MAX_VOLUME_WEEKS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Date range may span at most {MAX_VOLUME_WEEKS} weeks",
        )

    # date_trunc('week') buckets by ISO week (Monday start).
    week_start = cast(func.date_trunc("week", Workout.workout_date), Date).label("week_start")
    stmt = (
        select(
            week_start,
            func.sum(WorkoutSet.weight * WorkoutSet.reps).label("total_volume"),
            func.count(distinct(Workout.id)).label("workout_count"),
            func.count(WorkoutSet.id).label("set_count"),
        )
        .join(WorkoutExercise, WorkoutExercise.workout_id == Workout.id)
        .join(WorkoutSet, WorkoutSet.workout_exercise_id == WorkoutExercise.id)
        .where(
            Workout.user_id == current_user.id,
            Workout.workout_date >= start_date,
            Workout.workout_date <= end_date,
        )
        .group_by(week_start)
    )
    if exercise_id:
        stmt = stmt.where(WorkoutExercise.exercise_id == exercise_id)

    by_week = {row.week_start: row for row in db.execute(stmt)}

    # Fill weeks with no training with zeros so the series is continuous for charts.
    weeks: List[VolumeWeek] = []
    week = _monday(start_date)
    while week <= end_date:
        row = by_week.get(week)
        weeks.append(
            VolumeWeek(
                week_start=week,
                total_volume=float(row.total_volume) if row else 0.0,
                workout_count=row.workout_count if row else 0,
                set_count=row.set_count if row else 0,
            )
        )
        week += timedelta(weeks=1)

    return VolumeTrend(
        start_date=start_date, end_date=end_date, exercise_id=exercise_id, weeks=weeks
    )


@router.get("/prs", response_model=List[PersonalRecord])
def personal_records(
    exercise_id: Optional[uuid.UUID] = Query(default=None, description="Limit to one exercise"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Rank every set per exercise: heaviest first, then most reps, then the
    # earliest date (the day the PR was first hit). rank 1 is the PR.
    rank = func.row_number().over(
        partition_by=WorkoutExercise.exercise_id,
        order_by=(WorkoutSet.weight.desc(), WorkoutSet.reps.desc(), Workout.workout_date.asc()),
    ).label("rank")
    ranked = (
        select(
            WorkoutExercise.exercise_id,
            Exercise.name.label("exercise_name"),
            WorkoutSet.weight,
            WorkoutSet.reps,
            Workout.id.label("workout_id"),
            Workout.workout_date,
            rank,
        )
        .join(WorkoutExercise, WorkoutExercise.workout_id == Workout.id)
        .join(WorkoutSet, WorkoutSet.workout_exercise_id == WorkoutExercise.id)
        .join(Exercise, Exercise.id == WorkoutExercise.exercise_id)
        .where(Workout.user_id == current_user.id)
    )
    if exercise_id:
        ranked = ranked.where(WorkoutExercise.exercise_id == exercise_id)
    ranked = ranked.subquery()

    rows = db.execute(
        select(ranked).where(ranked.c.rank == 1).order_by(ranked.c.exercise_name)
    )
    return [
        PersonalRecord(
            exercise_id=row.exercise_id,
            exercise_name=row.exercise_name,
            weight=float(row.weight),
            reps=row.reps,
            estimated_1rm=round(float(row.weight) * (1 + row.reps / 30), 2),
            workout_id=row.workout_id,
            workout_date=row.workout_date,
        )
        for row in rows
    ]


@router.get("/streaks", response_model=Streaks)
def streaks(
    as_of: Optional[date] = Query(
        default=None,
        description="The client's local 'today'; defaults to the server date",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    as_of = as_of or date.today()
    days = db.scalars(
        select(distinct(Workout.workout_date))
        .where(Workout.user_id == current_user.id, Workout.workout_date <= as_of)
        .order_by(Workout.workout_date)
    ).all()

    # Single pass over the sorted distinct dates.
    longest = run = 0
    previous: Optional[date] = None
    for day in days:
        run = run + 1 if previous and day - previous == timedelta(days=1) else 1
        longest = max(longest, run)
        previous = day

    # The streak is still alive if the last workout was today or yesterday.
    current = run if previous and as_of - previous <= timedelta(days=1) else 0

    return Streaks(
        current_streak=current,
        longest_streak=longest,
        total_workout_days=len(days),
        last_workout_date=previous,
    )
