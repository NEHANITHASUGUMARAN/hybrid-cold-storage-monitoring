// Shared logic for the Cold Chain Dashboard

const AI_THRESHOLD = 1.0;
const MIN_TEMP = 2.0;
const MAX_TEMP = 36.0;

// Utility to get random number between min and max
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

// Simulating ThingSpeak API Data Fetching
async function fetchThingSpeakData() {
  // In a real application, you would fetch from:
  // const url = `https://api.thingspeak.com/channels/YOUR_CHANNEL/feeds.json?results=20`;
  // return await fetch(url).then(res => res.json());

  // For this demo, we will simulate the data returning from the Arduino device
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        temp: parseFloat(getRandom(4, 7).toFixed(1)), // Simulating safe temps (mostly)
        humidity: parseFloat(getRandom(50, 60).toFixed(1)),
        timestamp: new Date().toISOString()
      });
    }, 500);
  });
}

// Initialize Charts
let tempChartInstance = null;

function initCharts(canvasId) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

  tempChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Temperature (°C)',
        data: [],
        borderColor: '#3b82f6',
        backgroundColor: gradient,
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: '#94a3b8' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
}

function updateChartData(chart, label, data) {
  if (!chart) return;
  chart.data.labels.push(label);
  chart.data.datasets[0].data.push(data);
  
  if (chart.data.labels.length > 15) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  chart.update();
}

// Map Initialization
let mapInstance = null;
let markerInstance = null;

function initMap(mapId, lat = 40.7128, lng = -74.0060) {
  const mapEl = document.getElementById(mapId);
  if (!mapEl) return;

  // Uses Leaflet.js
  mapInstance = L.map(mapId).setView([lat, lng], 13);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(mapInstance);

  markerInstance = L.marker([lat, lng]).addTo(mapInstance)
    .bindPopup('Container Current Location')
    .openPopup();
}

// Download CSV Data
function downloadCSV(dataArray, filename = 'sensor_data.csv') {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Timestamp,Temperature(C),Humidity(%)\n";
  
  dataArray.forEach(row => {
    csvContent += `${row.timestamp},${row.temp},${row.humidity}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
