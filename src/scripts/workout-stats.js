import { capitalizeFirstLetter } from "./utils.js"

let workouts = JSON.parse(localStorage.getItem("workouts") || "[]")

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("totalWorkouts")) {
    updateStatistics()
    setupCharts()
  }
})

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

export { updateStatistics, setupCharts }
