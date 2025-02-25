let workouts = JSON.parse(localStorage.getItem("workouts") || "[]")
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]")
let achievements = JSON.parse(localStorage.getItem("achievements") || "[]")
let eventCountdown = JSON.parse(
  localStorage.getItem("eventCountdown") || "null"
)

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

  checkAchievements()

  const forms = document.querySelectorAll("form")
  forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      const submitBtn = form.querySelector('button[type="submit"]')
      if (submitBtn) {
        const originalText = submitBtn.innerHTML
        submitBtn.innerHTML = `<span class="loading-indicator"></span> Processing...`

        setTimeout(() => {
          submitBtn.innerHTML = originalText
        }, 1500)
      }
    })
  })

  const progressBars = document.querySelectorAll(".progress-fill")
  if (progressBars.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate")
          observer.unobserve(entry.target)
        }
      })
    })

    progressBars.forEach((bar) => {
      observer.observe(bar)
    })
  }
})

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

function checkAchievements() {
  const newAchievements = []

  if (workouts.length === 1 && !hasAchievement("FIRST_WORKOUT")) {
    newAchievements.push(achievementTypes.FIRST_WORKOUT)
  }

  const streak = calculateStreak()
  if (streak >= 3 && !hasAchievement("STREAK_3")) {
    newAchievements.push(achievementTypes.STREAK_3)
  }
  if (streak >= 7 && !hasAchievement("STREAK_7")) {
    newAchievements.push(achievementTypes.STREAK_7)
  }

  const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0)
  if (totalCalories >= 500 && !hasAchievement("CALORIES_500")) {
    newAchievements.push(achievementTypes.CALORIES_500)
  }
  if (totalCalories >= 1000 && !hasAchievement("CALORIES_1000")) {
    newAchievements.push(achievementTypes.CALORIES_1000)
  }

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
      isNew: true,
    })

    showNotification(`🏆 New Achievement: ${achievement.title}!`)
  })

  localStorage.setItem("achievements", JSON.stringify(achievements))
  if (document.getElementById("achievementsGrid")) {
    displayAchievements()

    document
      .querySelectorAll('.achievement-card[data-new="true"]')
      .forEach((card) => {
        card.classList.add("new-achievement")

        setTimeout(() => {
          card.removeAttribute("data-new")
        }, 1000)
      })
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

function setupCountdown() {
  const countdownSetup = document.getElementById("countdownSetup")
  const countdownDisplay = document.getElementById("countdownDisplay")
  const setCountdownBtn = document.getElementById("setCountdown")
  const resetCountdownBtn = document.getElementById("resetCountdown")

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

  if (resetCountdownBtn) {
    resetCountdownBtn.addEventListener("click", () => {
      eventCountdown = null
      localStorage.removeItem("eventCountdown")
      countdownDisplay.style.display = "none"
      countdownSetup.style.display = "block"

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

  updateCountdown(event)

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

    return true
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  const daysStr = days.toString()
  const hoursStr = hours.toString().padStart(2, "0")
  const minutesStr = minutes.toString().padStart(2, "0")
  const secondsStr = seconds.toString().padStart(2, "0")

  animateCountdownChange(document.getElementById("days"), daysStr)
  animateCountdownChange(document.getElementById("hours"), hoursStr)
  animateCountdownChange(document.getElementById("minutes"), minutesStr)
  animateCountdownChange(document.getElementById("seconds"), secondsStr)

  return false
}

function setupPrintSummary() {
  const printBtn = document.getElementById("printSummary")

  printBtn.addEventListener("click", () => {
    const printContent = document.getElementById("printContent")
    const stats = calculateStatistics()

    // Check if workouts exist
    if (!workouts || workouts.length === 0) {
      printContent.innerHTML = `
        <h2>Workout Summary</h2>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        <p>No workouts recorded yet.</p>
      `
      window.print()
      return
    }

    printContent.innerHTML = `
      <h2>Workout Summary</h2>
      <p>Generated on: ${new Date().toLocaleDateString()}</p>
      
      <div class="summary-stats">
        <p>Total Workouts: ${stats.totalWorkouts}</p>
        <p>Total Calories: ${stats.totalCalories}</p>
        <p>Average Duration: ${stats.avgDuration} minutes</p>
        <p>Most Common Type: ${stats.mostCommonType || "N/A"}</p>
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
      ${
        achievements && achievements.length > 0
          ? achievements
              .map(
                (a) => `
            <div class="achievement-entry">
              <p>${a.icon} ${a.title}</p>
              <p>${a.description}</p>
              <p>Earned: ${new Date(a.dateEarned).toLocaleDateString()}</p>
            </div>
          `
              )
              .join("")
          : "<p>No achievements earned yet.</p>"
      }
    `

    window.print()
  })
}

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

function animateCountdownChange(element, newValue) {
  if (element.textContent !== newValue) {
    element.classList.add("flip")
    setTimeout(() => {
      element.textContent = newValue
      setTimeout(() => {
        element.classList.remove("flip")
      }, 250)
    }, 250)
  }
}
