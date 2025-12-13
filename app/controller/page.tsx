"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { send } from "../../lib/sync";

type Player = {
  SNo: number;
  Name: string;
  Role: string;
  BasePrice: number;
  soldPrice?: number;
  unsoldCount?: number;
};

type Team = {
  TeamName: string;
  Balance: number;
  players: Player[];
  playersTaken: number;
};

export default function Controller() {
  /* -------------------- STATE -------------------- */
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [increment, setIncrement] = useState(1000);
  const [bidFinalized, setBidFinalized] = useState(false);
  const [searchNo, setSearchNo] = useState("");
  const [baseOverride, setBaseOverride] = useState<number | "">("");

  const MAX_PLAYERS_PER_TEAM = 8;

  /* -------------------- LOAD INITIAL DATA -------------------- */
  useEffect(() => {
    const saved = localStorage.getItem("auction_state");
    if (saved) {
      const s = JSON.parse(saved);
      setPlayers(s.players);
      setTeams(s.teams);
      setCurrentIndex(s.currentIndex);
      setCurrentPlayer(s.currentPlayer);
      setCurrentBid(s.currentBid);
      return;
    }

    const loadData = async () => {
      const res = await fetch("/api/import");
      const data = await res.json();

      if (data.success) {
        setPlayers(data.players);
        setTeams(
          data.teams.map((t: any) => ({
            ...t,
            players: [],
            playersTaken: 0,
          }))
        );

        if (data.players.length > 0) {
          setCurrentIndex(0);
          setCurrentPlayer(data.players[0]);
          setCurrentBid(data.players[0].BasePrice);
        }
      }
    };

    loadData();
  }, []);

  /* -------------------- BROADCAST (SINGLE SOURCE OF TRUTH) -------------------- */
  const broadcastState = (
    next?: Partial<{
      players: Player[];
      teams: Team[];
      currentIndex: number;
      currentPlayer: Player | null;
      currentBid: number;
    }>
  ) => {
    const state = {
      players: next?.players ?? players,
      teams: next?.teams ?? teams,
      currentIndex: next?.currentIndex ?? currentIndex,
      currentPlayer: next?.currentPlayer ?? currentPlayer,
      currentBid: next?.currentBid ?? currentBid,
    };

    localStorage.setItem("auction_state", JSON.stringify(state));
    send(state);
  };

  /* -------------------- AUTO SYNC -------------------- */
  useEffect(() => {
    if (!currentPlayer) return;
    broadcastState();
  }, [players, teams, currentIndex, currentPlayer, currentBid]);

  /* -------------------- ACTIONS -------------------- */

  const searchPlayer = () => {
    const idx = players.findIndex((p) => String(p.SNo) === searchNo);
    if (idx === -1) return alert("Player not found");

    setCurrentIndex(idx);
    setCurrentPlayer(players[idx]);
    setCurrentBid(players[idx].BasePrice);
    setBidFinalized(false);
  };

  const awardPlayer = (teamIndex: number) => {
    if (!bidFinalized || !currentPlayer) return alert("Finalize bid first");
    if (teams[teamIndex].Balance < currentBid)
      return alert("Insufficient balance");

    const updatedTeams = [...teams];
    const updatedPlayers = [...players];

    updatedTeams[teamIndex].Balance -= currentBid;
    updatedTeams[teamIndex].players.push({
      ...currentPlayer,
      soldPrice: currentBid,
    });
    updatedTeams[teamIndex].playersTaken++;

    updatedPlayers.splice(currentIndex, 1);

    const nextPlayer = updatedPlayers[0] || null;

    setTeams(updatedTeams);
    setPlayers(updatedPlayers);
    setCurrentIndex(0);
    setCurrentPlayer(nextPlayer);
    setCurrentBid(nextPlayer ? nextPlayer.BasePrice : 0);
    setBidFinalized(false);
  };

  const markUnsold = () => {
    if (!currentPlayer) return;

    const updatedPlayers = [...players];
    updatedPlayers[currentIndex] = {
      ...updatedPlayers[currentIndex],
      unsoldCount: (updatedPlayers[currentIndex].unsoldCount || 0) + 1,
    };

    const nextIndex = 0;

    setPlayers(updatedPlayers);
    setCurrentIndex(nextIndex);
    setCurrentPlayer(updatedPlayers[nextIndex]);
    setCurrentBid(updatedPlayers[nextIndex].BasePrice);
    setBidFinalized(false);
    setBaseOverride("");
  };

  const exportResults = () => {
    const rows: any[] = [];

    teams.forEach((team) =>
      team.players.forEach((p) =>
        rows.push({
          Team: team.TeamName,
          Player: p.Name,
          Role: p.Role,
          Price: p.soldPrice,
        })
      )
    );

    const soldSheet = XLSX.utils.json_to_sheet(rows);
    const unsoldSheet = XLSX.utils.json_to_sheet(
      players.map((p) => ({
        SNo: p.SNo,
        Name: p.Name,
        Role: p.Role,
        BasePrice: p.BasePrice,
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, soldSheet, "Sold Players");
    XLSX.utils.book_append_sheet(wb, unsoldSheet, "Unsold Players");

    XLSX.writeFile(wb, "auction_results.xlsx");
  };
  const resetAuction = () => {
    localStorage.removeItem("auction_state");

    // send reset signal to display
    send({ reset: true });

    // reset controller state (optional but clean)
    setPlayers([]);
    setTeams([]);
    setCurrentPlayer(null);
    setCurrentIndex(0);
    setCurrentBid(0);
    setBidFinalized(false);

    // reload fresh data from excel
    window.location.reload();
  };

  return (
    <>
      <div className="min-h-screen bg-[#0f172a] text-white p-8">
        <h1 className="text-4xl font-bold text-[#06b6d4] mb-6">
          Auction Controller
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="bg-[#0b1220] p-4 rounded-xl">
              <label className="text-[#94a3b8] block mb-2">
                Search Player (Serial No)
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={searchNo}
                  onChange={(e) => setSearchNo(e.target.value)}
                  className="w-40 p-2 rounded bg-[#0f172a]"
                />
                <button
                  onClick={searchPlayer}
                  className="px-4 py-2 bg-[#06b6d4] text-black rounded font-bold"
                >
                  Load
                </button>
              </div>
            </div>

            {/* Current Player */}
            <div className="bg-[#0b1220] p-6 rounded-xl">
              {currentPlayer ? (
                <>
                  <h2 className="text-2xl text-[#06b6d4]">
                    {currentPlayer.Name}
                  </h2>
                  <p className="text-[#94a3b8]">{currentPlayer.Role}</p>
                  <p className="text-[#94a3b8]">
                    Base: {currentPlayer.BasePrice}
                  </p>
                  <p className="mt-3 text-xl">
                    Current Bid:{" "}
                    <span className="text-[#06b6d4] font-bold">
                      {currentBid}
                    </span>
                  </p>
                </>
              ) : (
                <p>No player left</p>
              )}
            </div>
            <div className="mt-4">
              <label className="block text-[#94a3b8] mb-1">
                Override Base Price (optional)
              </label>

              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  value={baseOverride}
                  onChange={(e) =>
                    setBaseOverride(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="Lower base price"
                  className="w-40 p-2 rounded bg-[#0f172a] border border-[#06b6d4]/40"
                />

                <button
                  onClick={() => {
                    if (baseOverride === "" || !currentPlayer) return;
                    setCurrentBid(baseOverride);
                    setBidFinalized(false);
                  }}
                  className="px-4 py-2 bg-[#06b6d4] text-black rounded font-bold"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Bid Controls */}
            <div className="bg-[#0b1220] p-6 rounded-xl">
              <input
                type="number"
                value={increment}
                onChange={(e) => setIncrement(+e.target.value)}
                className="w-40 p-2 bg-[#0f172a] rounded"
              />

              <div className="mt-4 flex gap-4">
                <button
                  disabled={bidFinalized}
                  onClick={() => setCurrentBid((b) => b + increment)}
                  className={`px-6 py-3 rounded font-bold ${
                    bidFinalized ? "bg-gray-600" : "bg-[#06b6d4] text-black"
                  }`}
                >
                  Increase
                </button>

                <button
                  onClick={() => setBidFinalized(true)}
                  className="px-6 py-3 bg-green-600 rounded font-bold"
                >
                  Finalize
                </button>

                <button
                  onClick={markUnsold}
                  className="px-6 py-3 bg-red-600 text-white rounded font-bold"
                >
                  Unsold
                </button>
              </div>

              {bidFinalized && (
                <p className="mt-2 text-green-400">
                  Bid finalized – select team
                </p>
              )}
            </div>

            {/* Queue */}
          </div>

          {/* RIGHT – Teams */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <h2 className="text-2xl text-[#06b6d4]">Teams</h2>
            {teams.map((team, i) => {
              const playersBought = team.playersTaken;
              const playersLeft = MAX_PLAYERS_PER_TEAM - playersBought;

              return (
                <div
                  key={team.TeamName}
                  className="bg-[#0b1220] p-3 rounded-lg border border-[#06b6d4]/20"
                >
                  <div className="font-bold text-white truncate">
                    {team.TeamName}
                  </div>

                  <div className="text-[#94a3b8] text-sm">{team.Balance}</div>

                  <button
                    disabled={!bidFinalized || team.playersTaken >= 8}
                    onClick={() => awardPlayer(i)}
                    className={`mt-2 w-full py-1.5 rounded font-bold text-sm
      ${
        bidFinalized && team.playersTaken < 8
          ? "bg-[#06b6d4] text-black"
          : "bg-gray-600 cursor-not-allowed"
      }
    `}
                  >
                    Award
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <button
          onClick={exportResults}
          className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold"
        >
          Export Auction Results (Excel)
        </button>
      <button
        onClick={resetAuction}
        className="mt-4 px-6 py-3 ml-3 bg-red-700 text-white rounded-xl font-bold"
      >
        RESET AUCTION
      </button>
      </div>
    </>
  );
}
