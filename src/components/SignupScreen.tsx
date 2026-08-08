import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  Link,
} from "react-router-dom";

import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  Phone,
  Image as ImageIcon,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

import { motion } from "framer-motion";

import {
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  updateProfile,
} from "firebase/auth";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  auth,
  db,
  storage,
} from "../firebase";

const logoImage = "/images/logo.jpg";
const grassBg = "/images/mower.jpg";

interface SignupScreenProps {
  onLogin: () => void;
}

export default function SignupScreen({
  onLogin,
}: SignupScreenProps) {

  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [profileFile, setProfileFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  // =====================================================
  // PERSISTENCE
  // =====================================================

  useEffect(() => {

    setPersistence(
      auth,
      browserLocalPersistence
    ).catch(console.error);

  }, []);

  // =====================================================
  // IMAGE PREVIEW
  // =====================================================

  useEffect(() => {

    if (!profileFile) {

      setPreviewUrl(null);
      return;

    }

    const url =
      URL.createObjectURL(
        profileFile
      );

    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };

  }, [profileFile]);

  // =====================================================
  // FRIENDLY ERROR
  // =====================================================

  const friendlyError = (
    e: any
  ) => {

    const code =
      e?.code || "";

    if (
      code ===
      "auth/email-already-in-use"
    ) {
      return "Email already used.";
    }

    if (
      code ===
      "auth/weak-password"
    ) {
      return "Password too weak. Use at least 6 characters.";
    }

    if (
      code ===
      "auth/invalid-email"
    ) {
      return "Invalid email address.";
    }

    if (
      code ===
      "auth/network-request-failed"
    ) {
      return "Network error. Check your internet connection.";
    }

    if (
      code ===
      "auth/operation-not-allowed"
    ) {
      return "Email/password sign-up is not enabled in Firebase Authentication.";
    }

    if (
      code ===
      "storage/unauthorized"
    ) {
      return "Profile picture upload was denied by Firebase Storage rules.";
    }

    return (
      e?.message ||
      "Sign up failed. Please try again."
    );

  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validate = () => {

    if (!name.trim()) {
      return "Please enter your name.";
    }

    if (!email.trim()) {
      return "Please enter your email.";
    }

    if (!phone.trim()) {
      return "Please enter your phone number.";
    }

    if (password.length < 6) {
      return "Password too weak. Minimum 6 characters.";
    }

    if (
      password !==
      confirmPassword
    ) {
      return "Passwords do not match.";
    }

    if (!profileFile) {
      return "Please upload a profile picture.";
    }

    if (
      profileFile.size >
      2 * 1024 * 1024
    ) {
      return "Profile picture too large. Maximum 2MB.";
    }

    return null;

  };

  // =====================================================
  // SIGN UP
  // =====================================================

  const signUp = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setError(null);

    const validationError =
      validate();

    if (validationError) {

      setError(
        validationError
      );

      return;

    }

    try {

      setLoading(true);

      // =================================================
      // CREATE FIREBASE ACCOUNT
      // =================================================

      const credential =
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      const firebaseUser =
        credential.user;

      const uid =
        firebaseUser.uid;

      // =================================================
      // UPLOAD PROFILE IMAGE
      // =================================================

      const extension =
        profileFile!.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const fileRef =
        ref(
          storage,
          `users/${uid}/profile.${extension}`
        );

      await uploadBytes(
        fileRef,
        profileFile!
      );

      const photoURL =
        await getDownloadURL(
          fileRef
        );

      // =================================================
      // UPDATE FIREBASE AUTH PROFILE
      // =================================================

      await updateProfile(
        firebaseUser,
        {
          displayName:
            name.trim(),
          photoURL,
        }
      );

      // =================================================
      // SAVE USER TO FIRESTORE
      // =================================================

      await setDoc(
        doc(
          db,
          "users",
          uid
        ),
        {
          uid,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          photoURL,
          createdAt:
            serverTimestamp(),
          updatedAt:
            serverTimestamp(),
          lastLogin:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      // =================================================
      // SAVE USER ID
      // =================================================

      localStorage.setItem(
        "userId",
        uid
      );

      console.log(
        "Account created successfully:",
        uid
      );

      // =================================================
      // UPDATE APP AUTH STATE
      // =================================================

      onLogin();

      // =================================================
      // GO TO APP
      // =================================================

      navigate(
        "/app",
        {
          replace: true,
        }
      );

    } catch (e: any) {

      console.error(
        "Signup error:",
        e
      );

      setError(
        friendlyError(e)
      );

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
            "brightness(0.4)",
        }}
      />

      {/* OVERLAY */}

      <div className="absolute inset-0 z-0 bg-black/20" />

      {/* CARD */}

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.9,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        className="w-full max-w-[440px] z-10"
      >

        <div className="relative">

          <div className="absolute -inset-1 bg-white/40 rounded-[3rem] blur-[40px] opacity-60" />

          <div className="relative bg-white/10 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/20 shadow-2xl">

            {/* HEADER */}

            <div className="text-center mb-6">

              <div className="w-24 h-24 mx-auto rounded-full bg-white overflow-hidden mb-4">

                <img
                  src={logoImage}
                  className="w-full h-full object-cover"
                  alt="Solar Mower Logo"
                />

              </div>

              <h1 className="text-3xl font-black text-white uppercase">
                SOLAR MOWER
              </h1>

              <p className="text-white/60 text-[10px] uppercase tracking-widest">
                Create Account
              </p>

            </div>

            {/* PROFILE IMAGE */}

            <div className="mb-5 flex items-center gap-4">

              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center">

                {previewUrl ? (

                  <img
                    src={previewUrl}
                    className="w-full h-full object-cover"
                    alt="Profile preview"
                  />

                ) : (

                  <ImageIcon
                    className="text-white/60"
                  />

                )}

              </div>

              <label className="flex-1 cursor-pointer">

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => {

                    const file =
                      e.target.files?.[0] ||
                      null;

                    setProfileFile(
                      file
                    );

                  }}
                />

                <div className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white/80 text-xs font-bold hover:bg-white/15 transition">
                  Upload Profile Picture
                </div>

                <div className="mt-1 text-white/50 text-[10px]">
                  JPG/PNG/WEBP, max 2MB
                </div>

              </label>

            </div>

            {/* FORM */}

            <form
              onSubmit={signUp}
              className="space-y-4"
            >

              {/* NAME */}

              <div className="relative">

                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80"
                />

                <input
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  placeholder="Name"
                  autoComplete="name"
                  className="w-full pl-12 pr-4 py-3 rounded-xl font-bold bg-white/10 text-white placeholder:text-white/60 border border-white/20 shadow-lg backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/30"
                  required
                />

              </div>

              {/* EMAIL */}

              <div className="relative">

                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  placeholder="Email"
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3 rounded-xl font-bold bg-white/10 text-white placeholder:text-white/60 border border-white/20 shadow-lg backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/30"
                  required
                />

              </div>

              {/* PHONE */}

              <div className="relative">

                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80"
                />

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  placeholder="Phone number"
                  autoComplete="tel"
                  className="w-full pl-12 pr-4 py-3 rounded-xl font-bold bg-white/10 text-white placeholder:text-white/60 border border-white/20 shadow-lg backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/30"
                  required
                />

              </div>

              {/* PASSWORD */}

              <div className="relative">

                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80"
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  placeholder="Password"
                  autoComplete="new-password"
                  className="w-full pl-12 pr-12 py-3 rounded-xl font-bold bg-white/10 text-white placeholder:text-white/60 border border-white/20 shadow-lg backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/30"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) =>
                        !value
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >

                  {showPassword ? (
                    <EyeOff />
                  ) : (
                    <Eye />
                  )}

                </button>

              </div>

              {/* CONFIRM PASSWORD */}

              <div className="relative">

                <KeyRound
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80"
                />

                <input
                  type={
                    showConfirm
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className="w-full pl-12 pr-12 py-3 rounded-xl font-bold bg-white/10 text-white placeholder:text-white/60 border border-white/20 shadow-lg backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/30"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirm(
                      (value) =>
                        !value
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                >

                  {showConfirm ? (
                    <EyeOff />
                  ) : (
                    <Eye />
                  )}

                </button>

              </div>

              {/* CREATE ACCOUNT */}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E5D9B6] hover:bg-white py-4 rounded-xl font-black uppercase text-xs flex justify-center items-center gap-2 disabled:opacity-60 transition"
              >

                {loading
                  ? "Creating..."
                  : "Create Account"}

                <ArrowRight
                  size={16}
                />

              </button>

              {/* LOGIN */}

              <Link
                to="/login"
                className="block w-full text-center text-white/70 text-xs hover:text-white"
              >
                May account na? Sign in
              </Link>

            </form>

            {/* ERROR */}

            {error && (

              <div className="mt-4 text-center text-red-200 text-xs bg-red-900/40 p-3 rounded-xl">
                {error}
              </div>

            )}

          </div>

        </div>

        {/* FOOTER */}

        <div className="mt-8 flex justify-center">

          <div className="flex items-center gap-2 text-white/40 text-[9px] uppercase">

            <ShieldCheck
              size={14}
            />

            Secure Session

          </div>

        </div>

      </motion.div>

    </div>
  );
}