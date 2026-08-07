import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Battery,
  Plus,
  Download,
  Settings,
  Wrench,
  Shield,
  ChevronRight,
} from "lucide-react";


const logoImage = "/images/logo.jpg";
const grassBg = "/images/grass.jpg"; 

interface Mower {
  id: string;
  name: string;
  status: "online" | "offline" | "mowing" | "charging";
  battery: number;
  signal: number;
  lastSeen: string;
}

export default function DeviceManagementScreen() {
  const navigate = useNavigate();

  const mowers: Mower[] = [
    {
      id: "1",
      name: "Backyard Mower",
      status: "mowing",
      battery: 87,
      signal: 95,
      lastSeen: "Active now",
    },
    {
      id: "2",
      name: "Front Lawn Mower",
      status: "charging",
      battery: 45,
      signal: 88,
      lastSeen: "5 minutes ago",
    },
    {
      id: "3",
      name: "Side Yard Mower",
      status: "offline",
      battery: 12,
      signal: 0,
      lastSeen: "2 hours ago",
    },
  ];

  const getStatusColor = (status: Mower["status"]) => {
    switch (status) {
      case "mowing":
        return "bg-[#628141]/20 text-[#628141] border-[#628141]/30";
      case "charging":
        return "bg-[#E67E22]/20 text-[#E67E22] border-[#E67E22]/30";
      case "offline":
        return "bg-gray-100/50 text-[#6D7C66] border-gray-300/50";
      default:
        return "bg-[#40513B]/20 text-[#40513B] border-[#40513B]/30";
    }
  };

  const getStatusDot = (status: Mower["status"]) => {
    switch (status) {
      case "mowing": return "bg-[#628141]";
      case "charging": return "bg-[#E67E22]";
      case "offline": return "bg-[#6D7C66]";
      default: return "bg-[#40513B]";
    }
  };

  const getSignalBars = (signal: number) => {
    const bars = Math.ceil(signal / 25);
    return (
      <div className="flex items-end gap-0.5 h-3">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 rounded-full ${
              bar <= bars ? "bg-[#628141]" : "bg-gray-300/50"
            }`}
            style={{ height: `${bar * 25}%` }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* 🌿 Background Layer */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${grassBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.7) saturate(1.2)' 
        }}
      />

      {/* 📱 Content Layer */}
      <div className="relative z-10 p-6 max-w-6xl mx-auto pb-24 lg:pb-12">
        
        {/* Header with Blur Effect */}
        <div className="mb-10 bg-white/70 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/40 shadow-xl inline-block lg:min-w-[400px]">
          <h1 className="text-3xl font-black text-[#40513B] tracking-widest uppercase mb-2">
            Unit Inventory
          </h1>
          <p className="text-[#40513B]/80 font-bold flex items-center gap-2 text-sm">
            <Shield size={18} className="text-[#628141]" />
            Manage authorized lawn devices
          </p>
        </div>

        <div className="space-y-8">
          {/* Connected Mowers */}
          <div className="space-y-4">
            {mowers.map((mower) => (
              <div
                key={mower.id}
                className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 shadow-2xl border border-white/50 hover:border-[#628141] transition-all group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                  {/* Mower Icon */}
                  <div className="w-24 h-24 bg-white rounded-[1.8rem] border border-gray-100 flex items-center justify-center p-4 group-hover:scale-105 transition-transform overflow-hidden shadow-sm">
                    <img
                      src={logoImage}
                      alt="Mower"
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "https://via.placeholder.com/150?text=Mower";
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <h3 className="font-black text-[#40513B] text-2xl tracking-tight">
                        {mower.name}
                      </h3>

                      <div
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(
                          mower.status
                        )}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusDot(
                            mower.status
                          )} ${mower.status !== "offline" ? "animate-pulse" : ""}`}
                        />
                        {mower.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[#6D7C66]">
                          <Battery className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Battery</span>
                        </div>
                        <div className="font-black text-[#40513B] text-lg">{mower.battery}%</div>
                        <div className="w-20 h-2 bg-gray-200/50 rounded-full overflow-hidden">
                          <div className="h-full bg-[#628141]" style={{ width: `${mower.battery}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-black text-[#6D7C66] uppercase tracking-widest">Link</div>
                        <div className="flex items-center gap-2">
                          {getSignalBars(mower.signal)}
                          <span className="text-lg font-black text-[#40513B]">{mower.signal}%</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-black text-[#6D7C66] uppercase tracking-widest">Last Update</div>
                        <div className="font-black text-[#40513B] text-sm">{mower.lastSeen}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-3">
                    <button
                      onClick={() => navigate("/")}
                      className="flex-1 lg:flex-none px-10 py-4 bg-[#40513B] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-[#40513B]/30 hover:bg-[#2C3627] transition-all active:scale-95"
                    >
                      Control
                    </button>
                    <button
                      onClick={() => navigate("/security")}
                      className="flex-1 lg:flex-none px-10 py-4 bg-white/50 text-[#40513B] rounded-2xl font-black uppercase tracking-widest text-[11px] border border-[#40513B]/20 hover:bg-white transition-all flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Setup
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Mower (Transparent Dashed) */}
          <button
            onClick={() => navigate("/pair-device")}
            className="w-full bg-white/40 hover:bg-white/60 backdrop-blur-sm border-4 border-dashed border-white/60 rounded-[2.5rem] p-10 transition-all group shadow-xl"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Plus className="w-10 h-10 text-[#628141]" />
              </div>
              <div className="text-center">
                <div className="font-black text-[#40513B] text-md uppercase tracking-widest mb-1">Provision Device</div>
                <div className="text-[11px] font-bold text-[#40513B]/70 uppercase">Connect another solar unit to the hub</div>
              </div>
            </div>
          </button>

          {/* Footer Sections with Glassmorphism */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Updates */}
            <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 shadow-xl border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <Download className="w-6 h-6 text-[#628141]" />
                <h2 className="font-black text-[#40513B] uppercase tracking-widest">OS Updates</h2>
              </div>
              <div className="space-y-4">
                <div className="p-5 bg-white/50 rounded-2xl border border-white/50 flex justify-between items-center">
                  <span className="font-black text-[#40513B]">Primary Backyard</span>
                  <span className="px-3 py-1 bg-[#628141]/20 text-[#628141] rounded-full text-[9px] font-black uppercase">V 2.4.0</span>
                </div>
              </div>
            </div>

            {/* Shortcuts */}
            <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 shadow-xl border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <Wrench className="w-6 h-6 text-[#40513B]" />
                <h2 className="font-black text-[#40513B] uppercase tracking-widest">Shortcuts</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button className="w-full p-4 bg-white/50 hover:bg-white rounded-2xl transition-all flex justify-between items-center group">
                  <span className="font-black text-[#40513B] text-xs uppercase">Blade Configuration</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}