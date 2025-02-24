// Workout and achievement data management
let workouts = JSON.parse(localStorage.getItem("workouts") || "[]")
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]")
let achievements = JSON.parse(localStorage.getItem("achievements") || "[]")
let eventCountdown = JSON.parse(
  localStorage.getItem("eventCountdown") || "null"
)

// Motivational quotes library
const motivationalQuotes = [
  "The only bad workout is the one that didn't happen.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "The hard days are the best because that's when champions are made.",
  "Success starts with self-discipline.",
  "Your health is an investment, not an expense.",
  "Don't wish for it, work for it.",
  "Strength does not come from physical capacity. It comes from an indomitable will.",
  "The only person you are destined to become is the person you decide to be.",
  "Take care of your body. It's the only place you have to live.",
  "Exercise is king. Nutrition is queen. Put them together and you've got a kingdom.",
]

// Achievement definitions
const achievementTypes = {
  FIRST_WORKOUT: {
    id: "first_workout",
    title: "First Step",
    description: "Completed your first workout",
    icon: "🎯",
  },
  STREAK_3: {
    id: "streak_3",
    title: "Hat Trick",
    description: "3-day workout streak",
    icon: "🔥",
  },
  STREAK_7: {
    id: "streak_7",
    title: "Week Warrior",
    description: "7-day workout streak",
    icon: "⚔️",
  },
  CALORIES_500: {
    id: "calories_500",
    title: "Calorie Crusher",
    description: "Burned 500 total calories",
    icon: "🔥",
  },
  CALORIES_1000: {
    id: "calories_1000",
    title: "Burn Master",
    description: "Burned 1,000 total calories",
    icon: "⚡",
  },
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize features based on available elements
  if (document.getElementById("motivationBtn")) {
    setupMotivationalQuotes()
  }

  if (document.getElementById("countdownSetup")) {
    setupCountdown()
  }

  if (document.getElementById("achievementsGrid")) {
    displayAchievements()
  }

  if (document.getElementById("workoutsList")) {
    displayWorkouts()
    setupWorkoutFilters()
  }

  if (document.getElementById("printSummary")) {
    setupPrintSummary()
  }

  // Initialize statistics if we're on the stats page
  if (document.getElementById("totalWorkouts")) {
    updateStatistics()
    setupCharts()
  }

  // Check for new achievements
  checkAchievements()
})

// Statistics Functions
function updateStatistics() {
  const stats = calculateStatistics()

  document.getElementById("totalWorkouts").textContent = stats.totalWorkouts
  document.getElementById("totalCalories").textContent = stats.totalCalories
  document.getElementById(
    "avgDuration"
  ).textContent = `${stats.avgDuration} min`
  document.getElementById("commonType").textContent =
    stats.mostCommonType || "-"
}

function calculateStatistics() {
  if (workouts.length === 0) {
    return {
      totalWorkouts: 0,
      totalCalories: 0,
      avgDuration: 0,
      mostCommonType: "-",
    }
  }

  const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0)
  const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0)

  // Calculate most common workout type
  const typeCounts = workouts.reduce((acc, w) => {
    acc[w.type] = (acc[w.type] || 0) + 1
    return acc
  }, {})

  const mostCommonType = Object.entries(typeCounts).sort(
    (a, b) => b[1] - a[1]
  )[0][0]

  return {
    totalWorkouts: workouts.length,
    totalCalories,
    avgDuration: Math.round(totalDuration / workouts.length),
    mostCommonType: capitalizeFirstLetter(mostCommonType),
  }
}

// Chart Setup
function setupCharts() {
  setupDurationChart()
  setupCaloriesChart()
  setupTypeDistributionChart()
}

function setupDurationChart() {
  const ctx = document.getElementById("durationChart").getContext("2d")
  const weeklyData = getWeeklyDurationData()

  new Chart(ctx, {
    type: "line",
    data: {
      labels: weeklyData.labels,
      datasets: [
        {
          label: "Minutes",
          data: weeklyData.data,
          borderColor: "#3D8D7A",
          backgroundColor: "rgba(61, 141, 122, 0.1)",
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  })
}

function setupCaloriesChart() {
  const ctx = document.getElementById("caloriesChart").getContext("2d")
  const caloriesData = getCaloriesByType()

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: caloriesData.labels,
      datasets: [
        {
          data: caloriesData.data,
          backgroundColor: ["#3D8D7A", "#A3D1C6", "#B3D8A8", "#FBFFE4"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  })
}

function setupTypeDistributionChart() {
  const ctx = document.getElementById("typeChart").getContext("2d")
  const typeData = getWorkoutTypeDistribution()

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: typeData.labels,
      datasets: [
        {
          data: typeData.data,
          backgroundColor: ["#3D8D7A", "#A3D1C6", "#B3D8A8", "#FBFFE4"],
        },
      ],
    },
    options: {
      responsive: true,
    },
  })
}

// Data Processing Functions
function getWeeklyDurationData() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const data = new Array(7).fill(0)
  const labels = []

  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - 6)

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    labels.push(days[date.getDay()])

    const dayWorkouts = workouts.filter((w) => {
      const workoutDate = new Date(w.date)
      return workoutDate.toDateString() === date.toDateString()
    })

    data[i] = dayWorkouts.reduce((sum, w) => sum + w.duration, 0)
  }

  return { labels, data }
}

function getCaloriesByType() {
  const typeCalories = workouts.reduce((acc, w) => {
    acc[w.type] = (acc[w.type] || 0) + w.calories
    return acc
  }, {})

  return {
    labels: Object.keys(typeCalories).map(capitalizeFirstLetter),
    data: Object.values(typeCalories),
  }
}

function getWorkoutTypeDistribution() {
  const typeCounts = workouts.reduce((acc, w) => {
    acc[w.type] = (acc[w.type] || 0) + 1
    return acc
  }, {})

  return {
    labels: Object.keys(typeCounts).map(capitalizeFirstLetter),
    data: Object.values(typeCounts),
  }
}

// Achievement System
function checkAchievements() {
  const newAchievements = []

  // First workout achievement
  if (workouts.length === 1 && !hasAchievement("FIRST_WORKOUT")) {
    newAchievements.push(achievementTypes.FIRST_WORKOUT)
  }

  // Streak achievements
  const streak = calculateStreak()
  if (streak >= 3 && !hasAchievement("STREAK_3")) {
    newAchievements.push(achievementTypes.STREAK_3)
  }
  if (streak >= 7 && !hasAchievement("STREAK_7")) {
    newAchievements.push(achievementTypes.STREAK_7)
  }

  // Calorie achievements
  const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0)
  if (totalCalories >= 500 && !hasAchievement("CALORIES_500")) {
    newAchievements.push(achievementTypes.CALORIES_500)
  }
  if (totalCalories >= 1000 && !hasAchievement("CALORIES_1000")) {
    newAchievements.push(achievementTypes.CALORIES_1000)
  }

  // Award new achievements
  if (newAchievements.length > 0) {
    awardAchievements(newAchievements)
  }
}

function hasAchievement(id) {
  return achievements.some((a) => a.id === id)
}

function awardAchievements(newAchievements) {
  newAchievements.forEach((achievement) => {
    achievements.push({
      ...achievement,
      dateEarned: new Date().toISOString(),
    })

    showNotification(`🏆 New Achievement: ${achievement.title}!`)
  })

  localStorage.setItem("achievements", JSON.stringify(achievements))
  if (document.getElementById("achievementsGrid")) {
    displayAchievements()
  }
}

function calculateStreak() {
  if (workouts.length === 0) return 0

  const sortedWorkouts = [...workouts].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  )

  let streak = 1
  let currentDate = new Date(sortedWorkouts[0].date)

  for (let i = 1; i < sortedWorkouts.length; i++) {
    const workoutDate = new Date(sortedWorkouts[i].date)
    const dayDiff = Math.round(
      (currentDate - workoutDate) / (1000 * 60 * 60 * 24)
    )

    if (dayDiff === 1) {
      streak++
      currentDate = workoutDate
    } else {
      break
    }
  }

  return streak
}

// Motivational Quotes
function setupMotivationalQuotes() {
  const motivationBtn = document.getElementById("motivationBtn")
  const quoteText = document.getElementById("motivationalQuote")

  if (motivationBtn && quoteText) {
    motivationBtn.addEventListener("click", () => {
      const randomQuote =
        motivationalQuotes[
          Math.floor(Math.random() * motivationalQuotes.length)
        ]
      quoteText.textContent = randomQuote
      quoteText.style.display = "block"
    })
  }
}

// Event Countdown
function setupCountdown() {
  const countdownSetup = document.getElementById("countdownSetup")
  const countdownDisplay = document.getElementById("countdownDisplay")
  const setCountdownBtn = document.getElementById("setCountdown")
  const resetCountdownBtn = document.getElementById("resetCountdown")

  // Display existing countdown if there is one
  if (eventCountdown) {
    displayCountdown(eventCountdown)
  }

  setCountdownBtn.addEventListener("click", () => {
    const eventName = document.getElementById("eventName").value
    const eventDate = document.getElementById("eventDate").value

    if (eventName && eventDate) {
      const event = { name: eventName, date: eventDate }
      eventCountdown = event
      localStorage.setItem("eventCountdown", JSON.stringify(event))
      displayCountdown(event)
    }
  })

  // Add reset functionality
  if (resetCountdownBtn) {
    resetCountdownBtn.addEventListener("click", () => {
      eventCountdown = null
      localStorage.removeItem("eventCountdown")
      countdownDisplay.style.display = "none"
      countdownSetup.style.display = "block"

      // Clear any existing event completed message
      const completedMessage = document.querySelector(".event-completed")
      if (completedMessage) {
        completedMessage.remove()
      }
    })
  }
}

function displayCountdown(event) {
  const countdownSetup = document.getElementById("countdownSetup")
  const countdownDisplay = document.getElementById("countdownDisplay")
  const displayEventName = document.getElementById("displayEventName")

  countdownSetup.style.display = "none"
  countdownDisplay.style.display = "block"
  displayEventName.textContent = event.name

  // Start the countdown immediately
  updateCountdown(event)

  // Update every second instead of every minute
  const timer = setInterval(() => {
    const completed = updateCountdown(event)
    if (completed) {
      clearInterval(timer)
    }
  }, 1000)
}

function updateCountdown(event) {
  const now = new Date()
  const eventDate = new Date(event.date)
  const diff = eventDate - now

  // If the event has passed
  if (diff < 0) {
    document.getElementById("days").textContent = "0"
    document.getElementById("hours").textContent = "0"
    document.getElementById("minutes").textContent = "0"
    document.getElementById("seconds").textContent = "0"

    const countdownTimer = document.querySelector(".countdown-timer")
    if (countdownTimer) {
      countdownTimer.insertAdjacentHTML(
        "afterend",
        '<div class="event-completed">Event has ended!</div>'
      )
    }

    return true // Signal to stop the interval
  }

  // Calculate time units
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  // Update the display with padded numbers
  document.getElementById("days").textContent = days
  document.getElementById("hours").textContent = hours
    .toString()
    .padStart(2, "0")
  document.getElementById("minutes").textContent = minutes
    .toString()
    .padStart(2, "0")
  document.getElementById("seconds").textContent = seconds
    .toString()
    .padStart(2, "0")

  return false // Signal to continue the interval
}

// Print Summary
function setupPrintSummary() {
  console.log("print")
  const printBtn = document.getElementById("printSummary")

  printBtn.addEventListener("click", () => {
    const printContent = document.getElementById("printContent")
    const stats = calculateStatistics()

    printContent.innerHTML = `
      <h2>Workout Summary</h2>
      <p>Generated on: ${new Date().toLocaleDateString()}</p>
      
      <div class="summary-stats">
        <p>Total Workouts: ${stats.totalWorkouts}</p>
        <p>Total Calories: ${stats.totalCalories}</p>
        <p>Average Duration: ${stats.avgDuration} minutes</p>
        <p>Most Common Type: ${stats.mostCommonType}</p>
      </div>
      
      <h3>Recent Workouts</h3>
      ${workouts
        .slice(0, 10)
        .map(
          (w) => `
        <div class="workout-entry">
          <p>${new Date(w.date).toLocaleDateString()}: ${capitalizeFirstLetter(
            w.type
          )}</p>
          <p>Duration: ${w.duration} minutes</p>
          <p>Calories: ${w.calories}</p>
        </div>
      `
        )
        .join("")}
      
      <h3>Achievements</h3>
      ${achievements
        .map(
          (a) => `
        <div class="achievement-entry">
          <p>${a.icon} ${a.title}</p>
          <p>${a.description}</p>
          <p>Earned: ${new Date(a.dateEarned).toLocaleDateString()}</p>
        </div>
      `
        )
        .join("")}
    `

    window.print()
  })
}

// Helper Functions
import { capitalizeFirstLetter, showNotification } from "./utils.js"

function displayAchievements() {
  const achievementsGrid = document.getElementById("achievementsGrid")
  if (!achievementsGrid) return

  if (achievements.length === 0) {
    achievementsGrid.innerHTML =
      '<p class="no-achievements">No achievements yet. Keep working out to earn badges!</p>'
    return
  }

  const template = document.getElementById("achievementTemplate")
  achievementsGrid.innerHTML = ""

  achievements.forEach((achievement) => {
    const achievementCard = template.content.cloneNode(true)

    // Fill in the achievement card details
    achievementCard.querySelector(".badge-icon").textContent = achievement.icon
    achievementCard.querySelector(".badge-title").textContent =
      achievement.title
    achievementCard.querySelector(".badge-description").textContent =
      achievement.description
    achievementCard.querySelector(
      ".earned-date"
    ).textContent = `Earned: ${new Date(
      achievement.dateEarned
    ).toLocaleDateString()}`

    achievementsGrid.appendChild(achievementCard)
  })
}
