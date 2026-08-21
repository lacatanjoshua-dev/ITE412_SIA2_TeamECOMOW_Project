import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, UserPlus } from "lucide-react";
import { motion } from "framer-motion";


import {
  Capacitor
} from "@capacitor/core";
import {
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  auth,
  googleProvider,
  db,
} from "../firebase";

const logoImage = "/images/Ecomow.png";
const grassBg = "/images/mower.jpg";

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({
  onLogin,
}: LoginScreenProps) {

  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // =====================================================
  // AUTH PERSISTENCE
  // =====================================================

  useEffect(() => {

    auth.useDeviceLanguage();

    setPersistence(
      auth,
      browserLocalPersistence
    ).catch(() => {

      setPersistence(
        auth,
        browserSessionPersistence
      ).catch(console.error);

    });

  }, []);

  // =====================================================
  // SAVE USER
  // =====================================================

  const saveUserToFirestore = async (
    uid: string,
    email: string,
    name: string,
    photoURL: string
  ) => {

    try {

      await setDoc(
        doc(db, "users", uid),
        {
          uid,
          email,
          name,
          photoURL,
          lastLogin:
            serverTimestamp(),
          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

    } catch (error) {

      console.error(
        "Firestore user save error:",
        error
      );

    }

  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async () => {

    try {

      setError(null);
      setLoading(true);

      // Detect in-app browser

      const isInAppBrowser =
        /FBAN|FBAV|Instagram|Messenger/i.test(
          navigator.userAgent
        );

      if (isInAppBrowser) {

        setError(
          "Please open this app in Chrome or Safari to login."
        );

        return;
      }

      // Google login

      const result =
        await signInWithPopup(
          auth,
          googleProvider
        );

      const user =
        result.user;

      const uid =
        user.uid;

      const email =
        user.email || "";

      const name =
        user.displayName || "User";

      const photoURL =
        user.photoURL || "";

      // Save user

      await saveUserToFirestore(
        uid,
        email,
        name,
        photoURL
      );

      // Local user ID

      localStorage.setItem(
        "userId",
        uid
      );

      console.log(
        "Login successful:",
        {
          uid,
          email,
          name,
        }
      );

      // Update App.tsx

      onLogin();

      // Navigate

      navigate(
        "/app",
        {
          replace: true,
        }
      );

    } catch (error: any) {

      console.error(
        "Login error:",
        error
      );

      if (
        error?.code ===
        "auth/popup-blocked"
      ) {

        setError(
          "Pop-up was blocked. Please allow pop-ups for this site."
        );

      } else if (
        error?.code ===
        "auth/popup-closed-by-user"
      ) {

        setError(
          "Google login was cancelled."
        );

      } else if (
        error?.code ===
        "auth/network-request-failed"
      ) {

        setError(
          "Network error. Check your internet connection."
        );

      } else if (
        error?.code ===
        "auth/unauthorized-domain"
      ) {

        setError(
          "This domain is not authorized in Firebase Authentication."
        );

      } else {

        setError(
          error?.message ||
          "Authentication failed. Please try again."
        );

      }

    } finally {

      setLoading(false);

    }

  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">

      {/* BACKGROUND */}

      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            `url(${grassBg})`,
          filter:
            "brightness(0.65)",
          transform:
            "scale(1.03)",
        }}
      />

      {/* OVERLAY */}

      <div className="absolute inset-0 z-0 bg-black/20" />

      {/* CARD */}

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.92,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        className="w-full max-w-[440px] z-10"
      >

        <div className="relative">

          <div className="absolute -inset-1 bg-white/30 rounded-[3rem] blur-[45px] opacity-50" />

          <div className="relative bg-white/10 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/20 shadow-2xl text-center">

            {/* LOGO */}

            <div className="w-32 h-32 mx-auto rounded-full bg-white overflow-hidden mb-8 border border-white/30">

              <img
                src={logoImage}
                className="w-full h-full object-cover"
                alt="Solar Mower Logo"
              />

            </div>

            <h1 className="text-4xl font-black text-white uppercase">
              SOLAR MOWER
            </h1>

            <p className="text-white/70 text-sm mt-3 mb-10">
              Smart Autonomous Lawn System
            </p>

            {/* GOOGLE LOGIN */}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#E5D9B6] hover:bg-white py-5 rounded-2xl font-black uppercase text-sm text-[#002D13] transition disabled:opacity-60 shadow-lg"
            >

              {loading
                ? "Connecting..."
                : "Get Started"}

            </button>

            {/* SIGN UP */}

            <Link
              to="/signup"
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/20 bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition"
            >

              <UserPlus size={17} />

              Create Account

            </Link>

            {/* ERROR */}

            {error && (
              <div className="mt-6 text-center text-red-100 text-xs bg-red-900/50 p-3 rounded-xl">
                {error}
              </div>
            )}

          </div>

        </div>

        {/* SECURITY */}

        <div className="mt-8 flex justify-center">

          <div className="flex items-center gap-2 text-white/60 text-[10px] uppercase">

            <ShieldCheck size={14} />

            Secure Session

          </div>

        </div>

      </motion.div>

    </div>
  );
}