/**
 * Cold Chain IoT - Central API Simulation & Shared Logic
 * This handles "ThingSpeak" data generation, Integrity Logic, and AI Predictions.
 */

const CONFIG = {
  MIN_TEMP: 2.0,
  MAX_TEMP: 36.0,
  AI_WARNING_THRESHOLD: 1.5, // Temp change per cycle that triggers AI
  POLLING_RATE: 3000, // 3 seconds
  THINGSPEAK_CHANNEL_ID: '3371973', // Replace with your Channel ID
  THINGSPEAK_READ_API_KEY: '0MNY9O53313D07D7' // Replace with your Read API Key
};



// State Management
let systemState = {
  temperature: 4.0,
  humidity: 55.0,
  integrityFailed: false,
  aiWarningActive: false,
  battery: 100,
  coolingActive: false,
  coordinates: [12.8690, 80.2150] // St. Josephs Institute of Technology, Chennai
};

function generateSimulatedData() {
  // Slight random drift
  const tempDrift = (Math.random() - 0.4) * 0.8; // Biased slightly to rise
  const humDrift = (Math.random() - 0.5) * 2;

  let newTemp = systemState.temperature + tempDrift;
  let newHum = systemState.humidity + humDrift;

  // Enforce bounds for realism
  if (newTemp < 0) newTemp = 0.5;
  if (newHum < 30) newHum = 30;
  if (newHum > 90) newHum = 90;

  // Move GPS slightly
  systemState.coordinates[0] += (Math.random() - 0.2) * 0.001;
  systemState.coordinates[1] += (Math.random() - 0.2) * 0.001;

  // Battery drain
  systemState.battery -= 0.01;

  // AI Logic & Integrity
  if (newTemp - systemState.temperature > CONFIG.AI_WARNING_THRESHOLD) {
    systemState.aiWarningActive = true;
  } else if (newTemp < CONFIG.MAX_TEMP - 1) {
    systemState.aiWarningActive = false;
  }

  if (newTemp > CONFIG.MAX_TEMP || newTemp < CONFIG.MIN_TEMP) {
    systemState.integrityFailed = true;
    systemState.coolingActive = true; // Auto-activate cooling
  } else {
    systemState.coolingActive = false;
  }

  systemState.temperature = newTemp;
  systemState.humidity = newHum;

  return {
    temp: parseFloat(newTemp.toFixed(1)),
    humidity: parseFloat(newHum.toFixed(1)),
    timestamp: new Date().toISOString(),
    status: systemState.integrityFailed ? 'FAILED' : 'SAFE',
    aiWarning: systemState.aiWarningActive,
    cooling: systemState.coolingActive,
    battery: parseFloat(systemState.battery.toFixed(1)),
    lat: systemState.coordinates[0],
    lng: systemState.coordinates[1]
  };
}

// Global Poll Function
async function startDataStream(callback) {

  async function fetchOrSimulate() {
    try {
      // Check if user has provided their real keys
      if (CONFIG.THINGSPEAK_CHANNEL_ID === 'YOUR_CHANNEL_ID_HERE') {
        throw new Error("No API Key provided, using simulation");
      }

      const url = `https://api.thingspeak.com/channels/${CONFIG.THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${CONFIG.THINGSPEAK_READ_API_KEY}&results=1`;
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.feeds && data.feeds.length > 0) {
        const feed = data.feeds[0];
        // Arduino code uses field1 for Temp, field2 for Humidity
        const tsTemp = parseFloat(feed.field1);
        const tsHum = parseFloat(feed.field2);

        if (!isNaN(tsTemp) && !isNaN(tsHum)) {
          // Calculate AI Warning based on real data difference
          if (tsTemp - systemState.temperature > CONFIG.AI_WARNING_THRESHOLD) {
            systemState.aiWarningActive = true;
          } else if (tsTemp < CONFIG.MAX_TEMP - 1) {
            systemState.aiWarningActive = false;
          }

          systemState.temperature = tsTemp;
          systemState.humidity = tsHum;

          // Integrity Check
          if (tsTemp > CONFIG.MAX_TEMP || tsTemp < CONFIG.MIN_TEMP) {
            systemState.integrityFailed = true;
            systemState.coolingActive = true;
          } else {
            systemState.coolingActive = false;
          }

          // Simulate GPS drift & battery since ThingSpeak only has temp/hum in the Arduino sketch
          systemState.coordinates[0] += (Math.random() - 0.2) * 0.001;
          systemState.coordinates[1] += (Math.random() - 0.2) * 0.001;
          systemState.battery -= 0.01;

          return {
            temp: parseFloat(tsTemp.toFixed(1)),
            humidity: parseFloat(tsHum.toFixed(1)),
            timestamp: feed.created_at,
            status: systemState.integrityFailed ? 'FAILED' : 'SAFE',
            aiWarning: systemState.aiWarningActive,
            cooling: systemState.coolingActive,
            battery: parseFloat(systemState.battery.toFixed(1)),
            lat: systemState.coordinates[0],
            lng: systemState.coordinates[1]
          };
        }
      }
      throw new Error("Invalid or empty ThingSpeak data");
    } catch (error) {
      // Fallback to Simulation silently (so console isn't spammed with API errors)
      return generateSimulatedData();
    }
  }

  // Fire once immediately
  callback(await fetchOrSimulate());

  // Then poll
  setInterval(async () => {
    callback(await fetchOrSimulate());
  }, CONFIG.POLLING_RATE);
}

// Sidebar Navigation Builder
function initSidebar(activePage) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const links = [
    { id: 'manufacturer', icon: 'fa-table-columns', text: 'Admin Dashboard', url: 'manufacturer.html' },
    { id: 'buyer', icon: 'fa-box', text: 'Buyer Portal', url: 'buyer.html' },
    { id: 'shipment', icon: 'fa-route', text: 'Shipment Details', url: 'shipment.html' },
    { id: 'analytics', icon: 'fa-chart-line', text: 'Analytics', url: 'analytics.html' },
    { id: 'ai', icon: 'fa-brain', text: 'AI Prediction', url: 'ai.html' },
    { id: 'digital-twin', icon: 'fa-cube', text: 'Digital Twin', url: 'digital-twin.html' },
    { id: 'map', icon: 'fa-map-location-dot', text: 'Live Map', url: 'map.html' },
    { id: 'rfid', icon: 'fa-barcode', text: 'RFID Scanner', url: 'rfid.html' },
    { id: 'reports', icon: 'fa-file-pdf', text: 'Reports', url: 'reports.html' },
    { id: 'settings', icon: 'fa-gear', text: 'Settings', url: 'settings.html' }
  ];

  let html = `
    <div class="brand">
      <i class="fa-solid fa-snowflake text-neon-blue"></i>
      <span>ColdChain AI</span>
    </div>
    <div style="flex: 1; margin-top: 20px;">
  `;

  links.forEach(link => {
    const isActive = activePage === link.id ? 'active' : '';
    html += `
      <a href="${link.url}" class="nav-item ${isActive}">
        <i class="fa-solid ${link.icon}"></i>
        <span>${link.text}</span>
      </a>
    `;
  });

  html += `
    </div>
    <div style="padding: 20px;">
      <a href="login.html" class="btn btn-danger" style="width: 100%; padding: 10px;">
        <i class="fa-solid fa-power-off"></i> <span>LOGOUT</span>
      </a>
    </div>
  `;

  sidebar.innerHTML = html;
}
