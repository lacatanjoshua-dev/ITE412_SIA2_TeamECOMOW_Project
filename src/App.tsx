import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import LoginScreen from "./components/LoginScreen";
import SignupScreen from "./components/SignupScreen";
import AppLayout from "./components/AppLayout";
import ManualControlScreen from "./components/ManualControlScreen";
import AccountSettingsScreen from "./components/AccountSettingsScreen";
import Dashboard from "./components/Dashboard";
import ScheduleScreen from "./components/ScheduleScreen";
import EnergyAnalyticsScreen from "./components/EnergyAnalyticsScreen";
import NotificationsScreen from "./components/NotificationsScreen";
import DeviceManagementScreen from "./components/DeviceManagementScreen";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) return null;

  // Logout handler that signs out from Firebase and updates state
  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
  };

  return (
    <Router>   {/* 👈 Router must wrap everything that uses router hooks */}
      <Routes>
        {/* Root redirect */}
        <Route
          path="/"
          element={<Navigate to={isLoggedIn ? "/app" : "/login"} replace />}
        />

        {/* Public routes */}
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/app" replace />
            ) : (
              <LoginScreen onLogin={() => setIsLoggedIn(true)} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isLoggedIn ? (
              <Navigate to="/app" replace />
            ) : (
              <SignupScreen onLogin={() => setIsLoggedIn(true)} />
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/app"
          element={
            !isLoggedIn ? (
              <Navigate to="/login" replace />
            ) : (
              <AppLayout onLogout={handleLogout} />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="schedule" element={<ScheduleScreen />} />
          <Route path="energy" element={<EnergyAnalyticsScreen />} />
          <Route path="notifications" element={<NotificationsScreen />} />
          <Route path="devices" element={<DeviceManagementScreen />} />
          <Route path="manual-control" element={<ManualControlScreen />} />
          <Route path="account" element={<AccountSettingsScreen />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={isLoggedIn ? "/app" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}