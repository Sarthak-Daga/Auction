import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    // READ PLAYERS
    const playersPath = path.join(process.cwd(), "data", "players.xlsx");
    const playersBuffer = await fs.readFile(playersPath);
    const playersWorkbook = XLSX.read(playersBuffer);
    const playersSheet = playersWorkbook.Sheets[playersWorkbook.SheetNames[0]];
    const playersData = XLSX.utils.sheet_to_json(playersSheet);

    // READ TEAMS
    const teamsPath = path.join(process.cwd(), "data", "teams.xlsx");
    const teamsBuffer = await fs.readFile(teamsPath);
    const teamsWorkbook = XLSX.read(teamsBuffer);
    const teamsSheet = teamsWorkbook.Sheets[teamsWorkbook.SheetNames[0]];
    const teamsData = XLSX.utils.sheet_to_json(teamsSheet);

    return NextResponse.json({
      success: true,
      players: playersData,
      teams: teamsData,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: `${error}` });
  }
}
