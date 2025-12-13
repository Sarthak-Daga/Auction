"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { channel } from "../../lib/sync";

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

  const { currentPlayer, currentBid, teams } = state;

  /* -------------------- UI -------------------- */
  return (
    <div
      className="h-screen w-screen bg-[#0f172a] overflow-hidden
                 grid grid-cols-[30%_70%]"
    >
      {/* LEFT — PLAYER (30%) */}
      <div className="flex flex-col items-center justify-center px-8">
        <div className="relative w-full max-w-md aspect-3/4">
          <Image
            src={`/players/${currentPlayer.PhotoFile || "default.png"}`}
            alt={currentPlayer.Name}
            fill
            priority
            className="object-contain
                       drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
          />
        </div>

        <div className="mt-6 text-center">
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
              className="rounded-xl p-3 text-sm
                         bg-linear-to-br from-[#111c33] to-[#0b1220]
                         border border-[#06b6d4]/30
                         shadow-lg shadow-black/30"
            >
              <div className="flex justify-between items-center font-bold mb-1">
                <span className="truncate text-[#06b6d4]">{team.TeamName}</span>
                <span className="text-[#06b6d4]">{team.Balance}</span>
              </div>

              <ul className="space-y-0.5 text-[12px]">
                {[...team.players]
                  .sort((a: any, b: any) => b.soldPrice - a.soldPrice)
                  .map((p: any, idx: number) => (
                    <li key={idx} className="flex justify-between">
                      <span className="truncate text-white/90">{p.Name}</span>
                      <span className="text-[#06b6d4]">{p.soldPrice}</span>
                    </li>
                  ))}

                {Array.from({
                  length: 8 - team.players.length,
                }).map((_, i) => (
                  <li
                    key={i}
                    className="flex justify-between
                               text-[#94a3b8]/30"
                  >
                    <span>—</span>
                    <span>—</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
