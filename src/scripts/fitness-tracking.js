import {
  formatDate,
  capitalizeFirstLetter,
  showNotification,
  getUnitLabel,
  isWithinPeriod,
} from "./utils.js"

let goals = JSON.parse(localStorage.getItem("fitness_goals") || "[]")
const workouts = JSON.parse(localStorage.getItem("workouts") || "[]")

console.log(workouts)

document.addEventListener("DOMContentLoaded", () => {
  displayGoals()
  setupGoalTypeHandler()

  document
    .getElementById("goalForm")
    .addEventListener("submit", handleGoalSubmission)
})

function setupGoalTypeHandler() {
  const goalTypeSelect = document.getElementById("goalType")
  const workoutTypeField = document.getElementById("workoutTypeField")
  const categoryField = document.getElementById("categoryField")

  goalTypeSelect.addEventListener("change", (e) => {
    const goalType = e.target.value

    workoutTypeField.style.display =
      goalType === "specific_type" ? "block" : "none"

    categoryField.style.display = goalType === "category" ? "block" : "none"

    updateTargetLabel(goalType)
  })
}

function updateTargetLabel(goalType) {
  const targetLabel = document.querySelector('label[for="goalTarget"]')
  switch (goalType) {
    case "distance":
      targetLabel.textContent = "Target Distance (miles)"
      break
    case "calories":
      targetLabel.textContent = "Target Calories"
      break
    case "workouts":
      targetLabel.textContent = "Target Number of Workouts"
      break
    case "duration":
      targetLabel.textContent = "Target Duration (minutes)"
      break
    case "specific_type":
      targetLabel.textContent = "Target Number of Workouts"
      break
    case "category":
      targetLabel.textContent = "Target Number of Workouts"
      break
    default:
      targetLabel.textContent = "Target Amount"
  }
}

function handleGoalSubmission(e) {
  e.preventDefault()

  const goalType = document.getElementById("goalType").value
  const currentDate = new Date()

  // Format the date to reset the time to midnight to avoid time comparison issues
  const formattedDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  )

  console.log("Setting goal start date to:", formattedDate)

  const goal = {
    id: Date.now(),
    type: goalType,
    target: parseFloat(document.getElementById("goalTarget").value),
    period: document.getElementById("goalPeriod").value,
    startDate: formattedDate.toISOString(),
    completed: false,
  }

  if (goalType === "specific_type") {
    goal.workoutType = document.getElementById("workoutType").value
  }

  if (goalType === "category") {
    goal.category = document.getElementById("category").value
  }

  goals.push(goal)
  localStorage.setItem("fitness_goals", JSON.stringify(goals))

  e.target.reset()
  displayGoals()
  showNotification("New goal set successfully!")
}

function displayGoals() {
  const activeGoals = goals.filter((goal) => !goal.completed)
  const completedGoals = goals.filter((goal) => goal.completed)

  displayActiveGoals(activeGoals)
  displayCompletedGoals(completedGoals)
}

function displayActiveGoals(activeGoals) {
  const container = document.getElementById("activeGoals")

  if (activeGoals.length === 0) {
    container.innerHTML =
      '<p class="no-goals">No active goals. Set a new goal to get started!</p>'
    return
  }

  container.innerHTML = activeGoals
    .map((goal) => {
      const progress = calculateProgress(goal)
      const progressPercentage = Math.min((progress / goal.target) * 100, 100)
      console.log(progressPercentage, progress)
      const timeRemaining = getTimeRemaining(goal)
      const motivationalMessage = getMotivationalMessage(progressPercentage)
      const remaining = Math.max(goal.target - progress, 0)

      return `
      <div class="goal-card">
        <div class="goal-header">
          <h3>${formatGoalTitle(goal)}</h3>
          <button class="delete-btn" onclick="deleteGoal(${goal.id})">×</button>
        </div>
        
        <div class="goal-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
          </div>
          <p class="progress-text">
            ${progress.toFixed(1)} / ${goal.target} ${getUnitLabel(goal.type)}
            (${progressPercentage.toFixed(1)}%)
          </p>
          <p class="remaining-text">
            Remaining: ${remaining.toFixed(1)} ${getUnitLabel(goal.type)}
          </p>
        </div>
        
        <p class="time-remaining">${timeRemaining}</p>
        ${
          motivationalMessage
            ? `<p class="motivational-message">${motivationalMessage}</p>`
            : ""
        }
      </div>
    `
    })
    .join("")
}

function displayCompletedGoals(completedGoals) {
  const container = document.getElementById("completedGoals")

  if (completedGoals.length === 0) {
    container.innerHTML =
      '<p class="no-goals">No completed goals yet. Keep working!</p>'
    return
  }

  container.innerHTML = completedGoals
    .map(
      (goal) => `
    <div class="goal-card completed">
      <div class="goal-header">
        <h3>${formatGoalTitle(goal)}</h3>
        <span class="completion-date">${formatDate(goal.completionDate)}</span>
      </div>
      <p class="goal-achievement">
        Achieved ${goal.target} ${getUnitLabel(goal.type)} in ${goal.period}
      </p>
    </div>
  `
    )
    .join("")
}

function calculateProgress(goal) {
  // Create a date object from the goal's start date and normalize to midnight
  const periodStart = new Date(goal.startDate)
  const normalizedPeriodStart = new Date(
    periodStart.getFullYear(),
    periodStart.getMonth(),
    periodStart.getDate()
  )

  console.log("Goal start date (normalized):", normalizedPeriodStart)
  console.log("Goal type:", goal.type)
  console.log("Goal period:", goal.period)

  // Log all workouts for debugging
  console.log("All workouts:", workouts)

  const relevantWorkouts = workouts.filter((workout) => {
    // Check if workout has a date property
    if (!workout.date) {
      console.log("Workout missing date property:", workout)
      return false
    }

    // Create a date object from the workout's date and normalize to midnight
    const workoutDate = new Date(workout.date)
    const normalizedWorkoutDate = new Date(
      workoutDate.getFullYear(),
      workoutDate.getMonth(),
      workoutDate.getDate()
    )

    console.log(
      "Comparing workout date (normalized):",
      normalizedWorkoutDate,
      "with goal start date (normalized):",
      normalizedPeriodStart
    )

    // Compare the normalized dates
    const isAfterStart = normalizedWorkoutDate >= normalizedPeriodStart
    const isWithinPeriodResult = isWithinPeriod(
      normalizedWorkoutDate,
      normalizedPeriodStart,
      goal.period
    )

    console.log("Is after start:", isAfterStart)
    console.log("Is within period:", isWithinPeriodResult)

    const isRelevant = isAfterStart && isWithinPeriodResult

    if (isRelevant) {
      console.log("Relevant workout found:", workout)
    }

    return isRelevant
  })

  console.log("Filtered workouts count:", relevantWorkouts.length)

  // Check if we have any relevant workouts
  if (relevantWorkouts.length === 0) {
    return 0
  }

  let progress = 0

  switch (goal.type) {
    case "distance":
      progress = relevantWorkouts
        .filter((w) => ["running", "cycling", "swimming"].includes(w.type))
        .reduce((sum, w) => sum + (w.distance || 0), 0)
      console.log("Distance progress:", progress)
      break

    case "calories":
      progress = relevantWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0)
      console.log("Calories progress:", progress)
      break

    case "workouts":
      progress = relevantWorkouts.length
      console.log("Workouts count progress:", progress)
      break

    case "duration":
      progress = relevantWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0)
      console.log("Duration progress:", progress)
      break

    case "specific_type":
      progress = relevantWorkouts.filter(
        (w) => w.type === goal.workoutType
      ).length
      console.log(
        "Specific type progress:",
        progress,
        "for type:",
        goal.workoutType
      )
      break

    case "category":
      progress = relevantWorkouts.filter(
        (w) => w.category === goal.category
      ).length
      console.log(
        "Category progress:",
        progress,
        "for category:",
        goal.category
      )
      break

    default:
      progress = 0
  }

  return progress
}

function getTimeRemaining(goal) {
  const startDate = new Date(goal.startDate)
  const endDate = new Date(startDate)

  if (goal.period === "week") {
    endDate.setDate(endDate.getDate() + 7)
  } else if (goal.period === "month") {
    endDate.setMonth(endDate.getMonth() + 1)
  }

  const now = new Date()
  const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))

  if (daysRemaining < 0) {
    return "Time expired"
  } else if (daysRemaining === 0) {
    return "Last day"
  } else {
    return `${daysRemaining} days remaining`
  }
}

function getMotivationalMessage(progressPercentage) {
  if (progressPercentage >= 100) {
    return "🎉 Congratulations! You've reached your goal!"
  } else if (progressPercentage >= 75) {
    return "🔥 Almost there! Keep pushing!"
  } else if (progressPercentage >= 50) {
    return "💪 Halfway there! You're doing great!"
  } else if (progressPercentage >= 25) {
    return "👊 Great start! Keep up the momentum!"
  }
  return ""
}

function formatGoalTitle(goal) {
  let baseTitle = `${goal.target} ${getUnitLabel(goal.type)}`

  if (goal.type === "specific_type") {
    baseTitle = `${goal.target} ${capitalizeFirstLetter(
      goal.workoutType
    )} workouts`
  } else if (goal.type === "category") {
    baseTitle = `${goal.target} ${capitalizeFirstLetter(
      goal.category
    )} workouts`
  }

  return `${baseTitle} in a ${goal.period}`
}

window.deleteGoal = (id) => {
  if (confirm("Are you sure you want to delete this goal?")) {
    goals = goals.filter((goal) => goal.id !== id)
    localStorage.setItem("fitness_goals", JSON.stringify(goals))
    displayGoals()
    showNotification("Goal deleted successfully!")
  }
}

function animateGoalCompletion(goalId) {
  const goalCard = document.querySelector(`.goal-card[data-id="${goalId}"]`)
  if (goalCard) {
    goalCard.classList.add("goal-completed")

    for (let i = 0; i < 50; i++) {
      createConfettiParticle(goalCard)
    }
  }
}

function createConfettiParticle(container) {
  const colors = ["#3d8d7a", "#a3d1c6", "#b3d8a8", "#fbffe4"]
  const particle = document.createElement("div")

  particle.style.position = "absolute"
  particle.style.width = "10px"
  particle.style.height = "10px"
  particle.style.backgroundColor =
    colors[Math.floor(Math.random() * colors.length)]
  particle.style.borderRadius = "50%"
  particle.style.pointerEvents = "none"

  const rect = container.getBoundingClientRect()
  particle.style.left = rect.left + rect.width / 2 + "px"
  particle.style.top = rect.top + rect.height / 2 + "px"

  document.body.appendChild(particle)

  const angle = Math.random() * Math.PI * 2
  const velocity = 5 + Math.random() * 5
  const tx = Math.cos(angle) * (Math.random() * 100)
  const ty = Math.sin(angle) * (Math.random() * 100) - 150

  particle.animate(
    [
      { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
      {
        transform: `translate(${tx}px, ${ty}px) rotate(${
          Math.random() * 360
        }deg)`,
        opacity: 0,
      },
    ],
    {
      duration: 1000 + Math.random() * 1000,
      easing: "cubic-bezier(0.1, 0.8, 0.2, 1)",
    }
  ).onfinish = () => particle.remove()
}

setInterval(() => {
  goals = goals.map((goal) => {
    if (!goal.completed) {
      const progress = calculateProgress(goal)
      if (progress >= goal.target) {
        goal.completed = true
        goal.completionDate = new Date().toISOString()
        showNotification("🎉 Congratulations! You've completed a goal!")

        setTimeout(() => animateGoalCompletion(goal.id), 100)
      }
    }
    return goal
  })

  localStorage.setItem("fitness_goals", JSON.stringify(goals))
  displayGoals()
}, 60000)
