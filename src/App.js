import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Activity, Wrench, RefreshCcw, Brain, Layers, Binary, Clock, Zap, Thermometer, Gauge, Cpu 
} from 'lucide-react';

const socket = io('http://localhost:4000');

export default function App() {
  const [data, setData] = useState([]);
  const [health, setHealth] = useState(100);
  const [isShutdown, setIsShutdown] = useState(false);
  const [faults, setFaults] = useState({});
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Initial state sync from the server
    socket.on('initialData', (p) => {
      setData(p.data); 
      setHealth(p.health); 
      setFaults(p.faults); 
      setLogs(p.logs); 
      setIsShutdown(p.isShutdown);
    });

    // Real-time telemetry updates
    socket.on('newData', (d) => setData(prev => [...prev, d].slice(-20)));
    socket.on('healthUpdate', (h) => setHealth(h));
    socket.on('faultUpdate', (f) => setFaults(f));
    socket.on('logUpdate', (l) => setLogs(l));
    socket.on('shutdown', () => setIsShutdown(true));
    
    socket.on('systemReset', (p) => {
      setIsShutdown(false); 
      setData(p.data); 
      setHealth(p.health); 
      setFaults(p.faults);
    });

    return () => socket.off();
  }, []);

  const latest = data[data.length - 1] || {};

  // Predictive Logic: ROM Residual Calculation
  // Calculates deviation between actual power and the 1500W baseline
  const romResidual = Math.abs((latest.power || 0) - 1500).toFixed(2);

  return (
    <div style={{ padding: "1.5rem", background: "#030712", minHeight: "100vh", color: "#e2e8f0", fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER: PROJECT IDENTITY */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", borderBottom: "1px solid #1e293b", paddingBottom: "15px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.2rem", color: "#38bdf8", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Brain size={24} /> SMART DIGITAL TWIN: ROM-AI PREDICTIVE MAINTENANCE
          </h1>
          <p style={{ margin: "5px 0 0 0", fontSize: "0.7rem", opacity: 0.5 }}>ELECTRO-MECHANICAL SYSTEM ANALYSIS & RUL FORECASTING</p>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          <div style={{ textAlign: "center", background: "#0f172a", padding: "5px 15px", borderRadius: "8px", border: "1px solid #38bdf8", boxShadow: "0 0 15px rgba(56, 189, 248, 0.2)" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: health > 40 ? "#38bdf8" : "#f43f5e" }}>{health.toFixed(1)}%</div>
            <div style={{ fontSize: "0.6rem", opacity: 0.7 }}>RUL ESTIMATE</div>
          </div>
          <button 
            onClick={() => socket.emit('restartSystem')} 
            style={{ background: "#38bdf8", color: "#020617", border: "none", padding: "0 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", transition: "0.3s" }}
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", gap: "20px" }}>
        
        {/* COLUMN 1: ROM PARAMETERS & FAULT INJECTION */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ background: "#0f172a", borderRadius: "12px", padding: "15px", border: "1px solid #1e293b" }}>
            <h3 style={{ fontSize: "0.8rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px" }}><Layers size={14}/> ROM RESIDUE ANALYSIS</h3>
            <div style={{ fontSize: "1.8rem", fontWeight: "bold", margin: "10px 0" }}>{romResidual} <span style={{fontSize: "0.8rem", color: "#38bdf8"}}>ΔW</span></div>
            <div style={{ height: "6px", background: "#1e293b", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (romResidual/500)*100)}%`, height: "100%", background: "#38bdf8", transition: "0.5s ease" }} />
            </div>
            <p style={{ fontSize: "0.6rem", marginTop: "10px", opacity: 0.5, lineHeight: "1.4" }}>
              The residual represents the error between the physical system sensors and the Reduced Order Model baseline.
            </p>
          </div>

          <div style={{ background: "#0f172a", borderRadius: "12px", padding: "15px", border: "1px solid #1e293b" }}>
            <h3 style={{ fontSize: "0.8rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}><Binary size={14}/> DIAGNOSTIC INJECTORS</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
              {Object.entries(faults).map(([key, val]) => (
                <button 
                  key={key} 
                  onClick={() => socket.emit('toggleFault', key)} // Event listener for fault injection
                  style={{ 
                    fontSize: "0.7rem", padding: "10px", textAlign: "left", display: "flex", justifyContent: "space-between",
                    background: val === 'OK' ? "#1e293b" : val === 'Warning' ? "#f59e0b22" : "#f43f5e22", 
                    color: val === 'OK' ? "#94a3b8" : val === 'Warning' ? "#f59e0b" : "#f43f5e",
                    border: `1px solid ${val === 'OK' ? 'transparent' : 'currentColor'}`, borderRadius: "6px", cursor: "pointer" 
                  }}
                >
                  {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                  <span style={{ fontWeight: "900" }}>{val}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 2: KINEMATIC DIGITAL TWIN VISUALIZER */}
        <div style={{ background: "radial-gradient(circle, #0f172a 0%, #020617 100%)", borderRadius: "16px", border: "1px solid #1e293b", position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ position: "absolute", top: "15px", left: "15px", fontSize: "0.7rem", color: "#38bdf8", fontPadding: "monospace", opacity: 0.8 }}>
            AI_STATE: {isShutdown ? "CRITICAL_HALT" : "REALTIME_MONITORING"}<br/>
            COORD_J1: {latest.j1_angle?.toFixed(2)}°
          </div>
          
          <svg width="100%" height="400" viewBox="0 0 400 400">
            {/* Ground Base */}
            <rect x="150" y="320" width="100" height="10" fill="#1e293b" rx="2" />
            <g transform="translate(200, 320)">
              {/* Arm segments driven by telemetry */}
              <g transform={`rotate(${(latest.j1_angle || 0) - 45})`}>
                <line x1="0" y1="0" x2="0" y2="-120" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
                <circle cy="-120" r="12" fill="#020617" stroke="#38bdf8" strokeWidth="3" />
                <g transform={`translate(0, -120) rotate(${(latest.j2_angle || 0) - 60})`}>
                  <line x1="0" y1="0" x2="0" y2="-100" stroke="#0ea5e9" strokeWidth="5" strokeLinecap="round" strokeDasharray="6,3" />
                  <circle cy="-100" r="8" fill="#f43f5e" />
                </g>
              </g>
            </g>
          </svg>
        </div>

        {/* COLUMN 3: RUL CHART & ADVISORY FEED */}
        <div style={{ background: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", padding: "15px", display: "flex", flexDirection: "column", gap: "20px", height: "420px" }}>
          
          {/* New RUL Trend Graph */}
          <div>
            <h3 style={{ fontSize: "0.8rem", color: "#38bdf8", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={14}/> RUL DEGRADATION CURVE
            </h3>
            <div style={{ height: "130px", width: "100%", background: "rgba(0,0,0,0.3)", borderRadius: "8px", padding: "10px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={health > 50 ? "#22c55e" : "#f43f5e"} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={health > 50 ? "#22c55e" : "#f43f5e"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: "10px", color: "#fff" }} />
                  <Area 
                    type="monotone" 
                    dataKey="anomaly_score" // Using anomaly to represent the inverse of health trend
                    stroke={health > 50 ? "#22c55e" : "#f43f5e"} 
                    fill="url(#colorHealth)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ overflowY: "auto", flexGrow: 1, borderTop: "1px solid #1e293b", paddingTop: "15px" }}>
            <h3 style={{ fontSize: "0.8rem", color: "#38bdf8", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Wrench size={14}/> MAINTENANCE ADVISORY
            </h3>
            {logs.map(log => (
              <div key={log.id} style={{ 
                marginBottom: "10px", padding: "10px", borderRadius: "6px", 
                borderLeft: `3px solid ${log.severity === 'CRITICAL' ? '#f43f5e' : '#38bdf8'}`, 
                background: "rgba(255,255,255,0.03)" 
              }}>
                <div style={{ fontSize: "0.6rem", opacity: 0.5, marginBottom: "4px" }}>{log.timestamp}</div>
                <div style={{ fontSize: "0.75rem", fontWeight: "500" }}>{log.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: DOMAIN TELEMETRY MODULES */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginTop: "20px" }}>
        <TelemetryModule label="Thermal Monitoring" dataKey="motor_temp" color="#f43f5e" data={data} unit="°C" />
        <TelemetryModule label="Load Variance" dataKey="power" color="#fbbf24" data={data} unit="W" />
        <TelemetryModule label="Kinematic Cycle" dataKey="cycle_time" color="#22c55e" data={data} unit="s" />
      </div>
    </div>
  );
}

// Reusable Telemetry Chart Module
function TelemetryModule({ label, dataKey, color, data, unit }) {
  const currentVal = data[data.length - 1]?.[dataKey]?.toFixed(2) || "0.00";
  return (
    <div style={{ background: "#0f172a", padding: "15px", borderRadius: "12px", border: "1px solid #1e293b" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
        <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: "0.8rem", color, fontWeight: "bold" }}>{currentVal} {unit}</span>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data}>
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.05} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}