"use client";
import axios from "axios";
import {
  ArrowRight,
  ChevronLeft,
  Loader2,
  Lock,
  RefreshCw,
} from "lucide-react";
import { redirect, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { useAppData, user_service } from "@/context/AppContext";
import Loading from "./Loading";
import toast from "react-hot-toast";

const VerifyOtp = () => {
  const {
    isAuth,
    setIsAuth,
    setUser,
    loading: userLoading,
    fetchChats,
    fetchUsers,
  } = useAppData();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [timer, setTimer] = useState(60);
  const router = useRouter();

  const searchParams = useSearchParams();
  const email: string = searchParams.get("email") || "";

  const otpRefs = Array.from({ length: 6 }, () =>
    useRef<HTMLInputElement>(null)
  );
  const [otp, setOtp] = useState(Array(6).fill(""));

  useEffect(() => {
    if (timer <= 0) return;
    const countdown = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(countdown);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(""); // Clear error on typing

    if (value && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await axios.post(`${user_service}/api/v1/verify`, {
        email,
        otp: enteredOtp, // Fixed: was using undefined 'otpString'
      });

      // Success response
      toast.success(data.message);
      Cookies.set("token", data.token, {
        expires: 15,
        secure: false,
        path: "/",
      });
      setOtp(Array(6).fill(""));
      setUser(data.user);
      setIsAuth(true);
      fetchChats();
      fetchUsers();
    } catch (error: any) {
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Email is required to resend OTP.");
      return;
    }

    setResendLoading(true);
    setError("");
    setOtp(Array(6).fill(""));
    otpRefs[0].current?.focus();

    try {
      await axios.post(`${user_service}/api/v1/login`, {
        email,
      });
      toast.success("OTP sent successfully!");
      setTimer(60);
    } catch (error: any) {
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to resend OTP. Please try again.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").slice(0, 6);

    if (digits.length === 6) {
      const newOtp = digits.split("");
      setOtp(newOtp);
      otpRefs[5].current?.focus();
    }
  };
  if (userLoading) return <Loading />;
  if (isAuth) redirect("/chat");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-lg shadow-blue-900/30">
          <div className="text-center mb-8 relative">
            <button
              className="cursor-pointer absolute top-0 left-0 p-2 text-gray-300 hover:text-white"
              onClick={() => router.push("/login")}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="mx-auto w-20 h-20 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/40 mb-6 transition-transform hover:scale-105">
              <Lock size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
              Verify Your Email
            </h1>
            <p className="text-gray-400 text-base font-medium">
              We have sent a 6-digit code to
            </p>
            <p className="text-blue-400 font-medium">{email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-300 mb-3"
              >
                Enter OTP
              </label>
              <div className="flex justify-between gap-2 mb-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    ref={otpRefs[idx]}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    className="w-12 h-12 text-center text-white text-xl bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                ))}
              </div>
              {error && (
                <p className="text-red-500 text-sm font-medium mt-1">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Verify</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </button>

            <div className="text-center mt-4">
              {timer > 0 ? (
                <p className="text-sm text-gray-400">
                  Resend OTP in{" "}
                  <span className="text-white font-medium">{timer}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-blue-400 font-medium flex items-center justify-center gap-2 hover:text-blue-300 transition mx-auto"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Resend OTP
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm mb-4">
              Didn't receive the code? {/* Fixed typo: 'recieve' */}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
