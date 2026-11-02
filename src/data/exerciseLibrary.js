const exercisesByCategory = {
  Chest: [
    'Barbell Bench Press', 'Incline Barbell Bench Press', 'Decline Barbell Bench Press',
    'Dumbbell Bench Press', 'Incline Dumbbell Bench Press', 'Decline Dumbbell Bench Press',
    'Dumbbell Chest Fly', 'Incline Dumbbell Fly', 'Cable Chest Fly', 'Low-to-High Cable Fly',
    'High-to-Low Cable Fly', 'Pec Deck Fly', 'Machine Chest Press', 'Smith Machine Bench Press',
    'Push-Up', 'Wide-Grip Push-Up', 'Incline Push-Up', 'Decline Push-Up', 'Weighted Push-Up',
    'Chest Dip'
  ],
  Back: [
    'Conventional Deadlift', 'Rack Pull', 'Barbell Bent-Over Row', 'Pendlay Row',
    'One-Arm Dumbbell Row', 'Chest-Supported Dumbbell Row', 'Chest-Supported Machine Row',
    'Seated Cable Row', 'Wide-Grip Seated Cable Row', 'Close-Grip Seated Cable Row',
    'Lat Pulldown', 'Wide-Grip Lat Pulldown', 'Close-Grip Lat Pulldown',
    'Reverse-Grip Lat Pulldown', 'Assisted Pull-Up', 'Pull-Up', 'Neutral-Grip Pull-Up',
    'Straight-Arm Pulldown', 'T-Bar Row', 'Machine Row', 'Inverted Row', 'Back Extension',
    'Superman Hold', 'Dumbbell Shrug', 'Barbell Shrug'
  ],
  Shoulders: [
    'Barbell Overhead Press', 'Seated Dumbbell Shoulder Press', 'Standing Dumbbell Shoulder Press',
    'Arnold Press', 'Machine Shoulder Press', 'Dumbbell Lateral Raise', 'Cable Lateral Raise',
    'Lean-Away Cable Lateral Raise', 'Dumbbell Front Raise', 'Plate Front Raise',
    'Rear Delt Dumbbell Fly', 'Reverse Pec Deck', 'Face Pull', 'Cable Rear Delt Fly',
    'Upright Row', 'Pike Push-Up', 'Handstand Push-Up', 'Landmine Shoulder Press'
  ],
  Biceps: [
    'Barbell Biceps Curl', 'EZ-Bar Curl', 'Dumbbell Biceps Curl', 'Alternating Dumbbell Curl',
    'Hammer Curl', 'Cross-Body Hammer Curl', 'Incline Dumbbell Curl', 'Preacher Curl',
    'Cable Biceps Curl', 'Rope Hammer Curl', 'Concentration Curl', 'Spider Curl', 'Reverse Curl',
    'Zottman Curl', 'Machine Biceps Curl'
  ],
  Triceps: [
    'Rope Triceps Pushdown', 'Straight-Bar Triceps Pushdown', 'Reverse-Grip Triceps Pushdown',
    'Overhead Cable Triceps Extension', 'Overhead Dumbbell Triceps Extension',
    'EZ-Bar Skull Crusher', 'Lying Triceps Extension', 'Close-Grip Bench Press', 'Bench Dip',
    'Parallel-Bar Dip', 'Dumbbell Triceps Kickback', 'Cable Triceps Kickback', 'Diamond Push-Up',
    'JM Press'
  ],
  Legs: [
    'Barbell Back Squat', 'Barbell Front Squat', 'Goblet Squat', 'Smith Machine Squat',
    'Hack Squat', 'Leg Press', 'Bulgarian Split Squat', 'Walking Lunge', 'Reverse Lunge',
    'Forward Lunge', 'Dumbbell Lunge', 'Step-Up', 'Leg Extension', 'Seated Leg Curl',
    'Lying Leg Curl', 'Romanian Deadlift', 'Dumbbell Romanian Deadlift', 'Stiff-Leg Deadlift',
    'Good Morning', 'Hip Thrust', 'Barbell Hip Thrust', 'Glute Bridge',
    'Single-Leg Glute Bridge', 'Cable Pull-Through', 'Sumo Deadlift', 'Sumo Squat',
    'Kettlebell Goblet Squat', 'Single-Leg Romanian Deadlift', 'Glute Kickback',
    'Cable Glute Kickback', 'Hip Abduction Machine', 'Hip Adduction Machine',
    'Standing Calf Raise', 'Seated Calf Raise', 'Single-Leg Calf Raise', 'Leg Press Calf Raise',
    'Donkey Calf Raise'
  ],
  Core: [
    'Plank', 'Side Plank', 'Reverse Plank', 'Reverse Crunch', 'Bicycle Crunch', 'Crunch',
    'Weighted Crunch', 'Sit-Up', 'Decline Sit-Up', 'Hanging Knee Raise', 'Hanging Leg Raise',
    "Captain's Chair Knee Raise", 'Lying Leg Raise', 'Toe Touch', 'Russian Twist', 'Cable Crunch',
    'Ab Wheel Rollout', 'Dead Bug', 'Bird Dog', 'Pallof Press', 'Mountain Climber',
    'Flutter Kick', 'Hollow Body Hold', 'Wood Chop'
  ],
  Cardio: [
    'Outdoor Run', 'Treadmill Run', 'Sprint', 'Interval Run', 'Outdoor Walk', 'Treadmill Walk',
    'Incline Walk', 'Hiking', 'Outdoor Cycling', 'Stationary Bike', 'Spin Bike',
    'Mountain Biking', 'Swimming', 'Rowing Machine', 'Outdoor Rowing', 'Elliptical Trainer',
    'Stair Climber', 'Ski Erg', 'Air Bike', 'Jump Rope'
  ],
  'Full Body': [
    'Kettlebell Swing', 'Kettlebell Clean', 'Kettlebell Snatch', 'Turkish Get-Up',
    'Barbell Clean', 'Power Clean', 'Clean and Press', 'Clean and Jerk', 'Barbell Snatch',
    'Thruster', 'Burpee', 'Man Maker', "Farmer's Carry", 'Suitcase Carry', 'Sled Push',
    'Sled Pull', 'Battle Rope Waves'
  ]
};

export const exerciseLibrary = Object.entries(exercisesByCategory).flatMap(
  ([category, names]) => names.map((name) => ({ name, category }))
);

export const WORKOUT_TYPES = [
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Cardio',
  'Running',
  'Push',
  'Pull',
  'Upper Body',
  'Lower Body'
];

export const CARDIO_EXERCISES = new Set(
  exercisesByCategory.Cardio
    .filter((name) => name !== 'Jump Rope')
    .map((name) => name.toLocaleLowerCase())
);
