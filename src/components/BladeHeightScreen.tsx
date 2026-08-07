import React, { useState } from "react";
import {
  Sprout,
  Info,
  Wrench,
  ShieldCheck,
  Gauge,
  TrendingDown,
} from "lucide-react";
import { motion } from "framer-motion";

export default function BladeHeightScreen() {
  const [bladeHeight, setBladeHeight] = useState(3);
  const [autoAdjust, setAutoAdjust] = useState(false);

  const heightLabels = ["Very Low", "Low", "Medium", "High", "Very High"];

  return (
    <div className="p-6 max-w-6xl mx-auto pb-24">

      {/* PAGE TITLE */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">
          Blade Control
        </h1>
        <p className="text-white/70 text-sm">
          Precision management for your lawn's health.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-6">

          {/* MAIN GLASS CARD */}
          <div className="
            rounded-[28px]
            bg-white/12
            backdrop-blur-2xl
            border border-white/20
            shadow-[0_18px_60px_rgba(0,0,0,0.35)]
            p-8
          ">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-white font-black flex items-center gap-2">
                <Gauge size={20} />
                Cutting Height
              </h2>
              <div className="text-3xl font-black text-white drop-shadow">
                {bladeHeight.toFixed(1)} cm
              </div>
            </div>

            {/* Grass Visualizer */}
            <div className="relative mb-10 flex items-end justify-center h-44">
              <div className="flex items-end gap-1">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: `${30 + bladeHeight * 15 + (i % 3) * 5}px`,
                    }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="w-2 rounded-t-full bg-gradient-to-t from-green-900 via-green-500 to-lime-300"
                  />
                ))}
              </div>
            </div>

            {/* SLIDER */}
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={bladeHeight}
              onChange={(e) =>
                setBladeHeight(parseFloat(e.target.value))
              }
              className="w-full accent-lime-400"
            />

            <div className="flex justify-between mt-4">
              {heightLabels.map((label, i) => (
                <span
                  key={label}
                  className={`text-xs font-bold ${
                    bladeHeight === i + 1
                      ? "text-white"
                      : "text-white/40"
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* PRESETS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[2, 3, 4.5].map((h, i) => (
              <button
                key={i}
                onClick={() => setBladeHeight(h)}
                className={`
                  rounded-[22px]
                  p-6
                  backdrop-blur-2xl
                  border border-white/20
                  transition
                  ${
                    bladeHeight === h
                      ? "bg-white/25 text-white"
                      : "bg-white/10 text-white/80 hover:bg-white/15"
                  }
                `}
              >
                <p className="font-black text-sm">
                  Preset {i + 1}
                </p>
                <p className="text-xs opacity-60">
                  {h} cm cut
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">

          {/* AUTO ADJUST GLASS CARD */}
          <div className="
            rounded-[28px]
            bg-white/12
            backdrop-blur-2xl
            border border-white/20
            shadow-[0_18px_60px_rgba(0,0,0,0.35)]
            p-8
          ">
            <div className="flex justify-between items-center mb-4">
              <Sprout className="text-lime-300" size={24} />
              <button
                onClick={() => setAutoAdjust(!autoAdjust)}
                className={`w-14 h-8 rounded-full relative transition ${
                  autoAdjust
                    ? "bg-lime-500"
                    : "bg-white/30"
                }`}
              >
                <motion.div
                  animate={{ x: autoAdjust ? 24 : 4 }}
                  className="absolute top-1 w-6 h-6 bg-white rounded-full"
                />
              </button>
            </div>

            <h3 className="text-white font-black mb-2">
              SmartSense™
            </h3>
            <p className="text-white/70 text-sm">
              Automatically adjusts blade torque when
              thick patches are detected.
            </p>
          </div>

          {/* MAINTENANCE GLASS CARD */}
          <div className="
            rounded-[28px]
            bg-white/12
            backdrop-blur-2xl
            border border-white/20
            shadow-[0_18px_60px_rgba(0,0,0,0.35)]
            p-8
          ">
            <h3 className="text-white font-black mb-6 flex items-center gap-2">
              <Wrench size={18} />
              Maintenance
            </h3>

            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/15">
                <p className="text-white/60 text-xs">Sharpness</p>
                <p className="text-white font-black text-lg">
                  92%
                </p>
              </div>

              <div className="bg-white/10 p-4 rounded-2xl border border-white/15">
                <p className="text-white/60 text-xs">Used Hours</p>
                <p className="text-white font-black text-lg">
                  47.2 hrs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING BUTTON */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-xs">
        <button className="w-full bg-lime-500 text-black py-4 rounded-2xl font-black shadow-2xl hover:bg-lime-400 transition">
          Apply Configuration
        </button>
      </div>
    </div>
  );
}
