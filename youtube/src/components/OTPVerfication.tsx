"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  ShieldCheck,
  X,
  Mail,
  Loader2,
} from "lucide-react";

import { useUser } from "@/lib/AuthContext";

export default function OTPVerification() {
  const {
    otpState,
    otpLoading,
    otpError,
    verifyLoginOTP,
    cancelOTP,
  } = useUser();

  const [otp, setOtp] =
    useState("");
  const [verified, setVerified] =
    useState(false);

  if (!otpState?.required) {
    return null;
  }

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (otp.length !== 6) {
      return;
    }

    const success =
      await verifyLoginOTP(
        otp
      );

    if (success) {
      setOtp("");
      setVerified(true);
      window.setTimeout(() => {
        setVerified(false);
        cancelOTP();
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">

      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">

        {/* CLOSE */}

        <button
          onClick={cancelOTP}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* ICON */}

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40">
          <ShieldCheck
            size={34}
          />
        </div>

        {/* TITLE */}

        <h2 className="text-center text-2xl font-bold">
          Login Verification
        </h2>

        <p className="mt-2 text-center text-gray-500">
          A new login was detected.
        </p>

        {verified && (
          <p className="mt-4 text-center font-semibold text-green-600">
            OTP verified successfully ✓
          </p>
        )}

        {/* EMAIL */}

        <div className="mt-5 flex items-center gap-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">

          <Mail
            size={20}
            className="text-gray-500"
          />

          <span className="break-all text-sm">
            {otpState.email}
          </span>

        </div>

        {/* DESCRIPTION */}

        <p className="mt-5 text-center text-sm text-gray-500">
          We sent a 6-digit verification
          code to your registered email
          address.
        </p>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="mt-5"
        >
          <label className="mb-2 block text-sm font-medium">
            Enter OTP
          </label>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(event) =>
              setOtp(
                event.target.value.replace(
                  /\D/g,
                  ""
                )
              )
            }
            placeholder="Enter 6-digit OTP"
            className="w-full rounded-lg border px-4 py-3 text-center text-xl tracking-[0.5em] outline-none focus:border-blue-500"
          />

          {/* ERROR */}

          {otpError && (
            <p className="mt-3 text-center text-sm text-red-600">
              {otpError}
            </p>
          )}

          {/* VERIFY */}

          <button
            type="submit"
            disabled={
              otp.length !== 6 ||
              otpLoading
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {otpLoading ? (
              <>
                <Loader2
                  size={20}
                  className="animate-spin"
                />

                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck
                  size={20}
                />

                Verify OTP
              </>
            )}
          </button>
        </form>

        {/* TRUST INFO */}

        <p className="mt-5 text-center text-xs text-gray-500">
          After successful verification,
          this device will be trusted for
          30 days.
        </p>

      </div>
    </div>
  );
}