"use client";

import {
  onAuthStateChanged,
  signInWithPopup,
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
};

// ==========================================
// AUTH CONTEXT TYPE
// ==========================================

type AuthContextType = {
  user: User | null;
  login: (userdata: User) => void;
  logout: () => Promise<void>;
  handlegooglesignin: () => Promise<void>;
};

// ==========================================
// CREATE CONTEXT
// ==========================================

const UserContext =
  createContext<AuthContextType | undefined>(undefined);

// ==========================================
// BACKEND LOGIN
// ==========================================

const loginToBackend = async (
  email: string,
  name: string,
  image: string
): Promise<User | null> => {
  try {
    const response = await fetch(
      "http://localhost:5000/user/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name,
          image,
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

      return null;
    }

    const data = JSON.parse(text);

    if (!data?.result) {
      console.error(
        "Backend did not return result:",
        data
      );

      return null;
    }

    const backendUser: User = {
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
    };

    console.log(
      "Final logged-in user:",
      backendUser
    );

    console.log(
      "MongoDB User ID:",
      backendUser._id
    );

    return backendUser;
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

  const signingIn = useRef(false);

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

    setUser(userdata);

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "user",
        JSON.stringify(userdata)
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

      const backendUser =
        await loginToBackend(
          email,
          name,
          image
        );

      if (backendUser) {
        login(backendUser);
      } else {
        console.error(
          "Backend did not create/login the user."
        );
      }
    } catch (error: any) {
      console.error(
        "Google sign in error:",
        error
      );

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
    } finally {
      signingIn.current = false;
    }
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
    // Restore saved user
    if (typeof window !== "undefined") {
      const savedUser =
        localStorage.getItem("user");

      if (savedUser) {
        try {
          const parsedUser =
            JSON.parse(savedUser);

          if (parsedUser?._id) {
            setUser(parsedUser);

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

            const backendUser =
              await loginToBackend(
                email,
                name,
                image
              );

            if (backendUser) {
              login(backendUser);
            } else {
              console.error(
                "Could not login user to backend."
              );
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