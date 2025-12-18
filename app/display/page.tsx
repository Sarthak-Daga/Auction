"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { channel } from "../../lib/sync";
import { motion, AnimatePresence } from "framer-motion";

export default function Display() {
  const [state, setState] = useState<any>(null);

  /* -------------------- LOAD + SYNC -------------------- */
  useEffect(() => {
    const saved = localStorage.getItem("auction_state");
    if (saved) {
      setState(JSON.parse(saved));
    }

    channel.onmessage = (e) => {
      if (e.data?.reset) {
        localStorage.removeItem("auction_state");
        setState(null);
        return;
      }

      setState(e.data);
      localStorage.setItem("auction_state", JSON.stringify(e.data));
    };
  }, []);

  /* -------------------- FALLBACK -------------------- */
  if (!state || !state.currentPlayer) {
    return (
      <div
        className="h-screen w-screen bg-[#0f172a]
                   flex items-center justify-center
                   text-[#94a3b8] text-3xl"
      >
        Auction Dashboard
      </div>
    );
  }

  const { currentPlayer, currentBid, teams, showIntro } = state;

  /* -------------------- UI -------------------- */
  return (
    <>
      <AnimatePresence>
        {showIntro && currentPlayer && (
          <motion.div
            key={currentPlayer.SNo}
            className="fixed inset-0 z-50 bg-[#0f172a]
                 flex flex-col items-center justify-center"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* PLAYER IMAGE */}
            <motion.div
              className="relative w-105 h-140"
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <Image
                src={`/players/${currentPlayer.PhotoFile || "default.png"}`}
                alt={currentPlayer.Name}
                fill
                priority
                className="object-contain"
              />
            </motion.div>

            {/* PLAYER NAME */}
            <motion.h1
              className="mt-6 text-6xl font-extrabold text-[#06b6d4]"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {currentPlayer.Name}
            </motion.h1>

            {/* PLAYER DETAILS */}
            <motion.p
              className="mt-2 text-2xl text-[#94a3b8]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {currentPlayer.Role} • Base ₹{currentPlayer.BasePrice}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      {/* MAIN LOGO */}
      <div className="absolute top-4 right-4 z-40">
        <Image
          src="/logos/m2ain.png"
          alt="Main Logo"
          width={180}
          height={180}
          className="object-contain"
          priority
        />
      </div>

      <div
        className="h-screen w-screen bg-[#0f172a] overflow-hidden
                 grid grid-cols-[30%_70%]"
      >
        {/* LEFT — PLAYER (30%) */}
        <div className="flex flex-col items-center justify-center px-8 pt-[-10]">
          <div className="relative w-full max-w-sm aspect-3/4">
            <Image
              src={`/players/${currentPlayer.PhotoFile || "default.png"}`}
              alt={currentPlayer.Name}
              fill
              priority
              className="object-contain
                       drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
            />
          </div>

          <div className="mt-4 text-center">
            <h1 className="text-5xl font-extrabold text-[#06b6d4]">
              {currentPlayer.Name}
            </h1>
            <p className="text-xl text-[#94a3b8] mt-2">
              {currentPlayer.Role} • Base {currentPlayer.BasePrice}
            </p>
          </div>
        </div>

        {/* RIGHT — BID + TEAMS (70%) */}
        <div className="grid grid-rows-[20%_80%] border-l border-[#06b6d4]/20">
          {/* CURRENT BID */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-[#94a3b8] text-2xl mb-2">Current Bid</div>
            <div
              className="text-9xl font-extrabold text-[#06b6d4]
                       tracking-wider
                       drop-shadow-[0_0_40px_rgba(6,182,212,0.7)]"
            >
              {currentBid}
            </div>
          </div>

          {/* TEAMS */}
          <div className="grid grid-cols-4 gap-4 p-4">
            {teams.map((team: any) => (
              <div
                key={team.TeamName}
                className="rounded-xl p-2 text-sm
               h-[210px]                  /* 👈 FIXED HEIGHT */
               flex flex-col
               bg-gradient-to-br from-[#111c33] to-[#0b1220]
               border border-[#06b6d4]/30
               shadow-lg shadow-black/30"
              >
                {/* TEAM HEADER */}
                <div className="flex justify-between items-center font-bold mb-1">
                  <span className="truncate text-[#06b6d4] text-sm">
                    {team.TeamName}
                  </span>
                  <span className="text-[#06b6d4] text-sm">
                    ₹{team.Balance}
                  </span>
                </div>

                {/* PLAYER LIST */}
                <ul
                  className="space-y-[2px]
                   text-[11px]
                   leading-tight
                   overflow-hidden
                   flex-1"
                >
                  {[...team.players]
                    .sort((a: any, b: any) => b.soldPrice - a.soldPrice)
                    .map((p: any, idx: number) => (
                      <li key={idx} className="flex justify-between">
                        <span className="truncate text-white/90">{p.Name}</span>
                        <span className="text-[#06b6d4]">₹{p.soldPrice}</span>
                      </li>
                    ))}

                  {/* EMPTY SLOTS */}
                  {Array.from({ length: 8 - team.players.length }).map(
                    (_, i) => (
                      <li
                        key={`empty-${i}`}
                        className="flex justify-between
                       text-[#94a3b8]/20"
                      >
                        <span>—</span>
                        <span>—</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* SPONSOR MARQUEE */}
      <div className="absolute bottom-4 left-0 w-full overflow-hidden z-30">
        <div className="py-3">
          <motion.div
            className="flex w-max gap-5 px-10"
            animate={{ x: ["0%", "-33.333%"] }}
            transition={{
              repeat: Infinity,
              duration: 18,
              ease: "linear",
            }}
          >
            {[
              "/logos/sponsor1.png",
              "/logos/sponsor2.jpg",
              "/logos/sponsor3.jpg",
              "/logos/sponsor1.png",
              "/logos/sponsor2.jpg",
              "/logos/sponsor3.jpg",
              "/logos/sponsor1.png",
              "/logos/sponsor2.jpg",
              "/logos/sponsor3.jpg",
              "/logos/sponsor1.png",
              "/logos/sponsor2.jpg",
              "/logos/sponsor3.jpg",
              "/logos/sponsor1.png",
              "/logos/sponsor2.jpg",
              "/logos/sponsor3.jpg",
            ].map((logo, i) => (
              <div
                key={i}
                className="w-40 h-5 flex items-center justify-center"
              >
                <Image
                  src={logo}
                  alt={`Sponsor ${i}`}
                  width={160}
                  height={80}
                  className="object-contain opacity-90"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </>
  );
}
