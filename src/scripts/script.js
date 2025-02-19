// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('durationChart')) {
    const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
    
    // Update summary statistics
    updateSummaryStats(workouts);
    
    // Create all charts
    createDurationChart(workouts);
    createCaloriesChart(workouts);
    createTypeDistributionChart(workouts);
  }
});

function updateSummaryStats(workouts) {
  // Total workouts
  document.getElementById('totalWorkouts').textContent = workouts.length;
  
  // Total calories
  const totalCalories = workouts.reduce((sum, workout) => sum + workout.calories, 0);
  document.getElementById('totalCalories').textContent = totalCalories.toLocaleString();
  
  // Average duration
  const avgDuration = workouts.length 
    ? Math.round(workouts.reduce((sum, workout) => sum + workout.duration, 0) / workouts.length)
    : 0;
  document.getElementById('avgDuration').textContent = `${avgDuration} min`;
  
  // Most common workout type
  const typeCount = workouts.reduce((acc, workout) => {
    acc[workout.type] = (acc[workout.type] || 0) + 1;
    return acc;
  }, {});
  const mostCommonType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
  document.getElementById('commonType').textContent = mostCommonType.charAt(0).toUpperCase() + 
    mostCommonType.slice(1);
}

function createDurationChart(workouts) {
  const ctx = document.getElementById('durationChart');
  
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();
  
  const workoutDurations = last7Days.map(date => {
    const workout = workouts.find(w => w.date === date);
    return workout ? workout.duration : 0;
  });
  
  const dayLabels = last7Days.map(date => {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
  });
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: dayLabels,
      datasets: [{
        label: 'Duration (minutes)',
        data: workoutDurations,
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        tension: 0.1,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Minutes'
          }
        }
      }
    }
  });
}

function createCaloriesChart(workouts) {
  const ctx = document.getElementById('caloriesChart');
  
  const workoutTypes = [...new Set(workouts.map(w => w.type))];
  const caloriesByType = workoutTypes.map(type => {
    return workouts
      .filter(w => w.type === type)
      .reduce((sum, w) => sum + w.calories, 0);
  });
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: workoutTypes.map(type => type.charAt(0).toUpperCase() + type.slice(1)),
      datasets: [{
        label: 'Total Calories Burned',
        data: caloriesByType,
        backgroundColor: [
          'rgba(52, 152, 219, 0.7)',
          'rgba(46, 204, 113, 0.7)',
          'rgba(155, 89, 182, 0.7)',
          'rgba(230, 126, 34, 0.7)',
          'rgba(241, 196, 15, 0.7)'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Calories'
          }
        }
      }
    }
  });
}

function createTypeDistributionChart(workouts) {
  const ctx = document.getElementById('typeChart');
  
  const typeCount = workouts.reduce((acc, workout) => {
    acc[workout.type] = (acc[workout.type] || 0) + 1;
    return acc;
  }, {});
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(typeCount).map(type => type.charAt(0).toUpperCase() + type.slice(1)),
      datasets: [{
        data: Object.values(typeCount),
        backgroundColor: [
          'rgba(52, 152, 219, 0.7)',
          'rgba(46, 204, 113, 0.7)',
          'rgba(155, 89, 182, 0.7)',
          'rgba(230, 126, 34, 0.7)',
          'rgba(241, 196, 15, 0.7)'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}