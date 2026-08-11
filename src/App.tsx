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
  // ===================================================
  // AUTH STATE
  // ===================================================

  const [user, setUser] = useState<User | null>(null);

  const [role, setRole] =
    useState<UserRole>(null);

  const [checking, setChecking] =
    useState(true);

  // ===================================================
  // LOAD USER ROLE FROM FIRESTORE
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

      const userSnapshot =
        await getDoc(userRef);

      // =============================================
      // USER DOCUMENT EXISTS
      // =============================================

      if (userSnapshot.exists()) {
        const userData =
          userSnapshot.data();

        console.log(
          "Firestore user data:",
          userData
        );

        // =========================================
        // ADMIN
        // =========================================

        if (
          userData.role === "admin"
        ) {
          console.log(
            "ADMIN ACCOUNT DETECTED"
          );

          return "admin";
        }

        // =========================================
        // NORMAL USER
        // =========================================

        return "user";
      }

      // =============================================
      // USER DOCUMENT DOES NOT EXIST
      // =============================================

      console.warn(
        "No Firestore user document found."
      );

      // =============================================
      // CREATE DEFAULT USER DOCUMENT
      // =============================================

      try {
        await setDoc(
          userRef,
          {
            uid: currentUser.uid,

            email:
              currentUser.email || "",

            name:
              currentUser.displayName ||
              "ECOMOW User",

            photoURL:
              currentUser.photoURL || "",

            role: "user",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        console.log(
          "Default user document created."
        );
      } catch (createError) {
        console.error(
          "Failed to create user document:",
          createError
        );
      }

      return "user";
    } catch (error) {
      console.error(
        "Failed to load user role:",
        error
      );

      // Safe fallback
      return "user";
    }
  };

  // ===================================================
  // FIREBASE AUTH LISTENER
  // ===================================================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          console.log(
            "AUTH USER:",
            currentUser?.uid
          );

          // =========================================
          // NO USER LOGGED IN
          // =========================================

          if (!currentUser) {
            setUser(null);

            setRole(null);

            setChecking(false);

            return;
          }

          // =========================================
          // USER LOGGED IN
          // =========================================

          setChecking(true);

          setUser(currentUser);

          // =========================================
          // GET USER ROLE
          // =========================================

          const userRole =
            await loadUserRole(
              currentUser
            );

          console.log(
            "USER ROLE:",
            userRole
          );

          setRole(userRole);

          setChecking(false);
        }
      );

    // Cleanup Firebase listener
    return () => {
      unsubscribe();
    };
  }, []);

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = async () => {
    try {
      await signOut(auth);

      setUser(null);

      setRole(null);

      console.log(
        "Successfully logged out."
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  };

  // ===================================================
  // LOADING SCREEN
  // ===================================================

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5EA] p-6">
        <div className="text-center bg-white rounded-3xl p-8 shadow-lg border border-[#E5D9B6]/50">
          <div className="w-12 h-12 border-4 border-[#628141]/20 border-t-[#628141] rounded-full animate-spin mx-auto mb-5" />

          <p className="text-sm font-black text-[#40513B]">
            Loading ECOMOW...
          </p>

          <p className="text-xs text-[#6D7C66] font-medium mt-1">
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
                onLogin={() => {
                  // Firebase Auth listener
                  // automatically detects login.
                }}
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
                onLogin={() => {
                  // Firebase Auth listener
                  // automatically detects signup.
                }}
              />
            )
          }
        />

        {/* =================================================
            NORMAL USER APP
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

          {/* =================================================
              AUTOMATIC CONTROL
              
              /app
              /app/automatic-control
          ================================================= */}

          <Route
            index
            element={
              <AutomaticControl />
            }
          />

          <Route
            path="automatic-control"
            element={
              <AutomaticControl />
            }
          />

          {/* =================================================
              SCHEDULE
              
              /app/schedule
          ================================================= */}

          <Route
            path="schedule"
            element={
              <ScheduleScreen />
            }
          />

          {/* =================================================
              ENERGY
              
              /app/energy
          ================================================= */}

          <Route
            path="energy"
            element={
              <EnergyAnalyticsScreen />
            }
          />

          {/* =================================================
              NOTIFICATIONS
              
              /app/notifications
          ================================================= */}

          <Route
            path="notifications"
            element={
              <NotificationsScreen />
            }
          />

          {/* =================================================
              DEVICES
              
              /app/devices
          ================================================= */}

          <Route
            path="devices"
            element={
              <DeviceManagementScreen />
            }
          />

          {/* =================================================
              MANUAL CONTROL
              
              /app/manual-control
          ================================================= */}

          <Route
            path="manual-control"
            element={
              <ManualControlScreen />
            }
          />

          {/* =================================================
              ACCOUNT
              
              /app/account
          ================================================= */}

          <Route
            path="account"
            element={
              <AccountSettingsScreen />
            }
          />

        </Route>

        {/* =================================================
            ADMIN DASHBOARD
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
              <AdminDashboard />
            )
          }
        />

        {/* =================================================
            CATCH ALL
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