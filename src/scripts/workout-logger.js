// Initialize workout history from localStorage or empty array
let workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
let goals = JSON.parse(localStorage.getItem('fitness_goals') || '[]');

// Workout type configurations
const workoutTypes = {
  running: {
    requiresDistance: true,
    defaultDuration: 30,
    caloriesPerMinute: 10,
    distanceLabel: 'miles',
    category: 'cardio'
  },
  cycling: {
    requiresDistance: true,
    defaultDuration: 45,
    caloriesPerMinute: 8,
    distanceLabel: 'miles',
    category: 'cardio'
  },
  swimming: {
    requiresDistance: true,
    defaultDuration: 30,
    caloriesPerMinute: 9,
    distanceLabel: 'miles',
    category: 'cardio'
  },
  strength: {
    requiresDistance: false,
    defaultDuration: 45,
    caloriesPerMinute: 7,
    category: 'strength'
  },
  yoga: {
    requiresDistance: false,
    defaultDuration: 60,
    caloriesPerMinute: 4,
    category: 'flexibility'
  },
  hiit: {
    requiresDistance: false,
    defaultDuration: 30,
    caloriesPerMinute: 12,
    category: 'cardio'
  }
};

// Format date to YYYY-MM-DD for input default value
const formatDateForInput = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

// Set up form event listeners
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('date');
  const workoutTypeSelect = document.getElementById('workoutType');
  const distanceField = document.getElementById('distanceField');
  const durationInput = document.getElementById('duration');
  const caloriesInput = document.getElementById('calories');
  
  // Set default date to today
  dateInput.value = formatDateForInput(new Date());
  
  // Handle workout type changes
  workoutTypeSelect.addEventListener('change', (e) => {
    const workoutType = workoutTypes[e.target.value];
    
    if (workoutType) {
      // Show/hide distance field
      distanceField.style.display = workoutType.requiresDistance ? 'block' : 'none';
      if (!workoutType.requiresDistance) {
        document.getElementById('distance').value = '';
      }
      
      // Set default duration
      durationInput.value = workoutType.defaultDuration;
      
      // Calculate estimated calories
      const estimatedCalories = Math.round(workoutType.caloriesPerMinute * workoutType.defaultDuration);
      caloriesInput.value = estimatedCalories;
    } else {
      distanceField.style.display = 'none';
      durationInput.value = '';
      caloriesInput.value = '';
    }
  });
  
  // Update calories when duration changes
  durationInput.addEventListener('input', (e) => {
    const workoutType = workoutTypes[workoutTypeSelect.value];
    if (workoutType) {
      const duration = parseInt(e.target.value) || 0;
      const estimatedCalories = Math.round(workoutType.caloriesPerMinute * duration);
      caloriesInput.value = estimatedCalories;
    }
  });
  
  displayWorkouts();
});

// Handle form submission
document.getElementById('workoutForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const workoutType = document.getElementById('workoutType').value;
  const duration = parseInt(document.getElementById('duration').value);
  const calories = parseInt(document.getElementById('calories').value);
  const date = document.getElementById('date').value;
  
  const workout = {
    id: Date.now(),
    type: workoutType,
    duration: duration,
    calories: calories,
    date: date,
    timestamp: new Date().toISOString(),
    category: workoutTypes[workoutType].category
  };

  // Add distance if applicable
  if (workoutTypes[workoutType]?.requiresDistance) {
    workout.distance = parseFloat(document.getElementById('distance').value) || 0;
  }

  // Add to workouts array
  workouts.unshift(workout);
  
  // Save to localStorage
  localStorage.setItem('workouts', JSON.stringify(workouts));
  
  // Update all active goals
  updateGoals(workout);
  
  // Reset form
  e.target.reset();
  
  // Set date back to today
  document.getElementById('date').value = formatDateForInput(new Date());
  
  // Hide distance field
  document.getElementById('distanceField').style.display = 'none';
  
  // Refresh display
  displayWorkouts();
  
  // Show success message
  showNotification('Workout logged successfully!');
});

function updateGoals(newWorkout) {
  let goalsUpdated = false;
  
  goals = goals.map(goal => {
    if (goal.completed) return goal;
    
    const isRelevant = isWorkoutRelevantForGoal(newWorkout, goal);
    if (!isRelevant) return goal;
    
    const progress = calculateGoalProgress(goal);
    
    if (progress >= goal.target && !goal.completed) {
      goal.completed = true;
      goal.completionDate = new Date().toISOString();
      goalsUpdated = true;
      
      // Schedule notification for the next frame to avoid blocking
      setTimeout(() => {
        showNotification(`🎉 Congratulations! You've completed your goal: ${formatGoalTitle(goal)}`);
      }, 0);
    }
    
    return goal;
  });
  
  if (goalsUpdated) {
    localStorage.setItem('fitness_goals', JSON.stringify(goals));
  }
}

function isWorkoutRelevantForGoal(workout, goal) {
  const workoutDate = new Date(workout.date);
  const goalStartDate = new Date(goal.startDate);
  
  // Check if workout is within goal period
  if (!isWithinPeriod(workoutDate, goalStartDate, goal.period)) {
    return false;
  }
  
  // Check if workout type matches goal criteria
  switch (goal.type) {
    case 'distance':
      return workoutTypes[workout.type]?.requiresDistance;
    case 'calories':
      return true; // All workouts contribute to calorie goals
    case 'workouts':
      return true; // All workouts count towards workout count goals
    case 'duration':
      return true; // All workouts contribute to duration goals
    case 'specific_type':
      return workout.type === goal.workoutType;
    case 'category':
      return workout.category === goal.category;
    default:
      return false;
  }
}

function calculateGoalProgress(goal) {
  const periodStart = new Date(goal.startDate);
  const relevantWorkouts = workouts.filter(workout => {
    const workoutDate = new Date(workout.date);
    return workoutDate >= periodStart && 
           isWithinPeriod(workoutDate, periodStart, goal.period) &&
           isWorkoutRelevantForGoal(workout, goal);
  });
  
  switch (goal.type) {
    case 'distance':
      return relevantWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
    case 'calories':
      return relevantWorkouts.reduce((sum, w) => sum + w.calories, 0);
    case 'workouts':
      return relevantWorkouts.length;
    case 'duration':
      return relevantWorkouts.reduce((sum, w) => sum + w.duration, 0);
    case 'specific_type':
      return relevantWorkouts.filter(w => w.type === goal.workoutType).length;
    case 'category':
      return relevantWorkouts.filter(w => w.category === goal.category).length;
    default:
      return 0;
  }
}

// Display workouts
function displayWorkouts() {
  const workoutList = document.getElementById('workoutList');
  workoutList.innerHTML = workouts.map(workout => {
    const workoutConfig = workoutTypes[workout.type];
    const distanceInfo = workout.distance ? 
      `<p><strong>Distance:</strong> ${workout.distance} ${workoutConfig?.distanceLabel || 'miles'}</p>` : '';
    
    return `
      <div class="workout-card">
        <div class="workout-header">
          <h3 class="workout-type">${capitalizeFirstLetter(workout.type)}</h3>
          <button class="delete-btn" onclick="deleteWorkout(${workout.id})">×</button>
        </div>
        <div class="workout-details">
          <p><strong>Date:</strong> ${formatDate(workout.date)}</p>
          ${distanceInfo}
          <p><strong>Duration:</strong> ${workout.duration} minutes</p>
          <p><strong>Calories:</strong> ${workout.calories}</p>
          <p><strong>Category:</strong> ${capitalizeFirstLetter(workout.category)}</p>
        </div>
      </div>
    `;
  }).join('');
}

// Delete workout
window.deleteWorkout = (id) => {
  if (confirm('Are you sure you want to delete this workout?')) {
    workouts = workouts.filter(workout => workout.id !== id);
    localStorage.setItem('workouts', JSON.stringify(workouts));
    
    // Recalculate all active goals
    goals = goals.map(goal => {
      if (!goal.completed) {
        const progress = calculateGoalProgress(goal);
        if (progress < goal.target) {
          goal.completed = false;
          delete goal.completionDate;
        }
      }
      return goal;
    });
    
    localStorage.setItem('fitness_goals', JSON.stringify(goals));
    displayWorkouts();
    showNotification('Workout deleted successfully!');
  }
};

function isWithinPeriod(date, startDate, period) {
  const endDate = new Date(startDate);
  if (period === 'week') {
    endDate.setDate(endDate.getDate() + 7);
  } else if (period === 'month') {
    endDate.setMonth(endDate.getMonth() + 1);
  }
  return date >= startDate && date <= endDate;
}

function formatGoalTitle(goal) {
  const type = goal.type === 'specific_type' ? goal.workoutType : goal.type;
  return `${goal.target} ${getUnitLabel(type)} in a ${goal.period}`;
}

function getUnitLabel(type) {
  switch (type) {
    case 'distance': return 'miles';
    case 'calories': return 'calories';
    case 'workouts': return 'workouts';
    case 'duration': return 'minutes';
    case 'specific_type': return 'workouts';
    case 'category': return 'workouts';
    default: return '';
  }
}

// Helper functions
function capitalizeFirstLetter(string) {
  if (typeof string !== "string") return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}