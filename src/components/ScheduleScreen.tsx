import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  Timer,
  Shield,
  Bell,
  Tractor,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ArrowRight,
  Check,
  Send,
} from "lucide-react";

import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";

interface ReservationRequest {
  userId: string;
  userEmail: string;
  mowerId: string;
  mowerName: string;
  rentalDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  status: "pending";
  createdAt: any;
}

const MOWER = {
  id: "ECOMOW-001",
  name: "ECOMOW-001",
  status: "available",
};

const COLORS = {
  primary: "#40513B",
  accent: "#628141",
  light: "#F8FAF7",
  border: "#E5D9B6",
  muted: "#6D7C66",
};

export default function ScheduleScreen() {
  const [user, setUser] = useState<User | null>(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");

  const [existingReservations, setExistingReservations] = useState<any[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // =========================================================
  // AUTH
  // =========================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // =========================================================
  // DATE HELPERS
  // =========================================================

  const formatDateForFirebase = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const selectedDateString = useMemo(
    () => formatDateForFirebase(selectedDate),
    [selectedDate]
  );

  const formattedDate = useMemo(() => {
    return selectedDate.toLocaleDateString("en-PH", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  const getWeekDates = () => {
    const current = new Date(selectedDate);
    const day = current.getDay();

    const startOfWeek = new Date(current);
    startOfWeek.setDate(current.getDate() - day);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return date;
    });
  };

  const weekDates = useMemo(() => getWeekDates(), [selectedDate]);

  const changeWeek = (amount: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + amount * 7);
    setSelectedDate(newDate);
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    return compareDate < today;
  };

  // =========================================================
  // TIME
  // =========================================================

  const durationHours = useMemo(() => {
    if (!startTime || !endTime) return 0;

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;

    const difference = end - start;

    if (difference <= 0) return 0;

    return difference / 60;
  }, [startTime, endTime]);

  const formatDuration = () => {
    if (durationHours <= 0) return "Invalid";

    return `${durationHours} hour${durationHours !== 1 ? "s" : ""}`;
  };

  // =========================================================
  // RESERVATIONS
  // =========================================================

  const loadExistingReservations = async () => {
    try {
      const reservationsRef = collection(db, "rentalRequests");

      const q = query(
        reservationsRef,
        where("mowerId", "==", MOWER.id)
      );

      const snapshot = await getDocs(q);

      const reservations = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setExistingReservations(reservations);
    } catch (error) {
      console.error("Failed to load reservations:", error);
    }
  };

  useEffect(() => {
    loadExistingReservations();
  }, []);

  // =========================================================
  // CONFLICT
  // =========================================================

  const isTimeOverlapping = (
    startA: string,
    endA: string,
    startB: string,
    endB: string
  ) => {
    const [startAHour, startAMinute] = startA.split(":").map(Number);
    const [endAHour, endAMinute] = endA.split(":").map(Number);

    const [startBHour, startBMinute] = startB.split(":").map(Number);
    const [endBHour, endBMinute] = endB.split(":").map(Number);

    const startAValue = startAHour * 60 + startAMinute;
    const endAValue = endAHour * 60 + endAMinute;

    const startBValue = startBHour * 60 + startBMinute;
    const endBValue = endBHour * 60 + endBMinute;

    return (
      startAValue < endBValue &&
      endAValue > startBValue
    );
  };

  const checkScheduleConflict = () => {
    return existingReservations.some((reservation) => {
      if (
        reservation.status === "rejected" ||
        reservation.status === "cancelled" ||
        reservation.status === "completed"
      ) {
        return false;
      }

      if (reservation.rentalDate !== selectedDateString) {
        return false;
      }

      return isTimeOverlapping(
        startTime,
        endTime,
        reservation.startTime,
        reservation.endTime
      );
    });
  };

  const hasConflict = useMemo(() => {
    if (durationHours <= 0) return false;

    return existingReservations.some((reservation) => {
      if (
        reservation.status === "rejected" ||
        reservation.status === "cancelled" ||
        reservation.status === "completed"
      ) {
        return false;
      }

      if (reservation.rentalDate !== selectedDateString) {
        return false;
      }

      return isTimeOverlapping(
        startTime,
        endTime,
        reservation.startTime,
        reservation.endTime
      );
    });
  }, [
    existingReservations,
    selectedDateString,
    startTime,
    endTime,
    durationHours,
  ]);

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const sendBrowserNotification = (
    title: string,
    body: string
  ) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
      });
    }
  };

  const createNotification = async (
    title: string,
    description: string
  ) => {
    if (!user) return;

    try {
      await addDoc(
        collection(
          db,
          "users",
          user.uid,
          "notifications"
        ),
        {
          title,
          description,
          type: "schedule",
          read: false,
          createdAt: serverTimestamp(),
        }
      );
    } catch (error) {
      console.error("Notification error:", error);
    }
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const submitSchedule = async () => {
    setMsg(null);

    if (!user) {
      setMsg("Please log in first.");
      return;
    }

    if (durationHours <= 0) {
      setMsg("End time must be later than start time.");
      return;
    }

    if (isPastDate(selectedDate)) {
      setMsg("You cannot select a date in the past.");
      return;
    }

    const conflict = checkScheduleConflict();

    if (conflict) {
      setMsg(
        "This schedule is already occupied by another user."
      );
      return;
    }

    try {
      setSaving(true);

      const scheduleData: ReservationRequest = {
        userId: user.uid,
        userEmail: user.email || "",

        mowerId: MOWER.id,
        mowerName: MOWER.name,

        rentalDate: selectedDateString,
        startTime,
        endTime,

        durationHours,

        status: "pending",

        createdAt: serverTimestamp(),
      };

      await addDoc(
        collection(db, "rentalRequests"),
        scheduleData
      );

      const title = "Schedule Request Submitted";

      const description =
        `${MOWER.name} schedule requested for ` +
        `${formattedDate} from ${startTime} to ${endTime}. ` +
        `Waiting for admin approval.`;

      await createNotification(
        title,
        description
      );

      sendBrowserNotification(
        title,
        description
      );

      setMsg(
        "✅ Schedule request submitted successfully. Please wait for admin approval."
      );

      await loadExistingReservations();
    } catch (error) {
      console.error("Schedule error:", error);

      setMsg(
        "❌ Failed to submit schedule request."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-xl px-6 py-4 rounded-2xl shadow-lg border border-white">
          <div className="w-4 h-4 rounded-full border-2 border-[#628141] border-t-transparent animate-spin" />
          <span className="text-sm font-black text-[#40513B]">
            Loading schedule...
          </span>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 pb-24 lg:pb-10">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="mb-6 sm:mb-8">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#628141]" />

              <span className="text-[10px] font-black uppercase tracking-[3px] text-[#628141]">
                ECOMOW Scheduler
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#40513B] tracking-tight">
              Schedule
            </h1>

            <p className="mt-2 text-sm sm:text-base text-[#6D7C66] font-medium max-w-xl">
              Plan when you want to use your ECOMOW mower.
              Select your preferred date and operating time.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-3 bg-white/80 backdrop-blur-xl border border-white/70 rounded-2xl px-4 py-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#628141]/10 flex items-center justify-center">
              <Calendar
                size={20}
                className="text-[#628141]"
              />
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-widest font-black text-[#6D7C66]">
                Selected Date
              </p>

              <p className="text-sm font-black text-[#40513B]">
                {selectedDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

        </div>

        {/* MESSAGE */}

        {msg && (
          <div
            className={`mt-5 p-4 rounded-2xl text-sm font-bold flex gap-3 items-start shadow-sm ${
              msg.includes("✅")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {msg.includes("✅") ? (
              <CheckCircle2
                size={20}
                className="flex-shrink-0"
              />
            ) : (
              <AlertCircle
                size={20}
                className="flex-shrink-0"
              />
            )}

            <span>{msg}</span>
          </div>
        )}

      </header>

      {/* =====================================================
          CALENDAR CARD
      ===================================================== */}

      <section className="bg-white/95 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 shadow-lg border border-white/80 mb-6">

        <div className="flex items-center justify-between gap-3 mb-6">

          <div>
            <div className="flex items-center gap-2">
              <Calendar
                size={17}
                className="text-[#628141]"
              />

              <h2 className="text-lg sm:text-xl font-black text-[#40513B]">
                {selectedDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
            </div>

            <p className="text-xs text-[#6D7C66] font-bold mt-1">
              Choose your schedule date
            </p>
          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={() => changeWeek(-1)}
              className="w-10 h-10 rounded-xl bg-[#F8FAF7] border border-[#E5D9B6]/50 flex items-center justify-center text-[#40513B] hover:bg-[#628141]/10 active:scale-95 transition"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() => setSelectedDate(new Date())}
              className="hidden sm:flex px-4 h-10 rounded-xl bg-[#40513B] text-white text-xs font-black items-center justify-center hover:bg-[#2C3627] active:scale-95 transition"
            >
              Today
            </button>

            <button
              onClick={() => changeWeek(1)}
              className="w-10 h-10 rounded-xl bg-[#F8FAF7] border border-[#E5D9B6]/50 flex items-center justify-center text-[#40513B] hover:bg-[#628141]/10 active:scale-95 transition"
            >
              <ChevronRight size={18} />
            </button>

          </div>

        </div>

        {/* WEEK */}

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">

          {weekDates.map((date) => {

            const selected = isSameDate(
              date,
              selectedDate
            );

            const today = isSameDate(
              date,
              new Date()
            );

            const past = isPastDate(date);

            return (
              <button
                key={date.toISOString()}
                onClick={() => !past && setSelectedDate(date)}
                disabled={past}
                className={`
                  min-w-0 rounded-2xl p-2 sm:p-4
                  border transition-all duration-200
                  ${
                    selected
                      ? "bg-[#40513B] border-[#40513B] text-white shadow-lg shadow-[#40513B]/20 scale-[1.02]"
                      : past
                      ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                      : "bg-[#F8FAF7] border-transparent text-[#40513B] hover:border-[#628141]/30 hover:bg-[#628141]/10"
                  }
                `}
              >

                <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider">
                  {date.toLocaleDateString("en-US", {
                    weekday: "short",
                  })}
                </div>

                <div className="text-lg sm:text-2xl font-black mt-1">
                  {date.getDate()}
                </div>

                {today && (
                  <div
                    className={`text-[7px] sm:text-[9px] font-black mt-1 tracking-wider ${
                      selected
                        ? "text-[#D9E8C8]"
                        : "text-[#628141]"
                    }`}
                  >
                    TODAY
                  </div>
                )}

              </button>
            );
          })}

        </div>

      </section>

      {/* =====================================================
          MAIN GRID
      ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ===================================================
            TIME SELECTION
        =================================================== */}

        <section className="lg:col-span-2 bg-white/95 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 lg:p-8 shadow-lg border border-white/80">

          <div className="flex items-center justify-between gap-3 mb-7">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-2xl bg-[#628141]/10 flex items-center justify-center">
                <Clock
                  size={21}
                  className="text-[#628141]"
                />
              </div>

              <div>
                <h2 className="font-black text-[#40513B] text-lg">
                  Select Time
                </h2>

                <p className="text-xs text-[#6D7C66] font-medium">
                  {formattedDate}
                </p>
              </div>

            </div>

            {durationHours > 0 && !hasConflict && (
              <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-xl">
                <Check size={13} />
                Available
              </div>
            )}

          </div>

          {/* TIME INPUTS */}

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-3">

            <div>
              <label className="block text-[9px] font-black text-[#6D7C66] uppercase tracking-[2px] mb-2">
                Start Time
              </label>

              <div className="relative">

                <Clock
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#628141]"
                />

                <input
                  type="time"
                  value={startTime}
                  onChange={(e) =>
                    setStartTime(e.target.value)
                  }
                  className="w-full pl-11 pr-4 py-4 rounded-2xl bg-[#F8FAF7] border border-[#E5D9B6]/60 text-[#40513B] font-black text-lg focus:outline-none focus:ring-2 focus:ring-[#628141]/30 focus:border-[#628141]/40 transition"
                />

              </div>
            </div>

            <div className="hidden sm:flex w-10 h-10 mb-1 rounded-full bg-[#628141]/10 items-center justify-center">
              <ArrowRight
                size={18}
                className="text-[#628141]"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-[#6D7C66] uppercase tracking-[2px] mb-2">
                End Time
              </label>

              <div className="relative">

                <Clock
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#628141]"
                />

                <input
                  type="time"
                  value={endTime}
                  onChange={(e) =>
                    setEndTime(e.target.value)
                  }
                  className="w-full pl-11 pr-4 py-4 rounded-2xl bg-[#F8FAF7] border border-[#E5D9B6]/60 text-[#40513B] font-black text-lg focus:outline-none focus:ring-2 focus:ring-[#628141]/30 focus:border-[#628141]/40 transition"
                />

              </div>
            </div>

          </div>

          {/* DURATION */}

          <div className="mt-5 p-5 rounded-2xl bg-[#40513B] text-white flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Timer size={19} />
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-[2px] font-black text-white/60">
                  Total Duration
                </p>

                <p className="text-sm font-bold text-white/90">
                  Estimated operating time
                </p>
              </div>

            </div>

            <span className="text-xl sm:text-2xl font-black text-white text-right">
              {formatDuration()}
            </span>

          </div>

          {/* SELECTED SCHEDULE */}

          <div className="mt-5 p-5 rounded-2xl border border-[#E5D9B6]/60 bg-white">

            <div className="flex items-start gap-3">

              <div className="w-10 h-10 rounded-xl bg-[#628141]/10 flex items-center justify-center flex-shrink-0">
                <Calendar
                  size={18}
                  className="text-[#628141]"
                />
              </div>

              <div className="min-w-0">

                <p className="text-[9px] uppercase tracking-[2px] font-black text-[#6D7C66]">
                  Selected Schedule
                </p>

                <p className="font-black text-[#40513B] mt-1">
                  {formattedDate}
                </p>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-black text-[#628141]">
                    {startTime}
                  </span>

                  <ArrowRight
                    size={14}
                    className="text-[#6D7C66]"
                  />

                  <span className="text-sm font-black text-[#628141]">
                    {endTime}
                  </span>
                </div>

              </div>

            </div>

          </div>

          {/* CONFLICT WARNING */}

          {hasConflict && (
            <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 flex gap-3">

              <AlertCircle
                size={19}
                className="text-red-600 flex-shrink-0"
              />

              <div>
                <p className="text-sm font-black text-red-700">
                  Time slot unavailable
                </p>

                <p className="text-xs text-red-600 mt-1">
                  Another reservation already occupies
                  this time period.
                </p>
              </div>

            </div>
          )}

        </section>

        {/* ===================================================
            RIGHT SIDE
        =================================================== */}

        <div className="space-y-6">

          {/* MOWER */}

          <section className="bg-white/95 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-7 shadow-lg border border-white/80">

            <div className="flex items-center justify-between mb-5">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-2xl bg-[#628141]/10 flex items-center justify-center">
                  <Tractor
                    size={21}
                    className="text-[#628141]"
                  />
                </div>

                <div>
                  <h2 className="font-black text-[#40513B]">
                    Mower
                  </h2>

                  <p className="text-[10px] text-[#6D7C66] font-bold uppercase tracking-wider">
                    Assigned equipment
                  </p>
                </div>

              </div>

              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200">
                Available
              </span>

            </div>

            <div className="p-5 rounded-2xl bg-[#F8FAF7] border border-[#E5D9B6]/30">

              <p className="text-xl font-black text-[#40513B]">
                {MOWER.name}
              </p>

              <div className="flex items-center gap-2 mt-2">

                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

                <span className="text-xs font-black text-green-600">
                  READY FOR RESERVATION
                </span>

              </div>

            </div>

          </section>

          {/* REQUEST SUMMARY */}

          <section className="bg-white/95 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-7 shadow-lg border border-white/80">

            <div className="flex items-center gap-3 mb-6">

              <div className="w-11 h-11 rounded-2xl bg-[#628141]/10 flex items-center justify-center">
                <Shield
                  size={20}
                  className="text-[#628141]"
                />
              </div>

              <div>
                <h2 className="font-black text-[#40513B]">
                  Request Summary
                </h2>

                <p className="text-[10px] text-[#6D7C66] font-bold uppercase tracking-wider">
                  Review before submitting
                </p>
              </div>

            </div>

            <div className="space-y-4">

              <div className="flex justify-between gap-4">
                <span className="text-xs text-[#6D7C66] font-bold">
                  Date
                </span>

                <span className="text-xs text-[#40513B] font-black text-right">
                  {selectedDate.toLocaleDateString(
                    "en-PH"
                  )}
                </span>
              </div>

              <div className="h-px bg-[#E5D9B6]/40" />

              <div className="flex justify-between gap-4">
                <span className="text-xs text-[#6D7C66] font-bold">
                  Time
                </span>

                <span className="text-xs text-[#40513B] font-black">
                  {startTime} - {endTime}
                </span>
              </div>

              <div className="h-px bg-[#E5D9B6]/40" />

              <div className="flex justify-between gap-4">
                <span className="text-xs text-[#6D7C66] font-bold">
                  Duration
                </span>

                <span className="text-xs text-[#40513B] font-black">
                  {formatDuration()}
                </span>
              </div>

            </div>

            <div className="mt-5 p-4 rounded-2xl bg-[#628141]/10">

              <div className="flex items-center gap-2">

                <CheckCircle2
                  size={17}
                  className="text-[#628141]"
                />

                <span className="text-xs font-black text-[#40513B]">
                  Admin approval required
                </span>

              </div>

              <p className="text-[11px] text-[#6D7C66] font-medium mt-1 ml-6">
                Your request will be reviewed before
                the mower can be used.
              </p>

            </div>

          </section>

        </div>

      </div>

      {/* =====================================================
          PROCESS
      ===================================================== */}

      <section className="mt-6 bg-[#F8FAF7]/95 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-[#E5D9B6]/60">

        <div className="flex items-center gap-3 mb-6">

          <div className="w-10 h-10 rounded-xl bg-[#628141]/10 flex items-center justify-center">
            <Bell
              size={19}
              className="text-[#628141]"
            />
          </div>

          <div>
            <h2 className="font-black text-[#40513B]">
              Scheduling Process
            </h2>

            <p className="text-xs text-[#6D7C66] font-medium">
              Three simple steps to reserve ECOMOW
            </p>
          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

          {/* STEP 1 */}

          <div className="flex items-start gap-3">

            <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#628141]/10 text-[#628141] flex items-center justify-center text-xs font-black">
              01
            </span>

            <div>
              <p className="text-sm font-black text-[#40513B]">
                Choose Date & Time
              </p>

              <p className="text-xs font-medium text-[#6D7C66] mt-1">
                Select when you want to operate the mower.
              </p>
            </div>

          </div>

          {/* STEP 2 */}

          <div className="flex items-start gap-3">

            <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#628141]/10 text-[#628141] flex items-center justify-center text-xs font-black">
              02
            </span>

            <div>
              <p className="text-sm font-black text-[#40513B]">
                Submit Request
              </p>

              <p className="text-xs font-medium text-[#6D7C66] mt-1">
                Send your schedule to the administrator.
              </p>
            </div>

          </div>

          {/* STEP 3 */}

          <div className="flex items-start gap-3">

            <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#628141]/10 text-[#628141] flex items-center justify-center text-xs font-black">
              03
            </span>

            <div>
              <p className="text-sm font-black text-[#40513B]">
                Wait for Approval
              </p>

              <p className="text-xs font-medium text-[#6D7C66] mt-1">
                You will receive a notification after review.
              </p>
            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          SUBMIT
      ===================================================== */}

      <section className="mt-6 sm:mt-8">

        <button
          onClick={async () => {
            await requestNotificationPermission();
            await submitSchedule();
          }}
          disabled={
            saving ||
            !user ||
            durationHours <= 0 ||
            hasConflict ||
            isPastDate(selectedDate)
          }
          className="
            w-full
            py-5
            rounded-2xl
            sm:rounded-[2rem]
            bg-[#40513B]
            text-white
            font-black
            uppercase
            tracking-[2px]
            text-xs
            sm:text-sm
            shadow-xl
            shadow-[#40513B]/20
            hover:bg-[#2C3627]
            active:scale-[0.99]
            transition-all
            duration-200
            disabled:opacity-40
            disabled:cursor-not-allowed
          "
        >

          {saving ? (
            <span className="flex items-center justify-center gap-3">

              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />

              Submitting Schedule...

            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">

              <Send size={17} />

              Request Schedule

            </span>
          )}

        </button>

        <p className="text-center text-[10px] text-[#6D7C66] font-bold mt-3">
          Your request will be sent to the administrator for approval.
        </p>

      </section>

      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {msg?.includes("✅") && (

        <div className="mt-6 p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-green-50 border border-green-200 flex gap-4 items-start shadow-sm">

          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">

            <CheckCircle2
              className="text-green-600"
              size={22}
            />

          </div>

          <div>

            <h3 className="font-black text-green-800">
              Schedule Request Submitted
            </h3>

            <p className="text-sm text-green-700 mt-1">
              Your schedule is now waiting for admin
              approval. You will receive a notification
              once the admin reviews your request.
            </p>

          </div>

        </div>

      )}

    </div>
  );
}