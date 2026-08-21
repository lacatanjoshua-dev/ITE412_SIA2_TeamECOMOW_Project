import React, { useEffect, useState } from "react";

import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Home,
  Calendar,
  Zap,
  Bell,
  Plus,
  Wifi,
  Bluetooth,
  RefreshCw,
  X,
  LogOut,
  Unplug,
  CircleCheck,
  CircleX,
} from "lucide-react";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import {
  auth,
  db,
  realtimeDb,
} from "../firebase";

import {
  onAuthStateChanged,
  User,
} from "firebase/auth";

import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  ref,
  onValue,
} from "firebase/database";

// =====================================================
// IMAGES
// =====================================================

const logoImage = "/images/Ecomow.png";
const bgImage = "/images/mower.jpg";

// =====================================================
// PROPS
// =====================================================

interface AppLayoutProps {
  onLogout: () => Promise<void>;
}

// =====================================================
// CONNECT MODAL PROPS
// =====================================================

interface ConnectContentProps {
  connected: boolean;
  connecting: boolean;
  connectMsg: string | null;
  close: () => void;
}

// =====================================================
// CONNECT MODAL
// =====================================================

const ConnectContent = ({
  connected,
  connecting,
  connectMsg,
  close,
}: ConnectContentProps) => {
  return (
    <div>

      {/* HEADER */}

      <div className="flex items-center justify-between mb-5">

        <div>

          <h2 className="text-xl font-black text-gray-800">
            Mower Connection
          </h2>

          <p className="text-xs text-gray-500 mt-1">
            Firebase cloud connection
          </p>

        </div>

        <button
          type="button"
          onClick={close}
          className="
            w-8
            h-8
            bg-gray-100
            rounded-full
            flex
            items-center
            justify-center
            hover:bg-gray-200
            transition
          "
        >
          <X size={18} />
        </button>

      </div>

      <div className="space-y-3">

        {/* FIREBASE */}

        <div className="
          flex
          items-center
          gap-4
          w-full
          border
          rounded-xl
          p-4
        ">

          <Wifi
            className={
              connected
                ? "text-green-600"
                : "text-gray-400"
            }
          />

          <div className="flex-1 text-left">

            <p className="font-bold text-gray-800">
              Cloud Connection
            </p>

            <p className="text-xs text-gray-500">
              No same Wi-Fi required
            </p>

          </div>

          {connecting ? (

            <RefreshCw
              className="animate-spin text-gray-400"
              size={20}
            />

          ) : connected ? (

            <CircleCheck
              className="text-green-600"
              size={22}
            />

          ) : (

            <CircleX
              className="text-red-500"
              size={22}
            />

          )}

        </div>

        {/* BLUETOOTH */}

        <button
          type="button"
          disabled
          className="
            flex
            items-center
            gap-4
            w-full
            border
            rounded-xl
            p-4
            opacity-50
            cursor-not-allowed
          "
        >

          <Bluetooth className="text-gray-400" />

          <div className="flex-1 text-left">

            <p className="font-bold text-gray-500">
              Bluetooth
            </p>

            <p className="text-xs text-gray-400">
              Not required for Firebase control
            </p>

          </div>

        </button>

        {/* MESSAGE */}

        {connectMsg && (

          <div
            className={`
              p-3
              rounded-xl
              text-sm
              ${
                connected
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }
            `}
          >
            {connectMsg}
          </div>

        )}

      </div>

    </div>
  );
};

// =====================================================
// APP LAYOUT
// =====================================================

export default function AppLayout({
  onLogout,
}: AppLayoutProps) {

  const location = useLocation();
  const navigate = useNavigate();

  // =====================================================
  // USER
  // =====================================================

  const [user, setUser] =
    useState<User | null>(null);

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const [notificationCount, setNotificationCount] =
    useState(0);

  // =====================================================
  // CONNECTION
  // =====================================================

  const [connectOpen, setConnectOpen] =
    useState(false);

  const [connecting, setConnecting] =
    useState(false);

  const [connected, setConnected] =
    useState(false);

  const [connectMsg, setConnectMsg] =
    useState<string | null>(null);

  // =====================================================
  // MOWER
  // =====================================================

  const [mowerOnline, setMowerOnline] =
    useState(false);

  const [driveStatus, setDriveStatus] =
    useState("OFF");

  // =====================================================
  // AUTH LISTENER
  // =====================================================

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {

          setUser(currentUser);

        }
      );

    return () => unsubscribe();

  }, []);

  // =====================================================
  // FIREBASE CONNECTION
  // =====================================================

  useEffect(() => {

    const connectedRef =
      ref(
        realtimeDb,
        ".info/connected"
      );

    const unsubscribe =
      onValue(
        connectedRef,
        (snapshot) => {

          const firebaseConnected =
            snapshot.val() === true;

          setConnected(firebaseConnected);

          if (firebaseConnected) {

            setConnectMsg(
              "Connected to Firebase cloud."
            );

          } else {

            setConnectMsg(
              "No internet connection."
            );

          }

        }
      );

    return () => unsubscribe();

  }, []);

  // =====================================================
  // MOWER ONLINE
  // =====================================================

  useEffect(() => {

    const onlineRef =
      ref(
        realtimeDb,
        "ecomow/mower/online"
      );

    const unsubscribe =
      onValue(
        onlineRef,
        (snapshot) => {

          const value =
            snapshot.val();

          setMowerOnline(
            value === true
          );

        }
      );

    return () => unsubscribe();

  }, []);

  // =====================================================
  // DRIVE STATUS
  // =====================================================

  useEffect(() => {

    const driveStatusRef =
      ref(
        realtimeDb,
        "ecomow/mower/drive/status"
      );

    const unsubscribe =
      onValue(
        driveStatusRef,
        (snapshot) => {

          const value =
            snapshot.val();

          setDriveStatus(
            value || "OFF"
          );

        }
      );

    return () => unsubscribe();

  }, []);

  // =====================================================
  // CREATE NOTIFICATION
  // =====================================================

  const createNotification = async (
    title: string,
    description: string,
    type:
      | "warning"
      | "system"
      | "completed"
      | "error"
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
          type,
          read: false,
          createdAt:
            serverTimestamp(),
        }
      );

    } catch (error) {

      console.error(
        "Notification error:",
        error
      );

    }

  };

  // =====================================================
  // NOTIFICATION COUNT
  // =====================================================

  useEffect(() => {

    if (!user) {

      setNotificationCount(0);

      return;

    }

    const notificationQuery =
      query(
        collection(
          db,
          "users",
          user.uid,
          "notifications"
        ),
        where(
          "read",
          "==",
          false
        )
      );

    const unsubscribe =
      onSnapshot(
        notificationQuery,
        (snapshot) => {

          setNotificationCount(
            snapshot.docs.length
          );

        },
        (error) => {

          console.error(
            "Notification listener error:",
            error
          );

        }
      );

    return () => unsubscribe();

  }, [user]);

  // =====================================================
  // CONNECT
  // =====================================================

  const handleConnect = () => {

    setConnecting(true);

    setConnectMsg(
      "Checking Firebase connection..."
    );

    const connectedRef =
      ref(
        realtimeDb,
        ".info/connected"
      );

    const unsubscribe =
      onValue(
        connectedRef,
        (snapshot) => {

          const firebaseConnected =
            snapshot.val() === true;

          if (firebaseConnected) {

            setConnected(true);

            setConnectMsg(
              mowerOnline
                ? "Mower is online."
                : "Firebase connected, but mower is offline."
            );

          } else {

            setConnected(false);

            setConnectMsg(
              "No internet connection."
            );

          }

          setConnecting(false);

          unsubscribe();

        }
      );

  };

  // =====================================================
  // CLOSE CONNECTION MODAL
  // =====================================================

  const handleDisconnect = () => {

    setConnectOpen(false);

  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {

    try {

      if (user) {

        await createNotification(
          "Session Ended",
          "User logged out of the mower application.",
          "system"
        );

      }

      await onLogout();

    } catch (error) {

      console.error(
        "Logout error:",
        error
      );

    }

  };

  // =====================================================
  // ACTIVE ROUTE
  // =====================================================

  const isActive = (
    path: string
  ) => {

    if (path === ".") {

      return (
        location.pathname === "/app"
      );

    }

    return location.pathname.startsWith(
      `/app/${path}`
    );

  };

  // =====================================================
  // OPEN CONNECT
  // =====================================================

  const openConnect = () => {

    setConnectOpen(true);

    handleConnect();

  };

  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="
      relative
      min-h-screen
      pb-28
      md:pb-0
    ">

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div
        className="
          fixed
          inset-0
          z-0
          bg-cover
          bg-center
        "
        style={{
          backgroundImage:
            `url(${bgImage})`,
          transform:
            "scale(1.05)",
        }}
      />

      <div className="
        fixed
        inset-0
        z-[1]
        bg-white/30
      " />

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="
        sticky
        top-0
        z-50
      ">

        <div className="
          bg-white/70
          backdrop-blur-xl
          border-b
          border-white/40
          shadow-sm
        ">

          <div className="
            max-w-7xl
            mx-auto
            px-6
            h-16
            flex
            items-center
            justify-between
          ">

            {/* LOGO */}

            <Link
              to="/app"
              className="
                flex
                items-center
                gap-3
              "
            >

              <div className="
                w-10
                h-10
                rounded-full
                bg-white
                shadow-md
                flex
                items-center
                justify-center
              ">

                <img
                  src={logoImage}
                  className="
                    w-9
                    h-9
                    rounded-full
                    object-cover
                  "
                  alt="Solar Mower Logo"
                />

              </div>

              <span className="
                font-bold
                text-green-700
                text-lg
              ">
                SOLAR MOWER
              </span>

            </Link>

            {/* =================================================
                DESKTOP NAV
            ================================================= */}

            <nav className="
              hidden
              md:flex
              items-center
              gap-8
              font-semibold
              text-sm
            ">

              <Link
                to="/app"
                className={`transition ${
                  isActive(".")
                    ? "text-green-700 border-b-2 border-green-600 pb-1"
                    : "text-gray-600 hover:text-green-700"
                }`}
              >
                HOME
              </Link>

              <Link
                to="/app/schedule"
                className={`transition ${
                  isActive("schedule")
                    ? "text-green-700 border-b-2 border-green-600 pb-1"
                    : "text-gray-600 hover:text-green-700"
                }`}
              >
                SCHEDULE
              </Link>

              <Link
                to="/app/energy"
                className={`transition ${
                  isActive("energy")
                    ? "text-green-700 border-b-2 border-green-600 pb-1"
                    : "text-gray-600 hover:text-green-700"
                }`}
              >
                DASHBOARD
              </Link>

            </nav>

            {/* =================================================
                DESKTOP RIGHT
            ================================================= */}

            <div className="
              flex
              items-center
              gap-3
            ">

              {/* MOWER STATUS */}

              <div className="
                hidden
                md:flex
                items-center
                gap-2
                text-xs
                font-semibold
              ">

                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    mowerOnline
                      ? "bg-green-500 animate-pulse"
                      : "bg-red-500"
                  }`}
                />

                <span
                  className={
                    mowerOnline
                      ? "text-green-600"
                      : "text-red-500"
                  }
                >
                  {mowerOnline
                    ? "Mower Online"
                    : "Mower Offline"}
                </span>

              </div>

              {/* CONNECT */}

              <button
                type="button"
                onClick={openConnect}
                className="
                  hidden
                  md:flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-xl
                  bg-green-600
                  hover:bg-green-700
                  text-white
                  text-sm
                  font-semibold
                "
              >

                <Wifi size={16} />

                {connected
                  ? "Firebase"
                  : "Connect"}

              </button>

              {/* LOGOUT */}

              <button
                type="button"
                onClick={handleLogout}
                className="
                  hidden
                  md:flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-xl
                  bg-gray-700
                  hover:bg-gray-800
                  text-white
                  text-sm
                  font-semibold
                "
              >

                <LogOut size={16} />

                Logout

              </button>

              {/* NOTIFICATIONS */}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/app/notifications"
                  )
                }
                className="
                  relative
                  flex
                  items-center
                  gap-2
                  px-3
                  py-2
                  rounded-full
                  bg-white
                  shadow
                  hover:bg-gray-100
                  transition
                "
              >

                <Bell
                  size={20}
                  className="text-green-600"
                />

                <span className="
                  text-sm
                  font-semibold
                  text-gray-700
                ">

                  {notificationCount > 0
                    ? `${notificationCount} new`
                    : "0 notif"}

                </span>

                {notificationCount > 0 && (

                  <span className="
                    absolute
                    -top-1
                    -right-1
                    bg-red-500
                    text-white
                    text-xs
                    w-5
                    h-5
                    rounded-full
                    flex
                    items-center
                    justify-center
                    font-bold
                  ">

                    {notificationCount}

                  </span>

                )}

              </button>

            </div>

          </div>

        </div>

      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <main
        className={`relative z-10 transition-all duration-200 ${
          connectOpen
            ? "blur-sm"
            : ""
        }`}
      >

        <div className="
          max-w-7xl
          mx-auto
          py-6
          px-4
        ">

          <Outlet />

        </div>

      </main>

      {/* =================================================
          MOBILE NAVIGATION
      ================================================= */}

      <nav className="
        md:hidden
        fixed
        bottom-4
        left-0
        right-0
        z-50
        px-4
      ">

        <div className="
          mx-auto
          w-full
          max-w-[380px]
          h-[68px]
          bg-white
          rounded-[1.7rem]
          shadow-[0_10px_35px_rgba(0,0,0,0.18)]
          px-4
          flex
          items-center
          justify-between
          border
          border-white/80
        ">

          {/* =============================================
              HOME
          ============================================= */}

          <Link
            to="/app"
            aria-label="Home"
            className="
              w-12
              h-12
              rounded-full
              flex
              items-center
              justify-center
              transition-all
              duration-200
            "
          >

            <Home
              size={23}
              strokeWidth={2.2}
              className={
                isActive(".")
                  ? "text-green-700"
                  : "text-gray-700"
              }
            />

          </Link>

          {/* =============================================
              SCHEDULE
          ============================================= */}

          <Link
            to="/app/schedule"
            aria-label="Schedule"
            className="
              w-12
              h-12
              rounded-full
              flex
              items-center
              justify-center
              transition-all
              duration-200
            "
          >

            <Calendar
              size={23}
              strokeWidth={2.2}
              className={
                isActive("schedule")
                  ? "text-green-700"
                  : "text-gray-700"
              }
            />

          </Link>

          {/* =============================================
              CENTER CONNECT
          ============================================= */}

          <button
            type="button"
            aria-label="Connect mower"
            onClick={openConnect}
            className={`
              w-[54px]
              h-[54px]
              -mt-7
              rounded-full
              flex
              items-center
              justify-center
              shadow-xl
              border-4
              border-white
              transition-all
              duration-200
              ${
                mowerOnline
                  ? "bg-green-500 ring-2 ring-green-400"
                  : "bg-white ring-2 ring-gray-200"
              }
            `}
          >

            {mowerOnline ? (

              <Unplug
                size={25}
                strokeWidth={2.2}
                className="text-white"
              />

            ) : (

              <Plus
                size={29}
                strokeWidth={2}
                className="text-green-600"
              />

            )}

          </button>

          {/* =============================================
              DASHBOARD / ENERGY
          ============================================= */}

          <Link
            to="/app/energy"
            aria-label="Dashboard"
            className="
              w-12
              h-12
              rounded-full
              flex
              items-center
              justify-center
              transition-all
              duration-200
            "
          >

            <Zap
              size={23}
              strokeWidth={2.2}
              className={
                isActive("energy")
                  ? "text-green-700"
                  : "text-gray-700"
              }
            />

          </Link>

          {/* =============================================
              LOGOUT
          ============================================= */}

          <button
            type="button"
            aria-label="Logout"
            onClick={handleLogout}
            className="
              w-12
              h-12
              rounded-full
              flex
              items-center
              justify-center
              transition-all
              duration-200
            "
          >

            <LogOut
              size={23}
              strokeWidth={2.2}
              className="text-red-500"
            />

          </button>

        </div>

      </nav>

      {/* =================================================
          CONNECT MODAL
      ================================================= */}

      <AnimatePresence>

        {connectOpen && (

          <>

            {/* OVERLAY */}

            <motion.div
              className="
                fixed
                inset-0
                bg-black/40
                z-40
              "
              onClick={handleDisconnect}
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
            />

            {/* MODAL */}

            <motion.div
              initial={{
                scale: 0.85,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              exit={{
                scale: 0.85,
                opacity: 0,
              }}
              className="
                fixed
                inset-0
                z-50
                flex
                items-center
                justify-center
                p-4
              "
            >

              <div className="
                bg-white
                rounded-3xl
                p-6
                w-full
                max-w-md
                shadow-2xl
              ">

                <ConnectContent
                  connecting={connecting}
                  connected={connected}
                  connectMsg={connectMsg}
                  close={handleDisconnect}
                />

                <div className="
                  mt-5
                  pt-4
                  border-t
                ">

                  {/* FIREBASE */}

                  <div className="
                    flex
                    justify-between
                    text-xs
                  ">

                    <span className="text-gray-500">
                      Firebase:
                    </span>

                    <span
                      className={
                        connected
                          ? "text-green-600 font-bold"
                          : "text-red-500 font-bold"
                      }
                    >
                      {connected
                        ? "CONNECTED"
                        : "OFFLINE"}
                    </span>

                  </div>

                  {/* MOWER */}

                  <div className="
                    flex
                    justify-between
                    text-xs
                    mt-2
                  ">

                    <span className="text-gray-500">
                      Mower:
                    </span>

                    <span
                      className={
                        mowerOnline
                          ? "text-green-600 font-bold"
                          : "text-red-500 font-bold"
                      }
                    >
                      {mowerOnline
                        ? "ONLINE"
                        : "OFFLINE"}
                    </span>

                  </div>

                  {/* DRIVE */}

                  <div className="
                    flex
                    justify-between
                    text-xs
                    mt-2
                  ">

                    <span className="text-gray-500">
                      Drive:
                    </span>

                    <span
                      className={
                        driveStatus === "ON"
                          ? "text-green-600 font-bold"
                          : "text-gray-500 font-bold"
                      }
                    >
                      {driveStatus}
                    </span>

                  </div>

                </div>

              </div>

            </motion.div>

          </>

        )}

      </AnimatePresence>

    </div>
  );
}