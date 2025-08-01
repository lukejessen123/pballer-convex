import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Standing interfaces
export interface Standing {
  _id: Id<"standings">;
  _creationTime: number;
  league_id: Id<"leagues">;
  player_id: Id<"profiles">;
  total_points: number;
  games_won: number;
  win_pct: number;
  points_per_game: number;
  court_number: number;
  movement: string;
  game_day_id?: Id<"game_days">;
  is_substitute: boolean;
  substitute_name?: string;
  games_played: number;
  court_rank: number;
  move_up: number;
  move_down: number;
  display_name: string;
}

export interface StandingWithPlayer extends Standing {
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

export interface CourtAssignment {
  court_number: number;
  players: {
    id: string;
    name: string;
    role: string;
    dup_rating: number;
  }[];
}

// Hooks for standings operations
export const useStandings = (leagueId: Id<"leagues">) => {
  return useQuery(api.standingsQueries.getStandings, { leagueId });
};

export const useStandingsWithPlayers = (leagueId: Id<"leagues">) => {
  return useQuery(api.standingsQueries.getStandingsWithPlayers, { leagueId });
};

export const useCourtAssignments = (leagueId: Id<"leagues">) => {
  return useQuery(api.standingsQueries.getCourtAssignments, { leagueId });
};

export const useMarkPlayerAbsent = () => {
  return useMutation(api.standingsQueries.markPlayerAbsent);
};

export const useUpdateCourtSize = () => {
  return useMutation(api.standingsQueries.updateCourtSize);
};

export const useRefreshCourtAssignments = () => {
  return useMutation(api.standingsQueries.refreshCourtAssignments);
};

export const useFinalizeGameDay = () => {
  return useMutation(api.standingsQueries.finalizeGameDay);
};

// Utility functions for sorting and filtering standings
export const sortStandingsByCourtAndPoints = (standings: Standing[]) => {
  return standings.sort((a, b) => {
    // First sort by court number
    if (a.court_number !== b.court_number) {
      return a.court_number - b.court_number;
    }
    // Then sort by total points (descending)
    return b.total_points - a.total_points;
  });
};

export const filterStandingsByCourt = (standings: Standing[], courtNumber: number) => {
  return standings.filter(standing => standing.court_number === courtNumber);
};

export const calculateLeagueStats = (standings: Standing[]) => {
  const totalPlayers = standings.length;
  const totalGames = standings.reduce((sum, standing) => sum + standing.games_played, 0);
  const averagePoints = standings.reduce((sum, standing) => sum + standing.total_points, 0) / totalPlayers;
  
  return {
    totalPlayers,
    totalGames,
    averagePoints: Math.round(averagePoints * 100) / 100,
  };
};

// Additional utility functions
export const sortStandingsByRank = (standings: Standing[]): Standing[] => {
  return [...standings].sort((a, b) => a.court_rank - b.court_rank);
};

export const getTopPlayers = (standings: Standing[], count: number = 10): Standing[] => {
  return sortStandingsByRank(standings).slice(0, count);
}; 