import {
  formatDate,
  formatDateForInput,
  capitalizeFirstLetter,
  showNotification,
} from "./utils.js"

let workouts = JSON.parse(localStorage.getItem("workouts") || "[]")
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]")
let goals = JSON.parse(localStorage.getItem("fitness_goals") || "[]")

export const workoutTypes = {
  running: {
    requiresDistance: true,
    defaultDuration: 30,
    caloriesPerMinute: 10,
    distanceLabel: "miles",
    category: "cardio",
  },
  cycling: {
    requiresDistance: true,
    defaultDuration: 45,
    caloriesPerMinute: 8,
    distanceLabel: "miles",
    category: "cardio",
  },
  swimming: {
    requiresDistance: true,
    defaultDuration: 30,
    caloriesPerMinute: 9,
    distanceLabel: "miles",
    category: "cardio",
  },
  strength: {
    requiresDistance: false,
    defaultDuration: 45,
    caloriesPerMinute: 7,
    category: "strength",
  },
  yoga: {
    requiresDistance: false,
    defaultDuration: 60,
    caloriesPerMinute: 4,
    category: "flexibility",
  },
  hiit: {
    requiresDistance: false,
    defaultDuration: 30,
    caloriesPerMinute: 12,
    category: "cardio",
  },
}

document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("date")
  const workoutTypeSelect = document.getElementById("workoutType")
  const distanceField = document.getElementById("distanceField")
  const durationInput = document.getElementById("duration")
  const caloriesInput = document.getElementById("calories")

  // Only proceed if we're on the workout logging page
  if (dateInput && workoutTypeSelect) {
    dateInput.value = formatDateForInput(new Date())

    workoutTypeSelect.addEventListener("change", (e) => {
      const workoutType = workoutTypes[e.target.value]

      if (workoutType) {
        distanceField.style.display = workoutType.requiresDistance
          ? "block"
          : "none"
        if (!workoutType.requiresDistance) {
          document.getElementById("distance").value = ""
        }

        durationInput.value = workoutType.defaultDuration

        const estimatedCalories = Math.round(
          workoutType.caloriesPerMinute * workoutType.defaultDuration
        )
        caloriesInput.value = estimatedCalories
      } else {
        distanceField.style.display = "none"
        durationInput.value = ""
        caloriesInput.value = ""
      }
    })

    durationInput.addEventListener("input", (e) => {
      const workoutType = workoutTypes[workoutTypeSelect.value]
      if (workoutType) {
        const duration = parseInt(e.target.value) || 0
        const estimatedCalories = Math.round(
          workoutType.caloriesPerMinute * duration
        )
        caloriesInput.value = estimatedCalories
      }
    })
  }

  // Call displayWorkouts regardless of which page we're on
  displayWorkouts()
})

// Make sure the form event listener only runs if the form exists
const workoutForm = document.getElementById("workoutForm")
if (workoutForm) {
  workoutForm.addEventListener("submit", (e) => {
    e.preventDefault()

    const workoutType = document.getElementById("workoutType").value
    const duration = parseInt(document.getElementById("duration").value)
    const calories = parseInt(document.getElementById("calories").value)
    const date = document.getElementById("date").value

    const workout = {
      id: Date.now(),
      type: workoutType,
      duration: duration,
      calories: calories,
      date: date,
      timestamp: new Date().toISOString(),
      category: workoutTypes[workoutType].category,
    }

    if (workoutTypes[workoutType]?.requiresDistance) {
      workout.distance =
        parseFloat(document.getElementById("distance").value) || 0
    }

    workouts.unshift(workout)

    localStorage.setItem("workouts", JSON.stringify(workouts))

    updateGoals(workout)

    e.target.reset()

    document.getElementById("date").value = formatDateForInput(new Date())

    document.getElementById("distanceField").style.display = "none"

    displayWorkouts()

    showNotification("Workout logged successfully!")
  })
}

function updateGoals(newWorkout) {
  let goalsUpdated = false

  goals = goals.map((goal) => {
    if (goal.completed) return goal

    const isRelevant = isWorkoutRelevantForGoal(newWorkout, goal)
    if (!isRelevant) return goal

    const progress = calculateGoalProgress(goal)

    if (progress >= goal.target && !goal.completed) {
      goal.completed = true
      goal.completionDate = new Date().toISOString()
      goalsUpdated = true

      setTimeout(() => {
        showNotification(
          `🎉 Congratulations! You've completed your goal: ${formatGoalTitle(
            goal
          )}`
        )
      }, 0)
    }

    return goal
  })

  if (goalsUpdated) {
    localStorage.setItem("fitness_goals", JSON.stringify(goals))
  }
}

function isWorkoutRelevantForGoal(workout, goal) {
  const workoutDate = new Date(workout.date)
  const goalStartDate = new Date(goal.startDate)

  if (!isWithinPeriod(workoutDate, goalStartDate, goal.period)) {
    return false
  }

  switch (goal.type) {
    case "distance":
      return workoutTypes[workout.type]?.requiresDistance
    case "calories":
      return true
    case "workouts":
      return true
    case "duration":
      return true
    case "specific_type":
      return workout.type === goal.workoutType
    case "category":
      return workout.category === goal.category
    default:
      return false
  }
}

function calculateGoalProgress(goal) {
  const periodStart = new Date(goal.startDate)
  const relevantWorkouts = workouts.filter((workout) => {
    const workoutDate = new Date(workout.date)
    return (
      workoutDate >= periodStart &&
      isWithinPeriod(workoutDate, periodStart, goal.period) &&
      isWorkoutRelevantForGoal(workout, goal)
    )
  })

  switch (goal.type) {
    case "distance":
      return relevantWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0)
    case "calories":
      return relevantWorkouts.reduce((sum, w) => sum + w.calories, 0)
    case "workouts":
      return relevantWorkouts.length
    case "duration":
      return relevantWorkouts.reduce((sum, w) => sum + w.duration, 0)
    case "specific_type":
      return relevantWorkouts.filter((w) => w.type === goal.workoutType).length
    case "category":
      return relevantWorkouts.filter((w) => w.category === goal.category).length
    default:
      return 0
  }
}

export function displayWorkouts() {
  const workoutList = document.getElementById("workoutList")
  // If the workoutList element doesn't exist, we're not on the workout page
  if (!workoutList) return

  workoutList.innerHTML = workouts
    .map((workout) => {
      const distanceInfo = workout.distance
        ? `<p><strong>Distance:</strong> ${workout.distance} ${
            workoutTypes[workout.type]?.distanceLabel || "miles"
          }</p>`
        : ""

      const isFavorite = favorites.includes(workout.id)
      const favoriteClass = isFavorite ? "favorite active" : "favorite"
      const favoriteIcon = isFavorite ? "★" : "☆"

      return `
      <div class="workout-card">
        <div class="workout-header">
          <h3 class="workout-type">${capitalizeFirstLetter(workout.type)}</h3>
          <div class="workout-actions">
            <button class="${favoriteClass}-btn" onclick="toggleFavorite(${
        workout.id
      })">${favoriteIcon}</button>
            <button class="delete-btn" onclick="deleteWorkout(${
              workout.id
            })">×</button>
          </div>
        </div>
        <div class="workout-details">
          <p><strong>Date:</strong> ${formatDate(workout.date)}</p>
          ${distanceInfo}
          <p><strong>Duration:</strong> ${workout.duration} minutes</p>
          <p><strong>Calories:</strong> ${workout.calories}</p>
          <p><strong>Category:</strong> ${capitalizeFirstLetter(
            workout.category
          )}</p>
        </div>
      </div>
    `
    })
    .join("")
}

window.deleteWorkout = (id) => {
  if (confirm("Are you sure you want to delete this workout?")) {
    workouts = workouts.filter((workout) => workout.id !== id)
    localStorage.setItem("workouts", JSON.stringify(workouts))

    goals = goals.map((goal) => {
      if (!goal.completed) {
        const progress = calculateGoalProgress(goal)
        if (progress < goal.target) {
          goal.completed = false
          delete goal.completionDate
        }
      }
      return goal
    })

    localStorage.setItem("fitness_goals", JSON.stringify(goals))
    displayWorkouts()
    showNotification("Workout deleted successfully!")
  }
}

function formatGoalTitle(goal) {
  const type = goal.type === "specific_type" ? goal.workoutType : goal.type
  return `${goal.target} ${getUnitLabel(type)} in a ${goal.period}`
}

function getUnitLabel(type) {
  switch (type) {
    case "distance":
      return "miles"
    case "calories":
      return "calories"
    case "workouts":
      return "workouts"
    case "duration":
      return "minutes"
    case "specific_type":
      return "workouts"
    case "category":
      return "workouts"
    default:
      return ""
  }
}

window.toggleFavorite = (id) => {
  const index = favorites.indexOf(id)
  if (index === -1) {
    favorites.push(id)
    showNotification("Workout added to favorites!")
  } else {
    favorites.splice(index, 1)
    showNotification("Workout removed from favorites!")
  }

  localStorage.setItem("favorites", JSON.stringify(favorites))
  displayWorkouts()

  // If we're on the home page, update the favorites display there too
  if (document.getElementById("workoutsList")) {
    displayHomeWorkouts()
  }
}

export function getWorkoutsData() {
  return {
    workouts,
    favorites,
  }
}
