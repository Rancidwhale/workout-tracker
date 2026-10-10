"""seed built-in exercise library

Built-in exercises are rows with created_by IS NULL and is_custom = false.
Each is filed under its primary muscle group. The data is written out here
(not imported from app code) so this migration stays the same even if the
app's constants change later.

Revision ID: b7c1e2d3f4a5
Revises: a047ad150ac0
Create Date: 2026-10-10 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c1e2d3f4a5'
down_revision: Union[str, Sequence[str], None] = 'a047ad150ac0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# (name, equipment), grouped by primary muscle group.
EXERCISES = {
    "chest": [
        ("Barbell Bench Press", "barbell"),
        ("Incline Barbell Bench Press", "barbell"),
        ("Decline Barbell Bench Press", "barbell"),
        ("Close-Grip Bench Press", "barbell"),
        ("Dumbbell Bench Press", "dumbbell"),
        ("Incline Dumbbell Bench Press", "dumbbell"),
        ("Decline Dumbbell Bench Press", "dumbbell"),
        ("Dumbbell Fly", "dumbbell"),
        ("Incline Dumbbell Fly", "dumbbell"),
        ("Dumbbell Pullover", "dumbbell"),
        ("Smith Machine Bench Press", "smith machine"),
        ("Smith Machine Incline Bench Press", "smith machine"),
        ("Machine Chest Press", "machine"),
        ("Incline Machine Chest Press", "machine"),
        ("Pec Deck", "machine"),
        ("Cable Crossover", "cable"),
        ("Low-to-High Cable Fly", "cable"),
        ("High-to-Low Cable Fly", "cable"),
        ("Push-Up", "bodyweight"),
        ("Incline Push-Up", "bodyweight"),
        ("Decline Push-Up", "bodyweight"),
        ("Chest Dip", "bodyweight"),
        ("Floor Press", "barbell"),
        ("Landmine Press", "barbell"),
    ],
    "back": [
        ("Deadlift", "barbell"),
        ("Barbell Row", "barbell"),
        ("Pendlay Row", "barbell"),
        ("T-Bar Row", "barbell"),
        ("Rack Pull", "barbell"),
        ("One-Arm Dumbbell Row", "dumbbell"),
        ("Chest-Supported Dumbbell Row", "dumbbell"),
        ("Pull-Up", "bodyweight"),
        ("Chin-Up", "bodyweight"),
        ("Neutral-Grip Pull-Up", "bodyweight"),
        ("Assisted Pull-Up", "machine"),
        ("Inverted Row", "bodyweight"),
        ("Lat Pulldown", "cable"),
        ("Close-Grip Lat Pulldown", "cable"),
        ("Single-Arm Lat Pulldown", "cable"),
        ("Straight-Arm Pulldown", "cable"),
        ("Seated Cable Row", "cable"),
        ("Single-Arm Cable Row", "cable"),
        ("Machine Row", "machine"),
        ("Chest-Supported Machine Row", "machine"),
        ("Back Extension", "bodyweight"),
        ("Good Morning", "barbell"),
        ("Kettlebell Row", "kettlebell"),
        ("Meadows Row", "barbell"),
    ],
    "traps": [
        ("Barbell Shrug", "barbell"),
        ("Dumbbell Shrug", "dumbbell"),
        ("Trap Bar Shrug", "trap bar"),
        ("Smith Machine Shrug", "smith machine"),
        ("Cable Shrug", "cable"),
        ("Farmer's Walk", "dumbbell"),
    ],
    "shoulders": [
        ("Overhead Press", "barbell"),
        ("Seated Barbell Overhead Press", "barbell"),
        ("Push Press", "barbell"),
        ("Dumbbell Shoulder Press", "dumbbell"),
        ("Arnold Press", "dumbbell"),
        ("Machine Shoulder Press", "machine"),
        ("Smith Machine Shoulder Press", "smith machine"),
        ("Dumbbell Lateral Raise", "dumbbell"),
        ("Cable Lateral Raise", "cable"),
        ("Machine Lateral Raise", "machine"),
        ("Dumbbell Front Raise", "dumbbell"),
        ("Cable Front Raise", "cable"),
        ("Plate Front Raise", "plate"),
        ("Rear Delt Dumbbell Fly", "dumbbell"),
        ("Reverse Pec Deck", "machine"),
        ("Cable Rear Delt Fly", "cable"),
        ("Face Pull", "cable"),
        ("Upright Row", "barbell"),
        ("Cable Upright Row", "cable"),
        ("Pike Push-Up", "bodyweight"),
        ("Handstand Push-Up", "bodyweight"),
        ("Band Pull-Apart", "band"),
    ],
    "biceps": [
        ("Barbell Curl", "barbell"),
        ("EZ-Bar Curl", "ez bar"),
        ("Dumbbell Curl", "dumbbell"),
        ("Hammer Curl", "dumbbell"),
        ("Incline Dumbbell Curl", "dumbbell"),
        ("Concentration Curl", "dumbbell"),
        ("Preacher Curl", "ez bar"),
        ("Dumbbell Preacher Curl", "dumbbell"),
        ("Machine Preacher Curl", "machine"),
        ("Cable Curl", "cable"),
        ("Rope Hammer Curl", "cable"),
        ("Bayesian Cable Curl", "cable"),
        ("Spider Curl", "dumbbell"),
        ("Drag Curl", "barbell"),
        ("Cross-Body Hammer Curl", "dumbbell"),
    ],
    "triceps": [
        ("Tricep Pushdown", "cable"),
        ("Rope Pushdown", "cable"),
        ("Single-Arm Cable Pushdown", "cable"),
        ("Overhead Cable Tricep Extension", "cable"),
        ("Overhead Dumbbell Tricep Extension", "dumbbell"),
        ("Skull Crusher", "ez bar"),
        ("Dumbbell Skull Crusher", "dumbbell"),
        ("JM Press", "barbell"),
        ("Tricep Dip", "bodyweight"),
        ("Bench Dip", "bodyweight"),
        ("Machine Tricep Dip", "machine"),
        ("Dumbbell Tricep Kickback", "dumbbell"),
        ("Cable Tricep Kickback", "cable"),
        ("Diamond Push-Up", "bodyweight"),
        ("Machine Tricep Extension", "machine"),
    ],
    "forearms": [
        ("Barbell Wrist Curl", "barbell"),
        ("Dumbbell Wrist Curl", "dumbbell"),
        ("Reverse Wrist Curl", "dumbbell"),
        ("Reverse Barbell Curl", "barbell"),
        ("Reverse EZ-Bar Curl", "ez bar"),
        ("Wrist Roller", "other"),
        ("Plate Pinch", "plate"),
        ("Dead Hang", "bodyweight"),
    ],
    "quads": [
        ("Back Squat", "barbell"),
        ("Front Squat", "barbell"),
        ("High-Bar Squat", "barbell"),
        ("Pause Squat", "barbell"),
        ("Box Squat", "barbell"),
        ("Goblet Squat", "dumbbell"),
        ("Smith Machine Squat", "smith machine"),
        ("Hack Squat", "machine"),
        ("Pendulum Squat", "machine"),
        ("Belt Squat", "machine"),
        ("Leg Press", "machine"),
        ("Single-Leg Leg Press", "machine"),
        ("Leg Extension", "machine"),
        ("Bulgarian Split Squat", "dumbbell"),
        ("Barbell Bulgarian Split Squat", "barbell"),
        ("Walking Lunge", "dumbbell"),
        ("Reverse Lunge", "dumbbell"),
        ("Barbell Lunge", "barbell"),
        ("Step-Up", "dumbbell"),
        ("Sissy Squat", "bodyweight"),
        ("Bodyweight Squat", "bodyweight"),
        ("Pistol Squat", "bodyweight"),
        ("Wall Sit", "bodyweight"),
        ("Zercher Squat", "barbell"),
    ],
    "hamstrings": [
        ("Romanian Deadlift", "barbell"),
        ("Dumbbell Romanian Deadlift", "dumbbell"),
        ("Single-Leg Romanian Deadlift", "dumbbell"),
        ("Stiff-Leg Deadlift", "barbell"),
        ("Lying Leg Curl", "machine"),
        ("Seated Leg Curl", "machine"),
        ("Standing Leg Curl", "machine"),
        ("Nordic Hamstring Curl", "bodyweight"),
        ("Glute-Ham Raise", "bodyweight"),
        ("Stability Ball Leg Curl", "other"),
        ("Kettlebell Swing", "kettlebell"),
        ("Cable Pull-Through", "cable"),
    ],
    "glutes": [
        ("Barbell Hip Thrust", "barbell"),
        ("Machine Hip Thrust", "machine"),
        ("Single-Leg Hip Thrust", "bodyweight"),
        ("Glute Bridge", "bodyweight"),
        ("Barbell Glute Bridge", "barbell"),
        ("Sumo Deadlift", "barbell"),
        ("Cable Glute Kickback", "cable"),
        ("Machine Glute Kickback", "machine"),
        ("Hip Abduction Machine", "machine"),
        ("Cable Hip Abduction", "cable"),
        ("Banded Lateral Walk", "band"),
        ("Frog Pump", "bodyweight"),
        ("Curtsy Lunge", "dumbbell"),
        ("Reverse Hyperextension", "machine"),
    ],
    "adductors": [
        ("Hip Adduction Machine", "machine"),
        ("Cable Hip Adduction", "cable"),
        ("Copenhagen Plank", "bodyweight"),
        ("Sumo Squat", "dumbbell"),
        ("Lateral Lunge", "dumbbell"),
    ],
    "calves": [
        ("Standing Calf Raise", "machine"),
        ("Seated Calf Raise", "machine"),
        ("Smith Machine Calf Raise", "smith machine"),
        ("Leg Press Calf Raise", "machine"),
        ("Dumbbell Calf Raise", "dumbbell"),
        ("Single-Leg Calf Raise", "bodyweight"),
        ("Donkey Calf Raise", "machine"),
        ("Tibialis Raise", "other"),
    ],
    "core": [
        ("Plank", "bodyweight"),
        ("Side Plank", "bodyweight"),
        ("Crunch", "bodyweight"),
        ("Cable Crunch", "cable"),
        ("Machine Crunch", "machine"),
        ("Decline Crunch", "bodyweight"),
        ("Sit-Up", "bodyweight"),
        ("Hanging Leg Raise", "bodyweight"),
        ("Hanging Knee Raise", "bodyweight"),
        ("Captain's Chair Leg Raise", "machine"),
        ("Lying Leg Raise", "bodyweight"),
        ("Ab Wheel Rollout", "other"),
        ("Russian Twist", "plate"),
        ("Cable Woodchopper", "cable"),
        ("Pallof Press", "cable"),
        ("Dead Bug", "bodyweight"),
        ("Bicycle Crunch", "bodyweight"),
        ("Mountain Climber", "bodyweight"),
        ("Hollow Body Hold", "bodyweight"),
        ("Dragon Flag", "bodyweight"),
        ("Toes-to-Bar", "bodyweight"),
        ("V-Up", "bodyweight"),
        ("Suitcase Carry", "dumbbell"),
    ],
    "full_body": [
        ("Power Clean", "barbell"),
        ("Hang Clean", "barbell"),
        ("Clean and Jerk", "barbell"),
        ("Snatch", "barbell"),
        ("Hang Snatch", "barbell"),
        ("Thruster", "barbell"),
        ("Trap Bar Deadlift", "trap bar"),
        ("Dumbbell Thruster", "dumbbell"),
        ("Kettlebell Clean and Press", "kettlebell"),
        ("Turkish Get-Up", "kettlebell"),
        ("Burpee", "bodyweight"),
        ("Sled Push", "sled"),
        ("Sled Pull", "sled"),
        ("Battle Ropes", "other"),
        ("Medicine Ball Slam", "other"),
        ("Box Jump", "bodyweight"),
        ("Man Maker", "dumbbell"),
    ],
}


exercises_table = sa.table(
    "exercises",
    sa.column("name", sa.String),
    sa.column("muscle_group", sa.String),
    sa.column("equipment", sa.String),
    sa.column("is_custom", sa.Boolean),
)


def upgrade() -> None:
    """Upgrade schema."""
    # At most one built-in exercise per name (case-insensitive). The existing
    # (name, created_by) unique constraint doesn't cover this, because NULLs
    # never conflict in a unique constraint.
    op.create_index(
        "uq_exercises_builtin_name",
        "exercises",
        [sa.text("lower(name)")],
        unique=True,
        postgresql_where=sa.text("created_by IS NULL"),
    )

    # Skip names that already exist as built-ins (e.g. rows added by hand on a
    # dev DB), so the migration is safe to run against existing data.
    existing = {
        name.lower()
        for (name,) in op.get_bind().execute(
            sa.text("SELECT name FROM exercises WHERE created_by IS NULL")
        )
    }
    rows = [
        {"name": name, "muscle_group": group, "equipment": equipment, "is_custom": False}
        for group, items in EXERCISES.items()
        for name, equipment in items
        if name.lower() not in existing
    ]
    if rows:
        op.bulk_insert(exercises_table, rows)


def downgrade() -> None:
    """Downgrade schema."""
    # Remove only seeded exercises that no workout references; ones that have
    # been logged stay so users' workout history isn't broken.
    names = [name for items in EXERCISES.values() for name, _ in items]
    op.get_bind().execute(
        sa.text(
            "DELETE FROM exercises e "
            "WHERE e.created_by IS NULL AND e.name = ANY(:names) "
            "AND NOT EXISTS (SELECT 1 FROM workout_exercises we WHERE we.exercise_id = e.id)"
        ),
        {"names": names},
    )
    op.drop_index("uq_exercises_builtin_name", table_name="exercises")
