export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatDateForInput(date) {
  return new Date(date).toISOString().split("T")[0]
}

export function capitalizeFirstLetter(string) {
  if (typeof string !== "string") return ""
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function showNotification(message) {
  const notification = document.createElement("div")
  notification.className = "notification"
  notification.textContent = message
  document.body.appendChild(notification)

  setTimeout(() => {
    notification.classList.add("fade-out")
    setTimeout(() => notification.remove(), 500)
  }, 3000)
}

export function getUnitLabel(type) {
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

export function isWithinPeriod(date, startDate, period) {
  const endDate = new Date(startDate)
  if (period === "week") {
    endDate.setDate(endDate.getDate() + 7)
  } else if (period === "month") {
    endDate.setMonth(endDate.getMonth() + 1)
  }
  return date >= startDate && date <= endDate
}
