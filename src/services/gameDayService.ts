import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Player interface
export interface Player {
  id: string;
  first_name: string;
  last_name: string;
  dup_rating?: number;
  is_present?: boolean;
}

// Court configuration interface
export interface CourtConfig {
  court_number: number;
  players_count: number;
  display_name: string;
  players: Player[];
}

// Rotation interface
export interface Rotation {
  game_number: number;
  rotation_number: number;
  team1: [Player, Player];
  team2: [Player, Player];
  start_time?: string;
  end_time?: string;
  team1_score?: number;
  team2_score?: number;
}

// Game day assignment interfaces
export interface GameDayAssignment {
  _id: Id<"court_assignments">;
  _creationTime: number;
  league_id: Id<"leagues">;
  game_day_id: Id<"game_days">;
  court_number: number;
  player_id: Id<"profiles">;
  slot_number: number;
  substitute_name?: string;
  regular_player_id?: Id<"profiles">;
  is_substitute: boolean;
}

export interface GameDayAssignmentWithPlayer extends GameDayAssignment {
  player: {
    _id: Id<"profiles">;
    _creationTime: number;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    dup_rating?: number;
    role: string;
    active: boolean;
    auth_id: Id<"profiles">;
  } | null;
}

export interface GameDay {
  _id: Id<"game_days">;
  _creationTime: number;
  league_id: Id<"leagues">;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  is_finalized: boolean;
  start_datetime_utc: string;
  end_datetime_utc: string;
  updated_at?: string;
}

// Hooks for game day operations
export const usePlayers = (leagueId: Id<"leagues">) => {
  return useQuery(api.gameDayFunctions.getPlayers, { leagueId });
};

export const useMarkAttendance = () => {
  return useMutation(api.gameDayFunctions.markAttendance);
};

export const useCourtConfigurations = (leagueId: Id<"leagues">) => {
  return useQuery(api.gameDayFunctions.getCourtConfigurations, { leagueId });
};

export const useUpdateCourtSize = () => {
  return useMutation(api.gameDayFunctions.updateCourtSize);
};

export const useFinalizeGameDay = () => {
  return useMutation(api.gameDayFunctions.finalizeGameDay);
};

export const useGenerateCourtRotations = () => {
  return useMutation(api.gameDayFunctions.generateCourtRotations);
};

export const useCourtRotations = (leagueId: Id<"leagues">, gameDayId: Id<"game_days">, courtNumber: number) => {
  return useQuery(api.gameDayFunctions.getCourtRotations, { leagueId, gameDayId, courtNumber });
};

export const useSaveCourtAssignments = () => {
  return useMutation(api.gameDayFunctions.saveCourtAssignments);
};

export const useFetchCourtAssignments = (leagueId?: Id<"leagues">, gameDayId?: Id<"game_days">) => {
  return useQuery(api.gameDayFunctions.fetchCourtAssignments, { leagueId, gameDayId });
};

export const useAssignmentsForGameDay = (gameDayId: Id<"game_days">) => {
  return useQuery(api.gameDayFunctions.getAssignmentsForGameDay, { gameDayId });
};

export const useUpdateGameDayStatus = () => {
  return useMutation(api.gameDayFunctions.updateGameDayStatus);
};

export const useAssignmentsWithPlayers = (gameDayId: Id<"game_days">) => {
  return useQuery(api.gameDayFunctions.getAssignmentsWithPlayers, { gameDayId });
};

export const useGameDay = (gameDayId: Id<"game_days">) => {
  return useQuery(api.gameDayFunctions.getGameDay, { gameDayId });
};

export const useCreateGameDay = () => {
  return useMutation(api.gameDayFunctions.createGameDay);
};

export const useGameDays = (leagueId: Id<"leagues">) => {
  return useQuery(api.gameDayFunctions.getGameDays, { leagueId });
};

// Utility functions for non-React components
export const updateGameDayStatus = async (gameDayId: Id<"game_days">, status: string) => {
  // This would need to be called from a component that has access to useMutation
  // or you could create a separate utility that uses the Convex client directly
  console.log("updateGameDayStatus called with:", { gameDayId, status });
};

// Helper functions from the original gameDayService.ts
export function toUtcIsoString(localDate: string, localTime: string): string {
  const [year, month, day] = localDate.split('-').map(Number);
  const [hour, minute] = localTime.split(':').map(Number);
  const local = new Date(year, month - 1, day, hour, minute);
  return new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString();
}

export function utcToLocalDate(utcIso: string): string {
  const d = new Date(utcIso);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function utcToLocalTime(utcIso: string): string {
  const d = new Date(utcIso);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

export function generateGameDays(
  startDate: string,
  endDate: string,
  playDay: number,
  startTime: string,
  endTime: string
): { date: string, start_datetime_utc: string, end_datetime_utc: string }[] {
  const result: { date: string, start_datetime_utc: string, end_datetime_utc: string }[] = [];
  let current = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  // Find the first occurrence of playDay on or after startDate
  const dayDiff = (playDay - current.getDay() + 7) % 7;
  if (dayDiff > 0) current.setDate(current.getDate() + dayDiff);

  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    result.push({
      date: dateStr,
      start_datetime_utc: toUtcIsoString(dateStr, startTime),
      end_datetime_utc: toUtcIsoString(dateStr, endTime),
    });
    current.setDate(current.getDate() + 7);
  }
  return result;
}

export function normalizeLeagueFormForDB(form: any): any {
  return {
    ...form,
    start_date: toUtcIsoString(form.start_date, form.start_time),
    end_date: toUtcIsoString(form.end_date, form.end_time),
    start_time: toUtcIsoString(form.start_date, form.start_time),
    end_time: toUtcIsoString(form.end_date, form.end_time),
  };
}

export function normalizeLeagueFromDB(data: any): any {
  return {
    ...data,
    start_date: data.start_date ? utcToLocalDate(data.start_date) : '',
    end_date: data.end_date ? utcToLocalDate(data.end_date) : '',
    start_time: data.start_time ? utcToLocalTime(data.start_time) : '',
    end_time: data.end_time ? utcToLocalTime(data.end_time) : '',
  };
} 