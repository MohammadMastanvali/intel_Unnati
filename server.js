const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors()); 
app.use(express.json()); 

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // For local dev, this allows your React app to connect
    methods: ["GET", "POST"]
  }
});

const PORT = 4000;

// --- STATE MANAGEMENT ---
let data = [];
let maintenanceLog = [];
let isShutdown = false;
let faults = {
  overheating: 'OK',
  torqueImbalance: 'OK',
  encoderLoss: 'OK',
  powerFluctuation: 'OK',
  gripperMalfunction: 'OK',
  commDelay: 'OK'
};
let health = 100;
let lifetimeHealth = 100; 

function generateInitialData(count) {
  const initialData = [];
  const baseTime = Date.now() - count * 3000;
  for (let i = 0; i < count; i++) {
    initialData.push({
      time: new Date(baseTime + i * 3000).toLocaleTimeString(),
      j1_angle: 45 + Math.sin(i * 0.3) * 15,
      j2_angle: 60 + Math.cos(i * 0.4) * 20,
      j3_angle: 30 + Math.sin(i * 0.5) * 10,
      j4_angle: 90 + Math.sin(i * 0.35) * 12,
      j5_angle: 120 + Math.cos(i * 0.45) * 18,
      j6_angle: 180 + Math.sin(i * 0.55) * 14,
      motor_temp: 65 + Math.sin(i * 0.2) * 10,
      power: 1500 + Math.sin(i * 0.4) * 300,
      current: 8.5 + Math.sin(i * 0.5) * 2,
      rpm: 1200 + Math.sin(i * 0.6) * 200,
      payload: 5.2 + Math.sin(i * 0.3) * 1.5,
      cycle_time: 2.5 + (Math.random() - 0.5) * 0.3,
      anomaly_score: 0.15 + Math.sin(i * 0.8) * 0.1,
    });
  }
  data = initialData;
  return initialData;
}

function calculateStateHealth(metrics, currentFaults) {
  let h = 100;
  if (metrics.motor_temp > 75) h -= (metrics.motor_temp - 75) * 2;
  if (metrics.power > 2000) h -= (metrics.power - 2000) * 0.02;
  if (metrics.anomaly_score > 0.3) h -= (metrics.anomaly_score - 0.3) * 50;
  Object.values(currentFaults || {}).forEach(fault => {
    if (fault === 'Critical') h -= 15;
    else if (fault === 'Warning') h -= 5;
  });
  return Math.max(0, Math.min(100, h));
}

function addLog(severity, message) {
  const newLog = { id: Date.now(), timestamp: new Date().toLocaleString(), severity, message };
  maintenanceLog = [newLog, ...maintenanceLog].slice(0, 50);
  io.emit('logUpdate', maintenanceLog);
}

function runSimulation() {
  if (isShutdown) return;

  lifetimeHealth -= 0.02; 
  lifetimeHealth = Math.max(0, lifetimeHealth);

  const last = data.length > 0 ? data[data.length - 1] : generateInitialData(1)[0];

  const newEntry = {
    time: new Date().toLocaleTimeString(),
    j1_angle: last.j1_angle + (Math.random() - 0.5) * 8,
    j2_angle: last.j2_angle + (Math.random() - 0.5) * 8,
    j3_angle: last.j3_angle + (Math.random() - 0.5) * 8,
    j4_angle: last.j4_angle + (Math.random() - 0.5) * 8,
    j5_angle: last.j5_angle + (Math.random() - 0.5) * 8,
    j6_angle: last.j6_angle + (Math.random() - 0.5) * 8,
    motor_temp: faults.overheating !== 'OK' ? Math.min(95, last.motor_temp + Math.random() * 2) : Math.max(50, Math.min(85, last.motor_temp + (Math.random() - 0.5) * 5)),
    power: faults.powerFluctuation !== 'OK' ? last.power + (Math.random() - 0.5) * 400 : Math.max(1000, Math.min(2200, last.power + (Math.random() - 0.5) * 200)),
    current: Math.max(7, Math.min(11, last.current + (Math.random() - 0.5) * 0.8)),
    rpm: faults.encoderLoss !== 'OK' ? Math.max(0, last.rpm - Math.random() * 100) : Math.max(800, Math.min(1500, last.rpm + (Math.random() - 0.5) * 150)),
    payload: faults.gripperMalfunction !== 'OK' ? Math.max(0, last.payload - Math.random() * 2) : Math.max(3, Math.min(8, last.payload + (Math.random() - 0.5) * 0.5)),
    cycle_time: faults.commDelay !== 'OK' ? last.cycle_time + Math.random() * 0.5 : Math.max(2, Math.min(3.5, last.cycle_time + (Math.random() - 0.5) * 0.3)),
    anomaly_score: Math.max(0, Math.min(1, last.anomaly_score + (Math.random() - 0.5) * 0.1)),
  };

  data.push(newEntry);
  if (data.length > 20) data.shift();

  const stateHealth = calculateStateHealth(newEntry, faults);
  health = Math.min(lifetimeHealth, stateHealth);
  
  if (health <= 0) {
    isShutdown = true;
    addLog("CRITICAL", "Emergency shutdown - Health depleted");
    io.emit('shutdown', "🚨 EMERGENCY SHUTDOWN");
    return;
  }
  
  io.emit('newData', newEntry);
  io.emit('healthUpdate', health);
}

generateInitialData(20);
setInterval(runSimulation, 3000);

io.on('connection', (socket) => {
  socket.emit('initialData', { data, health, faults, logs: maintenanceLog, isShutdown });

  socket.on('toggleFault', (faultType) => {
    if (isShutdown) return;
    const current = faults[faultType];
    const next = current === 'OK' ? 'Warning' : current === 'Warning' ? 'Critical' : 'OK';
    faults[faultType] = next;
    io.emit('faultUpdate', faults);
  });
  
  socket.on('restartSystem', () => {
    isShutdown = false;
    lifetimeHealth = 100;
    faults = { overheating: 'OK', torqueImbalance: 'OK', encoderLoss: 'OK', powerFluctuation: 'OK', gripperMalfunction: 'OK', commDelay: 'OK' };
    generateInitialData(20);
    io.emit('systemReset', { data, health: 100, faults, isShutdown: false });
  });

  socket.on('shutdownSystem', () => {
    isShutdown = true;
    io.emit('shutdown', "⚠️ System manually shutdown");
  });
});

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));