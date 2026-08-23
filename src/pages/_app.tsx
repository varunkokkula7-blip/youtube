import Head from "next/head";
import type { AppProps } from "next/app";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { UserProvider } from "../lib/AuthContext";

import "../styles/globals.css";

export default function App({
  Component,
  pageProps,
}: AppProps) {
  return (
    <UserProvider>
      <Head>
        <title>Your-Tube Clone</title>
        <meta
          name="description"
          content="Your-Tube - A YouTube clone"
        />
      </Head>

      <div className="min-h-screen bg-white text-black">
        <Header />

        <div className="flex">
          <Sidebar />

          <main className="min-h-screen flex-1">
            <Component {...pageProps} />
          </main>
        </div>
      </div>
    </UserProvider>
  );
}