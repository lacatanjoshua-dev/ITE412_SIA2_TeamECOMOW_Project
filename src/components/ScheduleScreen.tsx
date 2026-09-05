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

import {
  onAuthStateChanged,
  User,
} from "firebase/auth";

import { auth, db } from "../firebase";

/* =========================================================
   TYPES
========================================================= */

interface Reservation {
  id: string;
  userId: string;
  userEmail: string;
  mowerId: string;
  mowerName: string;
  rentalDate: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  status: string;
  createdAt?: any;
}

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

/* =========================================================
   MOWER
========================================================= */

const MOWER = {
  id: "ECOMOW-001",
  name: "ECOMOW-001",
};

/* =========================================================
   COMPONENT
========================================================= */

const ScheduleScreen: React.FC = () => {
  /* =======================================================
     AUTH
  ======================================================= */

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  /* =======================================================
     SCHEDULE STATE
  ======================================================= */

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");

  const [existingReservations, setExistingReservations] =
    useState<Reservation[]>([]);

  const [loadingReservations, setLoadingReservations] =
    useState(true);

  const [saving, setSaving] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);

  /* =======================================================
     AUTH LISTENER
  ======================================================= */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* =======================================================
     DATE HELPERS
  ======================================================= */

  const formatDateForFirebase = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const selectedDateString = useMemo(() => {
    return formatDateForFirebase(selectedDate);
  }, [selectedDate]);

  const formattedDate = useMemo(() => {
    return selectedDate.toLocaleDateString("en-PH", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  /* =======================================================
     WEEK DATES
  ======================================================= */

  const weekDates = useMemo(() => {
    const date = new Date(selectedDate);

    const day = date.getDay();

    date.setDate(date.getDate() - day);

    return Array.from({ length: 7 }, (_, index) => {
      const newDate = new Date(date);

      newDate.setDate(date.getDate() + index);

      return newDate;
    });
  }, [selectedDate]);

  /* =======================================================
     CHANGE WEEK
  ======================================================= */

  const changeWeek = (amount: number) => {
    const newDate = new Date(selectedDate);

    newDate.setDate(newDate.getDate() + amount * 7);

    setSelectedDate(newDate);
  };

  /* =======================================================
     DATE COMPARISON
  ======================================================= */

  const isSameDate = (a: Date, b: Date) => {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const isPastDate = (date: Date) => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const target = new Date(date);

    target.setHours(0, 0, 0, 0);

    return target < today;
  };

  /* =======================================================
     DURATION
  ======================================================= */

  const calculateDuration = (
    start: string,
    end: string
  ): number => {
    const [startHour, startMinute] = start
      .split(":")
      .map(Number);

    const [endHour, endMinute] = end
      .split(":")
      .map(Number);

    const startTotal =
      startHour * 60 + startMinute;

    const endTotal =
      endHour * 60 + endMinute;

    if (endTotal <= startTotal) {
      return 0;
    }

    return (endTotal - startTotal) / 60;
  };

  const durationHours = useMemo(() => {
    return calculateDuration(startTime, endTime);
  }, [startTime, endTime]);

  const formatDuration = () => {
    if (durationHours <= 0) {
      return "Invalid";
    }

    if (durationHours === 1) {
      return "1 hour";
    }

    return `${durationHours} hours`;
  };

  /* =======================================================
     LOAD EXISTING RESERVATIONS
  ======================================================= */

  const loadExistingReservations = async () => {
    if (!user) {
      setExistingReservations([]);
      setLoadingReservations(false);
      return;
    }

    try {
      setLoadingReservations(true);

      const reservationsQuery = query(
        collection(db, "rentalRequests"),
        where("mowerId", "==", MOWER.id)
      );

      const snapshot = await getDocs(reservationsQuery);

      const reservations: Reservation[] =
        snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            userId: data.userId || "",
            userEmail: data.userEmail || "",
            mowerId: data.mowerId || "",
            mowerName: data.mowerName || "",
            rentalDate: data.rentalDate || "",
            startTime: data.startTime || "",
            endTime: data.endTime || "",
            durationHours:
              Number(data.durationHours) || 0,
            status: data.status || "pending",
            createdAt: data.createdAt,
          };
        });

      setExistingReservations(reservations);

      setMsg(null);
    } catch (error: any) {
      console.error(
        "Failed to load reservations:",
        error
      );

      if (error?.code === "permission-denied") {
        setMsg(
          "Permission denied while loading schedules."
        );
      } else if (
        error?.code === "failed-precondition"
      ) {
        setMsg(
          "Firestore query requires an index. Please check the Firebase console."
        );
      } else if (error?.code === "unavailable") {
        setMsg(
          "Firebase is temporarily unavailable."
        );
      } else {
        setMsg(
          "Failed to load existing schedules."
        );
      }
    } finally {
      setLoadingReservations(false);
    }
  };

  /* =======================================================
     LOAD WHEN AUTH IS READY
  ======================================================= */

  useEffect(() => {
    if (!authLoading) {
      loadExistingReservations();
    }
  }, [user, authLoading]);

  /* =======================================================
     TIME OVERLAP
  ======================================================= */

  const isTimeOverlapping = (
    startA: string,
    endA: string,
    startB: string,
    endB: string
  ) => {
    const convertToMinutes = (time: string) => {
      const [hours, minutes] =
        time.split(":").map(Number);

      return hours * 60 + minutes;
    };

    const aStart = convertToMinutes(startA);
    const aEnd = convertToMinutes(endA);

    const bStart = convertToMinutes(startB);
    const bEnd = convertToMinutes(endB);

    return aStart < bEnd && aEnd > bStart;
  };

  /* =======================================================
     CHECK CONFLICT
  ======================================================= */

  const hasConflict = useMemo(() => {
    if (durationHours <= 0) {
      return false;
    }

    return existingReservations.some((reservation) => {
      const status =
        reservation.status.toLowerCase();

      if (
        status === "rejected" ||
        status === "cancelled" ||
        status === "completed"
      ) {
        return false;
      }

      if (
        reservation.rentalDate !==
        selectedDateString
      ) {
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

  /* =======================================================
     NOTIFICATION PERMISSION
  ======================================================= */

  const requestNotificationPermission =
    async () => {
      try {
        if (
          typeof window === "undefined" ||
          !("Notification" in window)
        ) {
          return;
        }

        if (
          Notification.permission ===
          "default"
        ) {
          await Notification.requestPermission();
        }
      } catch (error) {
        console.warn(
          "Notification permission error:",
          error
        );
      }
    };

  /* =======================================================
     BROWSER NOTIFICATION
  ======================================================= */

  const sendBrowserNotification = (
    title: string,
    body: string
  ) => {
    try {
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(title, {
          body,
        });
      }
    } catch (error) {
      console.warn(
        "Browser notification error:",
        error
      );
    }
  };

  /* =======================================================
     CREATE FIREBASE NOTIFICATION
  ======================================================= */

  const createNotification = async (
    title: string,
    description: string
  ) => {
    if (!user) {
      return;
    }

    try {
      await addDoc(
        collection(
          db,
          "users",
          user.uid,
          "notifications"
        ),
        {
          userId: user.uid,
          userEmail: user.email || "",
          title,
          description,
          type: "schedule",
          read: false,
          createdAt: serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(
        "Failed to create notification:",
        error
      );
    }
  };

  /* =======================================================
     SUBMIT SCHEDULE
  ======================================================= */

  const submitSchedule = async () => {
    setMsg(null);

    if (!user) {
      setMsg(
        "Please sign in before requesting a schedule."
      );

      return;
    }

    if (isPastDate(selectedDate)) {
      setMsg(
        "You cannot schedule the mower on a past date."
      );

      return;
    }

    if (durationHours <= 0) {
      setMsg(
        "Please select a valid start and end time."
      );

      return;
    }

    if (hasConflict) {
      setMsg(
        "The selected time overlaps with an existing schedule."
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

      const title =
        "Schedule Request Submitted";

      const description =
        `${MOWER.name} schedule requested for ` +
        `${formattedDate} from ` +
        `${startTime} to ${endTime}. ` +
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
    } catch (error: any) {
      console.error(
        "Failed to submit schedule:",
        error
      );

      if (
        error?.code === "permission-denied"
      ) {
        setMsg(
          "Permission denied. Please check your Firebase Firestore rules."
        );
      } else {
        setMsg(
          "Failed to submit schedule. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     AUTH LOADING
  ======================================================= */

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F1] flex items-center justify-center px-6">
        <div className="text-center">
          <div
            className="
              w-10
              h-10
              border-4
              border-[#40513B]/20
              border-t-[#40513B]
              rounded-full
              animate-spin
              mx-auto
              mb-4
            "
          />

          <p className="text-sm font-bold text-[#40513B]">
            Loading scheduler...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     NO USER
  ======================================================= */

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F4F6F1] flex items-center justify-center px-6">
        <div
          className="
            max-w-md
            w-full
            bg-white
            rounded-[2rem]
            p-8
            shadow-xl
            border
            border-[#DDE4D8]
            text-center
          "
        >
          <div
            className="
              w-16
              h-16
              rounded-2xl
              bg-[#40513B]/10
              flex
              items-center
              justify-center
              mx-auto
              mb-5
            "
          >
            <Shield
              size={30}
              className="text-[#40513B]"
            />
          </div>

          <h2 className="text-xl font-black text-[#2C3627]">
            Sign In Required
          </h2>

          <p className="text-sm text-[#6D7C66] mt-2">
            Please sign in to request a mower schedule.
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#F4F6F1] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

      <div className="max-w-7xl mx-auto">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="mb-6 sm:mb-8">

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">

            <div>

              <div className="flex items-center gap-2 mb-2">

                <div
                  className="
                    w-9
                    h-9
                    rounded-xl
                    bg-[#40513B]
                    flex
                    items-center
                    justify-center
                  "
                >
                  <Calendar
                    size={19}
                    className="text-white"
                  />
                </div>

                <span
                  className="
                    text-xs
                    font-black
                    uppercase
                    tracking-[2px]
                    text-[#6D7C66]
                  "
                >
                  ECOMOW Scheduler
                </span>

              </div>

              <h1
                className="
                  text-3xl
                  sm:text-4xl
                  font-black
                  tracking-tight
                  text-[#2C3627]
                "
              >
                Schedule
              </h1>

              <p
                className="
                  mt-2
                  text-sm
                  sm:text-base
                  text-[#6D7C66]
                  max-w-2xl
                "
              >
                Choose your preferred date and time
                for the ECOMOW smart lawn mower.
              </p>

            </div>

            <div
              className="
                bg-white
                border
                border-[#DDE4D8]
                rounded-2xl
                px-4
                py-3
                shadow-sm
              "
            >

              <p className="text-[10px] font-black uppercase tracking-widest text-[#8A9684]">
                Logged in account
              </p>

              <p className="text-sm font-bold text-[#40513B] mt-1 break-all">
                {user.email || "Authenticated User"}
              </p>

            </div>

          </div>

        </header>

        {/* =================================================
            SELECTED DATE CARD
        ================================================= */}

        <section
          className="
            bg-[#40513B]
            rounded-[2rem]
            p-5
            sm:p-7
            mb-6
            shadow-xl
            shadow-[#40513B]/15
            text-white
          "
        >

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

            <div>

              <p
                className="
                  text-[10px]
                  sm:text-xs
                  font-black
                  uppercase
                  tracking-[2px]
                  text-white/60
                  mb-2
                "
              >
                Selected Date
              </p>

              <h2
                className="
                  text-2xl
                  sm:text-3xl
                  font-black
                "
              >
                {formattedDate}
              </h2>

            </div>

            <div
              className="
                w-14
                h-14
                rounded-2xl
                bg-white/10
                flex
                items-center
                justify-center
              "
            >
              <Calendar size={27} />
            </div>

          </div>

        </section>

        {/* =================================================
            MESSAGE
        ================================================= */}

        {msg && (
          <div
            className={`
              mb-6
              rounded-2xl
              border
              px-4
              py-4
              flex
              items-start
              gap-3
              ${
                msg.startsWith("✅")
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }
            `}
          >

            {msg.startsWith("✅") ? (
              <CheckCircle2
                size={20}
                className="shrink-0 mt-0.5"
              />
            ) : (
              <AlertCircle
                size={20}
                className="shrink-0 mt-0.5"
              />
            )}

            <p className="text-sm font-bold">
              {msg}
            </p>

          </div>
        )}

        {/* =================================================
            CALENDAR
        ================================================= */}

        <section
          className="
            bg-white
            border
            border-[#DDE4D8]
            rounded-[2rem]
            p-5
            sm:p-7
            shadow-sm
            mb-6
          "
        >

          <div
            className="
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-4
              mb-6
            "
          >

            <div>

              <div className="flex items-center gap-2">

                <Calendar
                  size={20}
                  className="text-[#40513B]"
                />

                <h2 className="font-black text-lg text-[#2C3627]">
                  Calendar
                </h2>

              </div>

              <p className="text-xs text-[#8A9684] mt-1">
                Select your preferred rental date.
              </p>

            </div>

            <button
              onClick={() =>
                setSelectedDate(new Date())
              }
              className="
                px-4
                py-2.5
                rounded-xl
                bg-[#F0F3ED]
                text-[#40513B]
                text-xs
                font-black
                uppercase
                tracking-wider
                hover:bg-[#E4EADF]
                transition
              "
            >
              Today
            </button>

          </div>

          <div className="flex items-center justify-between gap-3 mb-5">

            <button
              onClick={() => changeWeek(-1)}
              className="
                w-10
                h-10
                rounded-xl
                border
                border-[#DDE4D8]
                flex
                items-center
                justify-center
                text-[#40513B]
                hover:bg-[#F4F6F1]
                transition
              "
            >
              <ChevronLeft size={20} />
            </button>

            <div className="text-center">

              <p className="text-xs font-black uppercase tracking-wider text-[#8A9684]">
                Week
              </p>

              <p className="text-sm font-black text-[#40513B]">
                {weekDates[0].toLocaleDateString(
                  "en-PH",
                  {
                    month: "short",
                    day: "numeric",
                  }
                )}{" "}
                -{" "}
                {weekDates[6].toLocaleDateString(
                  "en-PH",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
              </p>

            </div>

            <button
              onClick={() => changeWeek(1)}
              className="
                w-10
                h-10
                rounded-xl
                border
                border-[#DDE4D8]
                flex
                items-center
                justify-center
                text-[#40513B]
                hover:bg-[#F4F6F1]
                transition
              "
            >
              <ChevronRight size={20} />
            </button>

          </div>

          <div
            className="
              grid
              grid-cols-7
              gap-2
              sm:gap-3
            "
          >

            {weekDates.map((date) => {

              const selected =
                isSameDate(
                  date,
                  selectedDate
                );

              const past =
                isPastDate(date);

              return (
                <button
                  key={formatDateForFirebase(date)}
                  disabled={past}
                  onClick={() =>
                    setSelectedDate(date)
                  }
                  className={`
                    min-w-0
                    rounded-2xl
                    p-2
                    sm:p-3
                    border
                    transition-all
                    ${
                      selected
                        ? "bg-[#40513B] border-[#40513B] text-white shadow-lg"
                        : past
                        ? "bg-[#F6F7F5] border-[#E8ECE5] text-[#B4BCB0] cursor-not-allowed"
                        : "bg-white border-[#DDE4D8] text-[#40513B] hover:bg-[#F4F6F1]"
                    }
                  `}
                >

                  <span
                    className={`
                      block
                      text-[9px]
                      sm:text-[10px]
                      font-black
                      uppercase
                      tracking-wider
                      ${
                        selected
                          ? "text-white/60"
                          : ""
                      }
                    `}
                  >
                    {date.toLocaleDateString(
                      "en-PH",
                      {
                        weekday: "short",
                      }
                    )}
                  </span>

                  <span
                    className="
                      block
                      text-lg
                      sm:text-xl
                      font-black
                      mt-1
                    "
                  >
                    {date.getDate()}
                  </span>

                  <span
                    className={`
                      block
                      text-[8px]
                      sm:text-[9px]
                      font-bold
                      ${
                        selected
                          ? "text-white/60"
                          : "text-[#8A9684]"
                      }
                    `}
                  >
                    {date.toLocaleDateString(
                      "en-PH",
                      {
                        month: "short",
                      }
                    )}
                  </span>

                </button>
              );
            })}

          </div>

        </section>

        {/* =================================================
            REQUEST SCHEDULE BUTTON
        ================================================= */}

        <section className="mb-6 sm:mb-8">

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
              py-10
              rounded-[2rem]
              bg-[#40513B]
              bg-[#40513B]
              text-white
              font-black
              uppercase
              tracking-[2px]
              text-lg
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

                <span
                  className="
                    w-5
                    h-5
                    border-2
                    border-white/40
                    border-t-white
                    rounded-full
                    animate-spin
                  "
                />

                Saving Schedule...

              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">

                <Send size={21} />

                Request Schedule

              </span>
            )}

          </button>

          <p className="text-center text-[10px] sm:text-xs text-[#6D7C66] font-bold mt-3">
            Your request will be saved to your Firebase
            account and sent to the administrator for approval.
          </p>

        </section>

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* =================================================
              TIME SELECTION
          ================================================= */}

          <section
            className="
              lg:col-span-2
              bg-white
              border
              border-[#DDE4D8]
              rounded-[2rem]
              p-5
              sm:p-7
              shadow-sm
            "
          >

            <div className="flex items-center gap-2 mb-6">

              <Clock
                size={20}
                className="text-[#40513B]"
              />

              <div>

                <h2 className="font-black text-lg text-[#2C3627]">
                  Time Selection
                </h2>

                <p className="text-xs text-[#8A9684]">
                  Choose your rental time.
                </p>

              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* START TIME */}

              <div>

                <label
                  htmlFor="start-time"
                  className="
                    block
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[1.5px]
                    text-[#6D7C66]
                    mb-2
                  "
                >
                  Start Time
                </label>

                <input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) =>
                    setStartTime(e.target.value)
                  }
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-[#DDE4D8]
                    bg-[#F8F9F7]
                    px-4
                    py-4
                    text-lg
                    font-black
                    text-[#40513B]
                    outline-none
                    focus:border-[#40513B]
                    focus:ring-4
                    focus:ring-[#40513B]/10
                  "
                />

              </div>

              {/* END TIME */}

              <div>

                <label
                  htmlFor="end-time"
                  className="
                    block
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[1.5px]
                    text-[#6D7C66]
                    mb-2
                  "
                >
                  End Time
                </label>

                <input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) =>
                    setEndTime(e.target.value)
                  }
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-[#DDE4D8]
                    bg-[#F8F9F7]
                    px-4
                    py-4
                    text-lg
                    font-black
                    text-[#40513B]
                    outline-none
                    focus:border-[#40513B]
                    focus:ring-4
                    focus:ring-[#40513B]/10
                  "
                />

              </div>

            </div>

            {/* DURATION */}

            <div
              className="
                mt-5
                rounded-2xl
                bg-[#F4F6F1]
                border
                border-[#DDE4D8]
                p-5
              "
            >

              <div className="flex items-center justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div
                    className="
                      w-11
                      h-11
                      rounded-xl
                      bg-white
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <Timer
                      size={21}
                      className="text-[#40513B]"
                    />
                  </div>

                  <div>

                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8A9684]">
                      Duration
                    </p>

                    <p className="text-lg font-black text-[#2C3627]">
                      {formatDuration()}
                    </p>

                  </div>

                </div>

                <div className="text-right">

                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8A9684]">
                    Selected Schedule
                  </p>

                  <p className="text-sm font-black text-[#40513B] mt-1">
                    {startTime} - {endTime}
                  </p>

                </div>

              </div>

            </div>

            {/* CONFLICT */}

            {hasConflict && (
              <div
                className="
                  mt-5
                  rounded-2xl
                  bg-red-50
                  border
                  border-red-200
                  p-4
                  flex
                  items-start
                  gap-3
                "
              >

                <AlertCircle
                  size={20}
                  className="
                    text-red-600
                    shrink-0
                    mt-0.5
                  "
                />

                <div>

                  <p className="text-sm font-black text-red-700">
                    Schedule Conflict
                  </p>

                  <p className="text-xs text-red-600 mt-1">
                    The selected time overlaps with
                    another existing reservation.
                    Please choose another time.
                  </p>

                </div>

              </div>
            )}

            {/* INVALID TIME */}

            {durationHours <= 0 && (
              <div
                className="
                  mt-5
                  rounded-2xl
                  bg-amber-50
                  border
                  border-amber-200
                  p-4
                  flex
                  items-start
                  gap-3
                "
              >

                <AlertCircle
                  size={20}
                  className="
                    text-amber-600
                    shrink-0
                    mt-0.5
                  "
                />

                <div>

                  <p className="text-sm font-black text-amber-700">
                    Invalid Time
                  </p>

                  <p className="text-xs text-amber-600 mt-1">
                    End time must be later than
                    start time.
                  </p>

                </div>

              </div>
            )}

          </section>

          {/* =================================================
              MOWER + SUMMARY
          ================================================= */}

          <section className="space-y-6">

            {/* MOWER CARD */}

            <div
              className="
                bg-white
                border
                border-[#DDE4D8]
                rounded-[2rem]
                p-5
                sm:p-6
                shadow-sm
              "
            >

              <div className="flex items-center gap-4">

                <div
                  className="
                    w-14
                    h-14
                    rounded-2xl
                    bg-[#40513B]/10
                    flex
                    items-center
                    justify-center
                  "
                >
                  <Tractor
                    size={27}
                    className="text-[#40513B]"
                  />
                </div>

                <div>

                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8A9684]">
                    Available Mower
                  </p>

                  <h3 className="text-xl font-black text-[#2C3627]">
                    {MOWER.name}
                  </h3>

                </div>

              </div>

              <div
                className="
                  mt-5
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-green-50
                  border
                  border-green-100
                  px-3
                  py-2.5
                "
              >

                <span className="w-2 h-2 rounded-full bg-green-500" />

                <span className="text-xs font-black text-green-700">
                  Available for scheduling
                </span>

              </div>

            </div>

            {/* SUMMARY */}

            <div
              className="
                bg-white
                border
                border-[#DDE4D8]
                rounded-[2rem]
                p-5
                sm:p-6
                shadow-sm
              "
            >

              <div className="flex items-center gap-2 mb-5">

                <CheckCircle2
                  size={19}
                  className="text-[#40513B]"
                />

                <h3 className="font-black text-lg text-[#2C3627]">
                  Request Summary
                </h3>

              </div>

              <div className="space-y-4">

                <div className="flex items-start justify-between gap-4">

                  <span className="text-xs font-bold text-[#8A9684]">
                    Mower
                  </span>

                  <span className="text-xs font-black text-[#40513B] text-right">
                    {MOWER.name}
                  </span>

                </div>

                <div className="h-px bg-[#E8ECE5]" />

                <div className="flex items-start justify-between gap-4">

                  <span className="text-xs font-bold text-[#8A9684]">
                    Date
                  </span>

                  <span className="text-xs font-black text-[#40513B] text-right">
                    {selectedDate.toLocaleDateString(
                      "en-PH",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </span>

                </div>

                <div className="h-px bg-[#E8ECE5]" />

                <div className="flex items-start justify-between gap-4">

                  <span className="text-xs font-bold text-[#8A9684]">
                    Time
                  </span>

                  <span className="text-xs font-black text-[#40513B] text-right">
                    {startTime} - {endTime}
                  </span>

                </div>

                <div className="h-px bg-[#E8ECE5]" />

                <div className="flex items-start justify-between gap-4">

                  <span className="text-xs font-bold text-[#8A9684]">
                    Duration
                  </span>

                  <span className="text-xs font-black text-[#40513B] text-right">
                    {formatDuration()}
                  </span>

                </div>

                <div className="h-px bg-[#E8ECE5]" />

                <div className="flex items-start justify-between gap-4">

                  <span className="text-xs font-bold text-[#8A9684]">
                    Status
                  </span>

                  <span
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-wider
                      px-2.5
                      py-1.5
                      rounded-lg
                      bg-amber-50
                      text-amber-700
                    "
                  >
                    Pending Approval
                  </span>

                </div>

              </div>

            </div>

          </section>

        </div>

        {/* =================================================
            SCHEDULING PROCESS
        ================================================= */}

        <section
          className="
            mt-6
            sm:mt-8
            bg-white
            border
            border-[#DDE4D8]
            rounded-[2rem]
            p-5
            sm:p-7
            shadow-sm
          "
        >

          <div className="flex items-center gap-2 mb-6">

            <Shield
              size={20}
              className="text-[#40513B]"
            />

            <div>

              <h2 className="font-black text-lg text-[#2C3627]">
                Scheduling Process
              </h2>

              <p className="text-xs text-[#8A9684]">
                Your request goes through administrator approval.
              </p>

            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* STEP 1 */}

            <div
              className="
                rounded-2xl
                bg-[#F4F6F1]
                p-5
                border
                border-[#E3E8DF]
              "
            >

              <div className="flex items-center justify-between mb-4">

                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-[#40513B]
                    text-white
                    flex
                    items-center
                    justify-center
                    font-black
                  "
                >
                  1
                </div>

                <ArrowRight
                  size={18}
                  className="text-[#9BA59A]"
                />

              </div>

              <h3 className="font-black text-[#2C3627]">
                Submit Request
              </h3>

              <p className="text-xs text-[#6D7C66] mt-2 leading-relaxed">
                Select your date and time, then
                submit your schedule request.
              </p>

            </div>

            {/* STEP 2 */}

            <div
              className="
                rounded-2xl
                bg-[#F4F6F1]
                p-5
                border
                border-[#E3E8DF]
              "
            >

              <div className="flex items-center justify-between mb-4">

                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-[#40513B]
                    text-white
                    flex
                    items-center
                    justify-center
                    font-black
                  "
                >
                  2
                </div>

                <ArrowRight
                  size={18}
                  className="text-[#9BA59A]"
                />

              </div>

              <h3 className="font-black text-[#2C3627]">
                Admin Review
              </h3>

              <p className="text-xs text-[#6D7C66] mt-2 leading-relaxed">
                The administrator will review your
                requested mower schedule.
              </p>

            </div>

            {/* STEP 3 */}

            <div
              className="
                rounded-2xl
                bg-[#F4F6F1]
                p-5
                border
                border-[#E3E8DF]
              "
            >

              <div className="flex items-center justify-between mb-4">

                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-[#40513B]
                    text-white
                    flex
                    items-center
                    justify-center
                    font-black
                  "
                >
                  3
                </div>

                <Check
                  size={18}
                  className="text-[#40513B]"
                />

              </div>

              <h3 className="font-black text-[#2C3627]">
                Approval
              </h3>

              <p className="text-xs text-[#6D7C66] mt-2 leading-relaxed">
                Once approved, you will receive a
                notification confirming your schedule.
              </p>

            </div>

          </div>

        </section>

        {/* =================================================
            NOTIFICATION INFO
        ================================================= */}

        <section
          className="
            mt-6
            sm:mt-8
            rounded-[2rem]
            bg-[#40513B]/5
            border
            border-[#40513B]/10
            p-5
            sm:p-6
          "
        >

          <div className="flex items-start gap-3">

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-white
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <Bell
                size={19}
                className="text-[#40513B]"
              />
            </div>

            <div>

              <h3 className="font-black text-sm text-[#2C3627]">
                Schedule Notifications
              </h3>

              <p className="text-xs text-[#6D7C66] mt-1 leading-relaxed">
                You will receive a notification when
                your schedule request is submitted and
                when the administrator approves or rejects it.
              </p>

            </div>

          </div>

        </section>

        {/* =================================================
            LOADING RESERVATIONS
        ================================================= */}

        {loadingReservations && (
          <div className="mt-6 text-center">

            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-white
                border
                border-[#DDE4D8]
                px-4
                py-3
                shadow-sm
              "
            >

              <span
                className="
                  w-4
                  h-4
                  border-2
                  border-[#40513B]/20
                  border-t-[#40513B]
                  rounded-full
                  animate-spin
                "
              />

              <span className="text-xs font-bold text-[#6D7C66]">
                Loading existing schedules...
              </span>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default ScheduleScreen;