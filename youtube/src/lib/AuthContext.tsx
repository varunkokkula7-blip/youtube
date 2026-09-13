"use client";

import {
  onAuthStateChanged,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { auth, provider } from "./firebase";

// ==========================================
// USER TYPE
// ==========================================

export type User = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  channelname?: string;
  Channelname?: string;
  themePreference?: "light" | "dark" | null;
};

type OTPState = {
  required: boolean;
  email: string;
  challengeToken: string;
};

const getDeviceTokenKey = (email: string) =>
  `trustedDeviceToken:${email.trim().toLowerCase()}`;

const getAutomaticTheme = (): "light" | "dark" => {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    })
      .formatToParts(new Date())
      .find((part) => part.type === "hour")?.value || 0
  );

  return hour >= 6 && hour < 18 ? "light" : "dark";
};

// ==========================================
// AUTH CONTEXT TYPE
// ==========================================

type AuthContextType = {
  user: User | null;
  login: (userdata: User) => void;
  logout: () => Promise<void>;
  handlegooglesignin: () => Promise<void>;
  otpState: OTPState | null;
  otpLoading: boolean;
  otpError: string;
  verifyLoginOTP: (otp: string) => Promise<boolean>;
  cancelOTP: () => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => Promise<void>;
};

// ==========================================
// CREATE CONTEXT
// ==========================================

const UserContext =
  createContext<AuthContextType | undefined>(undefined);

// ==========================================
// BACKEND LOGIN
// ==========================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://youtube-hiv1.onrender.com";
const BACKEND_URL = API_URL.replace(/\/$/, "");

const loginToBackend = async (
  email: string,
  name: string,
  image: string,
  deviceToken: string
): Promise<{
  user?: User;
  otpRequired: boolean;
  email?: string;
  challengeToken?: string;
  error?: string;
} | null> => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/user/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name,
          image,
          deviceToken,
        }),
      }
    );

    const text = await response.text();

    console.log("Backend login response:", text);

    if (!response.ok) {
      console.error(
        "Backend login failed:",
        text
      );

      let message = "Unable to complete sign in.";
      try {
        const errorData = JSON.parse(text);
        if (typeof errorData?.message === "string") {
          message = errorData.message;
        }
      } catch {
        // Keep the user-facing fallback when the backend returns non-JSON.
      }

      return {
        otpRequired: false,
        error: message,
      };
    }

    const data = JSON.parse(text);

    if (!data?.result && !data?.otpRequired) {
      console.error(
        "Backend did not return result:",
        data
      );

      return null;
    }

    const backendUser: User = data.result
      ? {
          _id: data.result._id
            ? String(data.result._id)
            : undefined,
          id: data.result._id
            ? String(data.result._id)
            : undefined,
          name: data.result.name || name || "",
          email: data.result.email || email || "",
          image: data.result.image || image || "",
          channelname:
            data.result.channelname ||
            data.result.Channelname ||
            "",
          Channelname:
            data.result.Channelname ||
            data.result.channelname ||
            "",
          themePreference:
            data.result.themePreference || null,
        }
      : {};

    console.log(
      "Final logged-in user:",
      backendUser
    );

    console.log(
      "MongoDB User ID:",
      backendUser._id
    );

    return {
      user: data.result ? backendUser : undefined,
      otpRequired: data.otpRequired === true,
      email: data.email,
      challengeToken: data.challengeToken,
    };
  } catch (error) {
    console.error(
      "Backend login error:",
      error
    );

    return null;
  }
};

// ==========================================
// USER PROVIDER
// ==========================================

export const UserProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] =
    useState<User | null>(null);
  const [otpState, setOtpState] =
    useState<OTPState | null>(null);
  const [otpLoading, setOtpLoading] =
    useState(false);
  const [otpError, setOtpError] =
    useState("");
  const [theme, setThemeState] =
    useState<"light" | "dark">("light");

  const signingIn = useRef(false);
  const backendLoginInProgress = useRef(false);
  const redirectResultProcessed = useRef(false);

  const applyTheme = (nextTheme: "light" | "dark") => {
    document.documentElement.classList.toggle(
      "dark",
      nextTheme === "dark"
    );
    setThemeState(nextTheme);
  };

  const getSavedTheme = (): "light" | "dark" | null => {
    if (typeof window === "undefined") {
      return null;
    }

    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : null;
  };

  // ==========================================
  // LOGIN
  // ==========================================

  const login = (userdata: User) => {
    console.log(
      "Logged in user:",
      userdata
    );

    console.log(
      "MongoDB User ID:",
      userdata._id
    );

    const preferredTheme =
      userdata.themePreference || getSavedTheme() || getAutomaticTheme();

    const loggedInUser = {
      ...userdata,
      themePreference: preferredTheme,
    };

    setUser(loggedInUser);
    applyTheme(preferredTheme);

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "user",
        JSON.stringify(loggedInUser)
      );
      localStorage.setItem(
        "theme",
        preferredTheme
      );
    }
  };

  // ==========================================
  // GOOGLE SIGN IN
  // ==========================================

  const handlegooglesignin = async () => {
    if (signingIn.current) {
      return;
    }

    signingIn.current = true;

    try {
      const isLocalDevelopment =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1");

      // Redirects avoid popup blockers in deployed browsers.
      if (!isLocalDevelopment) {
        await signInWithRedirect(
          auth,
          provider
        );
        return;
      }

      const result =
        await signInWithPopup(
          auth,
          provider
        );

      const firebaseUser =
        result.user;

      const email =
        firebaseUser.email || "";

      const name =
        firebaseUser.displayName || "";

      const image =
        firebaseUser.photoURL ||
        "https://github.com/shadcn.png";

      backendLoginInProgress.current = true;
      const deviceToken =
        localStorage.getItem(
          getDeviceTokenKey(email)
        ) || "";
      const backendLogin =
        await loginToBackend(
          email,
          name,
          image,
          deviceToken
        );

      if (backendLogin?.otpRequired) {
        setOtpError("");
        setOtpState({
          required: true,
          email: backendLogin.email || email,
          challengeToken:
            backendLogin.challengeToken || "",
        });
      } else if (backendLogin?.user) {
        login(backendLogin.user);
      } else {
        console.error(
          "Backend did not create/login the user."
        );
        if (backendLogin?.error) {
          window.alert(backendLogin.error);
        }
      }
    } catch (error: any) {
      console.error(
        "Google sign in error:",
        error
      );

      if (
        error?.code ===
        "auth/popup-blocked"
      ) {
        console.log(
          "Google popup was blocked. Switching to redirect sign-in."
        );
        try {
          await signInWithRedirect(
            auth,
            provider
          );
        } catch (redirectError) {
          console.error(
            "Google redirect sign in error:",
            redirectError
          );
          window.alert(
            "Google sign-in could not connect. Check your internet connection and try again."
          );
        }
        return;
      }

      if (
        error?.code ===
        "auth/cancelled-popup-request"
      ) {
        console.log(
          "Another Google popup was already active."
        );
      }

      if (
        error?.code ===
        "auth/popup-closed-by-user"
      ) {
        console.log(
          "Google sign-in popup was closed."
        );
      }

      if (
        error?.code ===
        "auth/network-request-failed"
      ) {
        window.alert(
          "Google sign-in could not connect. Check your internet connection and try again."
        );
      }

      if (
        error?.code ===
        "auth/unauthorized-domain"
      ) {
        const hostname =
          typeof window !== "undefined"
            ? window.location.hostname
            : "this Vercel domain";

        window.alert(
          `Google sign-in is not enabled for ${hostname}. Add this hostname in Firebase Console > Authentication > Settings > Authorized domains, then redeploy.`
        );
      }
    } finally {
      backendLoginInProgress.current = false;
      signingIn.current = false;
    }
  };

  const verifyLoginOTP = async (otp: string) => {
    if (!otpState) return false;

    setOtpLoading(true);
    setOtpError("");

    try {
      const response = await fetch(
        `${BACKEND_URL}/user/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: otpState.email,
            otp,
            challengeToken: otpState.challengeToken,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success || !data.result) {
        setOtpError(
          data.message || "Unable to verify OTP."
        );
        return false;
      }

      if (data.deviceToken) {
        localStorage.setItem(
          getDeviceTokenKey(otpState.email),
          data.deviceToken
        );
      }

      login(data.result);
      return true;
    } catch (error) {
      console.error("OTP verification error:", error);
      setOtpError(
        "Unable to verify OTP. Please try again."
      );
      return false;
    } finally {
      setOtpLoading(false);
    }
  };

  const cancelOTP = () => {
    setOtpState(null);
    setOtpError("");
  };

  const setTheme = async (nextTheme: "light" | "dark") => {
    applyTheme(nextTheme);

    if (typeof window !== "undefined") {
      localStorage.setItem("theme", nextTheme);
    }

    if (!user?._id) {
      return;
    }

    const response = await fetch(
      `${BACKEND_URL}/security/theme/${encodeURIComponent(user._id)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme: nextTheme }),
      }
    );

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to save theme preference");
    }

    const updatedUser = {
      ...user,
      themePreference: nextTheme,
    };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = async () => {
    try {
      console.log("Starting logout...");

      // Firebase logout
      await signOut(auth);

      // Clear React state
      setUser(null);

      // Clear saved user
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }

      console.log("Logout successful");
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  };

  // ==========================================
  // CHECK FIREBASE AUTH STATE
  // ==========================================

  useEffect(() => {
    const processRedirectSignIn = async () => {
      try {
        const redirectResult = await getRedirectResult(auth);

        // Some deployed browsers resolve the redirect result without
        // emitting a second auth-state event. Complete backend login here.
        if (redirectResult?.user) {
          redirectResultProcessed.current = true;
          const firebaseUser = redirectResult.user;
          const email = firebaseUser.email || "";
          const name = firebaseUser.displayName || "";
          const image =
            firebaseUser.photoURL ||
            "https://github.com/shadcn.png";

          backendLoginInProgress.current = true;
          const deviceToken = localStorage.getItem(
            getDeviceTokenKey(email)
          ) || "";
          const backendLogin = await loginToBackend(
            email,
            name,
            image,
            deviceToken
          );

          if (backendLogin?.otpRequired) {
            setOtpError("");
            setOtpState({
              required: true,
              email: backendLogin.email || email,
              challengeToken: backendLogin.challengeToken || "",
            });
          } else if (backendLogin?.user) {
            login(backendLogin.user);
          } else if (backendLogin?.error) {
            window.alert(backendLogin.error);
          }
        }
      } catch (error: any) {
        console.error(
          "Google redirect result error:",
          error
        );

        if (
          error?.code ===
          "auth/unauthorized-domain"
        ) {
          console.error(
            "Add the current Vercel hostname to Firebase Authorized domains."
          );
        } else if (
          error?.code ===
          "auth/invalid-action-code"
        ) {
          window.alert(
            "This Google sign-in request expired. Please click Sign In again."
          );
        }
      } finally {
        backendLoginInProgress.current = false;
      }
    };

    void processRedirectSignIn();

    // Restore saved user
    if (typeof window !== "undefined") {
      const savedUser =
        localStorage.getItem("user");
      const savedTheme = getSavedTheme();
      applyTheme(savedTheme || getAutomaticTheme());

      if (savedUser) {
        try {
          const parsedUser =
            JSON.parse(savedUser);

          if (parsedUser?._id) {
            setUser(parsedUser);
            applyTheme(
              parsedUser.themePreference || savedTheme || getAutomaticTheme()
            );

            console.log(
              "User restored:",
              parsedUser
            );
          }
        } catch (error) {
          console.error(
            "Could not restore user:",
            error
          );

          localStorage.removeItem("user");
        }
      }
    }

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          if (firebaseUser) {
            console.log(
              "Firebase user found:",
              firebaseUser.email
            );

            const email =
              firebaseUser.email || "";

            const name =
              firebaseUser.displayName || "";

            const image =
              firebaseUser.photoURL ||
              "https://github.com/shadcn.png";

            if (backendLoginInProgress.current) {
              return;
            }

            if (redirectResultProcessed.current) {
              redirectResultProcessed.current = false;
              return;
            }

            const deviceToken =
              localStorage.getItem(
                getDeviceTokenKey(email)
              ) || "";
            backendLoginInProgress.current = true;
            try {
              const backendLogin =
                await loginToBackend(
                  email,
                  name,
                  image,
                  deviceToken
                );

              if (backendLogin?.otpRequired) {
                setOtpError("");
                setOtpState({
                  required: true,
                  email: backendLogin.email || email,
                  challengeToken:
                    backendLogin.challengeToken || "",
                });
              } else if (backendLogin?.user) {
                login(backendLogin.user);
              } else {
                console.error(
                  "Could not login user to backend."
                );
                if (backendLogin?.error) {
                  window.alert(backendLogin.error);
                }
              }
            } finally {
              backendLoginInProgress.current = false;
            }
          } else {
            console.log(
              "No Firebase user."
            );

            setUser(null);

            if (
              typeof window !== "undefined"
            ) {
              localStorage.removeItem(
                "user"
              );
            }
          }
        }
      );

    return () => {
      unsubscribe();
    };
  }, []);

  // ==========================================
  // PROVIDER
  // ==========================================

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        handlegooglesignin,
        otpState,
        otpLoading,
        otpError,
        verifyLoginOTP,
        cancelOTP,
        theme,
        setTheme,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// ==========================================
// USE USER HOOK
// ==========================================

export const useUser = () => {
  const context =
    useContext(UserContext);

  if (!context) {
    throw new Error(
      "useUser must be used inside UserProvider"
    );
  }

  return context;
};