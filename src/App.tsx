import React, { useEffect, useState } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "./firebase";

// =====================================================
// AUTH SCREENS
// =====================================================

import LoginScreen from "./components/LoginScreen";
import SignupScreen from "./components/SignupScreen";

// =====================================================
// USER APP
// =====================================================

import AppLayout from "./components/AppLayout";
import AutomaticControl from "./components/AutomaticControl";
import ManualControlScreen from "./components/ManualControlScreen";
import AccountSettingsScreen from "./components/AccountSettingsScreen";
import ScheduleScreen from "./components/ScheduleScreen";
import EnergyAnalyticsScreen from "./components/EnergyAnalyticsScreen";
import NotificationsScreen from "./components/NotificationsScreen";
import DeviceManagementScreen from "./components/DeviceManagementScreen";

// =====================================================
// ADMIN
// =====================================================

import AdminDashboard from "./components/AdminDashboard";

// =====================================================
// TYPES
// =====================================================

type UserRole = "user" | "admin" | null;

// =====================================================
// APP
// =====================================================

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [checking, setChecking] = useState(true);

  // ===================================================
  // LOAD USER ROLE
  // ===================================================

  const loadUserRole = async (
    currentUser: User
  ): Promise<"user" | "admin"> => {
    try {
      const userRef = doc(
        db,
        "users",
        currentUser.uid
      );

      const snapshot = await getDoc(userRef);

      // =================================================
      // USER DOCUMENT EXISTS
      // =================================================

      if (snapshot.exists()) {
        const data = snapshot.data();

        console.log("====================================");
        console.log("AUTH USER:", currentUser.email);
        console.log("USER UID:", currentUser.uid);
        console.log("FIRESTORE USER DATA:", data);
        console.log("ROLE:", data.role);
        console.log("====================================");

        const firestoreRole = String(
          data.role || ""
        ).toLowerCase();

        if (firestoreRole === "admin") {
          return "admin";
        }

        return "user";
      }

      // =================================================
      // USER DOCUMENT DOES NOT EXIST
      // =================================================

      console.warn(
        "No Firestore user document found. Creating user..."
      );

      await setDoc(
        userRef,
        {
          uid: currentUser.uid,
          email: currentUser.email || "",
          name:
            currentUser.displayName ||
            "ECOMOW User",
          photoURL:
            currentUser.photoURL || "",
          role: "user",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      return "user";
    } catch (error) {
      console.error(
        "Failed to load user role:",
        error
      );

      // Safe default
      return "user";
    }
  };

  // ===================================================
  // FIREBASE AUTH LISTENER
  // ===================================================

  useEffect(() => {
    console.log(
      "Starting Firebase Auth listener..."
    );

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          console.log(
            "Firebase Auth State:",
            currentUser?.email || "No user"
          );

          // =============================================
          // NOT LOGGED IN
          // =============================================

          if (!currentUser) {
            setUser(null);
            setRole(null);
            setChecking(false);

            return;
          }

          // =============================================
          // LOGGED IN
          // =============================================

          setChecking(true);
          setUser(currentUser);

          const userRole =
            await loadUserRole(currentUser);

          console.log(
            "FINAL USER ROLE:",
            userRole
          );

          setRole(userRole);
          setChecking(false);
        }
      );

    return () => {
      console.log(
        "Stopping Firebase Auth listener..."
      );

      unsubscribe();
    };
  }, []);

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = async () => {
    try {
      console.log("Logging out...");

      await signOut(auth);

      localStorage.removeItem("userId");

      setUser(null);
      setRole(null);

      console.log(
        "Logout successful."
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      throw error;
    }
  };

  // ===================================================
  // LOADING SCREEN
  // ===================================================

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5EA] px-5">
        <div className="w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-xl border border-[#E5D9B6]/60 text-center">

          <div className="w-16 h-16 rounded-2xl bg-[#628141]/10 flex items-center justify-center mx-auto mb-5">
            <div className="w-9 h-9 border-4 border-[#628141]/20 border-t-[#628141] rounded-full animate-spin" />
          </div>

          <h2 className="text-lg font-black text-[#40513B]">
            Loading ECOMOW...
          </h2>

          <p className="text-xs text-[#6D7C66] font-medium mt-2">
            Checking your account
          </p>

        </div>
      </div>
    );
  }

  // ===================================================
  // ROUTER
  // ===================================================

  return (
    <Router>
      <Routes>

        {/* =================================================
            ROOT
        ================================================= */}

        <Route
          path="/"
          element={
            !user ? (
              <Navigate
                to="/login"
                replace
              />
            ) : role === "admin" ? (
              <Navigate
                to="/admin"
                replace
              />
            ) : (
              <Navigate
                to="/app"
                replace
              />
            )
          }
        />

        {/* =================================================
            LOGIN
        ================================================= */}

        <Route
          path="/login"
          element={
            user ? (
              <Navigate
                to={
                  role === "admin"
                    ? "/admin"
                    : "/app"
                }
                replace
              />
            ) : (
              <LoginScreen
                onLogin={() => {}}
              />
            )
          }
        />

        {/* =================================================
            SIGNUP
        ================================================= */}

        <Route
          path="/signup"
          element={
            user ? (
              <Navigate
                to={
                  role === "admin"
                    ? "/admin"
                    : "/app"
                }
                replace
              />
            ) : (
              <SignupScreen
                onLogin={() => {}}
              />
            )
          }
        />

        {/* =================================================
            USER APPLICATION
        ================================================= */}

        <Route
          path="/app"
          element={
            !user ? (
              <Navigate
                to="/login"
                replace
              />
            ) : role === "admin" ? (
              <Navigate
                to="/admin"
                replace
              />
            ) : (
              <AppLayout
                onLogout={handleLogout}
              />
            )
          }
        >

          {/* HOME */}

          <Route
            index
            element={
              <AutomaticControl />
            }
          />

          {/* AUTOMATIC */}

          <Route
            path="automatic-control"
            element={
              <AutomaticControl />
            }
          />

          {/* SCHEDULE */}

          <Route
            path="schedule"
            element={
              <ScheduleScreen />
            }
          />

          {/* ENERGY */}

          <Route
            path="energy"
            element={
              <EnergyAnalyticsScreen />
            }
          />

          {/* NOTIFICATIONS */}

          <Route
            path="notifications"
            element={
              <NotificationsScreen />
            }
          />

          {/* DEVICES */}

          <Route
            path="devices"
            element={
              <DeviceManagementScreen />
            }
          />

          {/* MANUAL CONTROL */}

          <Route
            path="manual-control"
            element={
              <ManualControlScreen />
            }
          />

          {/* ACCOUNT */}

          <Route
            path="account"
            element={
              <AccountSettingsScreen />
            }
          />

        </Route>

        {/* =================================================
            ADMIN
        ================================================= */}

        <Route
          path="/admin"
          element={
            !user ? (
              <Navigate
                to="/login"
                replace
              />
            ) : role !== "admin" ? (
              <Navigate
                to="/app"
                replace
              />
            ) : (
              <AdminDashboard
                onLogout={handleLogout}
              />
            )
          }
        />

        {/* =================================================
            UNKNOWN ROUTE
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to={
                !user
                  ? "/login"
                  : role === "admin"
                  ? "/admin"
                  : "/app"
              }
              replace
            />
          }
        />

      </Routes>
    </Router>
  );
}