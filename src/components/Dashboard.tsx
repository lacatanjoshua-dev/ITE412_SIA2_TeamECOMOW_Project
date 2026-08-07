import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Play,
  Pause,
  Square,
  MapPin,
  Gauge,
  BatteryFull,
  AlertTriangle,
  RotateCw,
} from "lucide-react";

import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ✅ API endpoint
const API_URL: string | null = null;

export default function Dashboard() {
  const navigate = useNavigate();

  const [mowerState, setMowerState] = useState<"idle" | "mowing">("idle");
  const [speed, setSpeed] = useState(50);
  const [batteryHealth, setBatteryHealth] = useState(87);

  const [position, setPosition] = useState<[number, number]>([
    13.326013666135458,
    121.26859107085518,
  ]);

  const [path, setPath] = useState<[number, number][]>([]);
  const [batteryAlertSent, setBatteryAlertSent] = useState(false);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [lastBatteryLog, setLastBatteryLog] = useState<number>(batteryHealth);
  const [isMounted, setIsMounted] = useState(false);

  const [isTipped, setIsTipped] = useState(false);
  const [tipRecoveryTime, setTipRecoveryTime] = useState<Date | null>(null);

  const lastNotifRef = React.useRef("");

  // Farm boundaries
  const farmShape: [number, number][] = [
    [13.3262, 121.2684],
    [13.3262, 121.2688],
    [13.3259, 121.2688],
    [13.3259, 121.2684],
  ];

  const bounds: [[number, number], [number, number]] = [
    [13.3259, 121.2684],
    [13.3262, 121.2688],
  ];

  const batteryStatus =
    batteryHealth >= 80 ? "Healthy" :
    batteryHealth >= 50 ? "Normal" : "Low";

  const userId = localStorage.getItem("userId") || "guest123";
  const isMowerConnected = localStorage.getItem("sim_connected") === "true";

  // Mowing Path Settings
  const rowSpacing = 0.000085;     // Distance between rows
  const stepSize = 0.000042;       // Horizontal movement per step

  useEffect(() => {
    setIsMounted(true);

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  // Notification Function
  const createNotification = async (
    title: string,
    description: string,
    type: "warning" | "system" | "completed" | "error"
  ) => {
    const key = title + description;
    if (lastNotifRef.current === key) return false;
    lastNotifRef.current = key;

    if (!API_URL) {
      console.log("🔔 NOTIF:", { title, description, type });
      return true;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, type, title, description }),
      });
      return response.ok;
    } catch (error) {
      console.warn("⚠️ Server offline:", error);
      return false;
    }
  };

  const createBatteryLog = async (level: number, status: string) => {
    if (!API_URL) {
      console.log("🔋 BATTERY:", { level, status });
      return;
    }
    // fetch logic...
  };

  // =========================
  // SIMULATIONS
  // =========================

  // Battery drain
  useEffect(() => {
    const interval = setInterval(() => {
      if (mowerState === "mowing" && !isTipped) {
        setBatteryHealth(prev => Math.max(0, prev - Math.random() * 0.5));
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [mowerState, isTipped]);

  // Battery log
  useEffect(() => {
    if (Math.abs(batteryHealth - lastBatteryLog) >= 2) {
      createBatteryLog(Math.floor(batteryHealth), batteryStatus);
      setLastBatteryLog(batteryHealth);
    }
  }, [batteryHealth]);

  // Low battery alert
  useEffect(() => {
    if (batteryHealth <= 30 && !batteryAlertSent && !isTipped) {
      createNotification("Battery Low", "Below 30%. Please recharge.", "warning");
      setBatteryAlertSent(true);
    }
  }, [batteryHealth]);

  // ✅ IMPROVED ROW-BY-ROW MOWING PATH
  useEffect(() => {
    if (mowerState !== "mowing" || isTipped) return;

    let direction = 1; // 1 = right, -1 = left

    const intervalTime = Math.max(120, 1600 - speed * 12);

    const interval = setInterval(() => {
      setPosition(prev => {
        let newLat = prev[0];
        let newLng = prev[1];

        // Check if reached end of row
        if (
          (direction === 1 && newLng >= 121.26875) ||
          (direction === -1 && newLng <= 121.26845)
        ) {
          // Move to next row
          newLat -= rowSpacing;
          direction *= -1;
        } else {
          // Move horizontally
          newLng += stepSize * direction * (speed / 70);
        }

        const newPos: [number, number] = [newLat, newLng];

        setPath(p => [...p, newPos]);
        return newPos;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [mowerState, speed, isTipped]);

  // Tipping simulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (mowerState === "mowing" && !isTipped && Math.random() < 0.08) {
        setIsTipped(true);
        setTipRecoveryTime(new Date(Date.now() + 8000));
        setMowerState("idle");
        createNotification("⚠️ Mower Tipped Over!", "Auto-recovery in 8 seconds.", "error");
      }
    }, 18000);
    return () => clearInterval(interval);
  }, [mowerState, isTipped]);

  // Auto recovery
  useEffect(() => {
    if (isTipped && tipRecoveryTime && new Date() >= tipRecoveryTime) {
      setIsTipped(false);
      createNotification("✅ Mower Recovered", "Self-recovered.", "completed");
    }
  }, [isTipped, tipRecoveryTime]);

  // =========================
  // CONTROLS
  // =========================

  const handleStartPause = async () => {
    if (!isMowerConnected) {
      await createNotification("Mower Offline", "Cannot start/pause: mower is not connected.", "error");
      return;
    }
    if (isTipped) {
      await createNotification("Cannot Start", "Mower is tipped over.", "warning");
      return;
    }

    const newState = mowerState === "mowing" ? "idle" : "mowing";

    // Reset path when starting new session
    if (newState === "mowing" && path.length === 0) {
      setPath([position]);
    }

    setMowerState(newState);

    await createNotification(
      newState === "mowing" ? "Mower Started" : "Mower Paused",
      "Status updated",
      "system"
    );
  };

  const handleStop = async () => {
    if (!isMowerConnected) {
      await createNotification("Mower Offline", "Cannot stop: mower is not connected.", "error");
      return;
    }

    setMowerState("idle");
    await createNotification("Mower Stopped", "Mower stopped.", "error");
  };

  const handleManualRecovery = async () => {
    if (!isMowerConnected) return;
    setIsTipped(false);
    await createNotification("Manual Recovery", "Mower fixed.", "completed");
  };

  if (!isMounted)
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAF7] to-white p-6">
      {isTipped && (
        <div className="mb-4 bg-red-500 text-white p-4 rounded-2xl flex justify-between items-center">
          <div><AlertTriangle className="inline mr-2" /> MOWER TIPPED OVER!</div>
          <button onClick={handleManualRecovery} className="bg-white text-red-500 px-4 py-2 rounded-xl">Recover</button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black text-[#40513B]">
          Smart Mower {isTipped && "(TIPPED)"}
        </h1>
        <div className={`text-sm font-bold px-3 py-1 rounded-full ${isMowerConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {isMowerConnected ? "● Connected" : "○ Offline"}
        </div>
      </div>

      <div className="mb-6 h-[300px] rounded-3xl overflow-hidden border shadow-lg">
        <MapContainer bounds={bounds} zoom={20} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" subdomains={["mt0","mt1","mt2","mt3"]} />
          <Polygon positions={farmShape} color="#22c55e" fillOpacity={0.15} />
          <Marker position={position}><Popup>Smart Mower</Popup></Marker>
          <Polyline positions={path} color="#eab308" weight={4} opacity={0.8} />
        </MapContainer>
      </div>

      <div className="rounded-[2rem] border bg-white p-6 shadow-xl">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <button
            onClick={handleStartPause}
            disabled={!isMowerConnected || isTipped}
            className={`${
              !isMowerConnected || isTipped ? "bg-gray-400 cursor-not-allowed" : "bg-[#40513B]"
            } text-white p-6 rounded-3xl flex flex-col items-center transition`}
          >
            {mowerState === "mowing" ? <Pause size={28} /> : <Play size={28} />}
            <span className="text-xs mt-2">{mowerState === "mowing" ? "Pause" : "Start"}</span>
          </button>

          <button
            onClick={handleStop}
            disabled={!isMowerConnected}
            className={`${
              !isMowerConnected ? "bg-gray-400 cursor-not-allowed" : "bg-red-500"
            } text-white p-6 rounded-3xl flex flex-col items-center transition`}
          >
            <Square size={28} />
            <span className="text-xs mt-2">Stop</span>
          </button>

          <button
            onClick={() => navigate("manual-control")}
            className="bg-[#628141] text-white p-6 rounded-3xl flex flex-col items-center"
          >
            <MapPin size={28} />
            <span className="text-xs mt-2">Manual</span>
          </button>

          <div className="bg-[#E8F3E2] p-6 rounded-3xl flex flex-col items-center">
            <BatteryFull size={28} />
            <span className="text-xs mt-2">Battery</span>
            <span className="text-lg font-black">{Math.floor(batteryHealth)}%</span>
          </div>
        </div>

        <div className="mt-6 bg-[#40513B] text-white rounded-2xl p-6">
          <div className="text-center mb-2">
            <Gauge className="inline" /> Speed {speed}%
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={speed}
            onChange={e => setSpeed(parseInt(e.target.value))}
            className="w-full accent-yellow-400"
            disabled={!isMowerConnected}
          />
          {!isMowerConnected && (
            <p className="text-center text-xs mt-2 text-yellow-200">
              Speed control disabled while mower is offline
            </p>
          )}
        </div>
      </div>
    </div>
  );
}