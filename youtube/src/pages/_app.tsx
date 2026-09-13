import type { AppProps } from "next/app";
import Head from "next/head";

import { UserProvider } from "@/lib/AuthContext";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

import OTPVerification from "@/components/OTPVerfication";

import "@/styles/globals.css";

export default function App({
  Component,
  pageProps,
}: AppProps) {
  return (
    <UserProvider>

      <Head>
        <title>
          Your-Tube Clone
        </title>

        <meta
          name="description"
          content="Your-Tube - A YouTube clone"
        />
      </Head>

      <Header />

      <div className="flex items-start">
        <Sidebar />

        <main className="min-w-0 flex-1">
          <Component
            {...pageProps}
          />
        </main>
      </div>

      <OTPVerification />

    </UserProvider>
  );
}