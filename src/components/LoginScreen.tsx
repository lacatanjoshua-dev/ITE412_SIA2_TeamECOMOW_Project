import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import {
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "../firebase";

// Mga image assets
const logoImage = "/images/logo.jpg";
const grassBg = "/images/mower.jpg";

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set persistence once when component mounts
  useEffect(() => {
    auth.useDeviceLanguage();
    setPersistence(auth, browserLocalPersistence).catch(() => {
      setPersistence(auth, browserSessionPersistence).catch(console.error);
    });
  }, []);

 
  const saveUserToFirestore = async (uid: string, email: string, name: string) => {
    try {
      const userRef = doc(db, "users", uid);
      await setDoc(
        userRef,
        {
          email: email,
          name: name,
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true } 
      );
      console.log("User saved to Firestore:", uid);
    } catch (error) {
      console.error("Error saving user to Firestore:", error);
    }
  };

  const handleLogin = async () => {
    try {
      setError(null);
      setLoading(true);

      // Detect in-app browser (Facebook, Instagram, etc.)
      const isInAppBrowser = /FBAN|FBAV|Instagram|Messenger/i.test(navigator.userAgent);
      if (isInAppBrowser) {
        setError("Please open this app in Chrome or Safari to login.");
        setLoading(false);
        return;
      }

      //  Google Sign In
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const uid = user.uid;
      const email = user.email || "";
      const name = user.displayName || "";

      //  I-save ang user sa Firestore (users collection)
      await saveUserToFirestore(uid, email, name);

      // Store uid para magamit sa buong app (fallback kung hindi available ang auth.currentUser agad)
      localStorage.setItem("userId", uid);

      // Tawagin ang callback at mag-navigate
      onLogin();
      navigate("/app");
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === "auth/popup-blocked") {
        setError("Pop-up was blocked. Please allow pop-ups for this site.");
      } else if (error.code === "auth/network-request-failed") {
        setError("Network error. Check your internet connection.");
      } else {
        setError("Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-black">
      {/* Background image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${grassBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.9)",
          transform: "scale(1.03)",
        }}
      />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/60 via-black/30 to-black/15" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="relative">
          <div className="absolute -inset-1 bg-white/30 rounded-[3rem] blur-[45px] opacity-50" />
          <div className="relative bg-white/10 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/20 shadow-2xl text-center">
            {/* Logo */}
            <div className="w-32 h-32 mx-auto rounded-full bg-white overflow-hidden mb-8 border border-white/30">
              <img src={logoImage} className="w-full h-full object-cover" alt="Logo" />
            </div>
            <h1 className="text-4xl font-black text-white uppercase">SOLAR MOWER</h1>
            <p className="text-white/60 text-sm mt-3 mb-10">Smart Autonomous Lawn System</p>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#E5D9B6] hover:bg-white py-5 rounded-2xl font-black uppercase text-sm text-[#002D13] transition disabled:opacity-60 shadow-lg"
            >
              {loading ? "Connecting..." : "Get Started"}
            </button>

            {/* Error Message */}
            {error && (
              <div className="mt-6 text-center text-red-200 text-xs bg-red-900/40 p-3 rounded-xl">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase">
            <ShieldCheck size={14} /> Secure Session
          </div>
        </div>
      </motion.div>
    </div>
  );
}