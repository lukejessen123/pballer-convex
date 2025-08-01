import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// League interface
export interface League {
  _id: Id<"leagues">;
  _creationTime: number;
  name: string;
  description?: string;
  club_id: Id<"clubs">;
  created_by: Id<"profiles">;
  players: Id<"profiles">[];
  substitutes: Id<"profiles">[];
  start_date: string;
  end_date: string;
  allow_substitutes: boolean;
  total_players: number;
  dupr_min?: number;
  dupr_max?: number;
  match_type: string;
  play_day: number;
  start_time: string;
  end_time: string;
  gender_type: string;
  cost?: number;
  member_cost?: number;
  non_member_cost?: number;
  access_mode: string;
  courts: number;
  win_type: string;
  points_to_win: number;
  win_by_margin: number;
  games_per_match: number;
  players_per_court: number;
  games_per_rotation: number;
  location?: string;
  event_type: string;
  court_meta?: any;
  max_players?: number;
  finalized: boolean;
  updated_at?: string;
}

// Court configuration interface
export interface CourtConfiguration {
  _id: Id<"court_configurations">;
  _creationTime: number;
  league_id: Id<"leagues">;
  court_number: number;
  display_name: string;
  players_moving_up: number;
  players_moving_down: number;
  players_count: number;
}

// Court movement rule interface
export interface CourtMovementRule {
  courtNumber: number;
  displayName: string;
  moveUp: number;
  moveDown: number;
}

// League form data interface
export interface LeagueFormData {
  name: string;
  description: string;
  location: string;
  access_mode: string;
  match_type: string | null;
  play_day: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  gender_type: string | null;
  total_players: number;
  courts: number;
  cost: number;
  allow_substitutes: boolean;
  win_type: string;
  points_to_win: number;
  win_by_margin: number;
  games_per_match: number;
  games_per_rotation: number;
  players_per_court: number;
  court_movement_rules: CourtMovementRule[];
  club_id: string;
}

// Hooks for league operations
export const useLeague = (leagueId: Id<"leagues">) => {
  return useQuery(api.leagueFunctions.getLeague, { leagueId });
};

export const useCourtConfigurations = (leagueId: Id<"leagues">) => {
  return useQuery(api.leagueFunctions.getCourtConfigurations, { leagueId });
};

export const useCreateLeague = () => {
  return useMutation(api.leagueFunctions.createLeague);
};

export const useUpdateLeague = () => {
  return useMutation(api.leagueFunctions.updateLeague);
};

// Utility functions for data transformation
export function normalizeLeagueFromDB(data: League): Partial<LeagueFormData> {
  return {
    name: data.name,
    description: data.description || '',
    location: data.location || '',
    access_mode: data.access_mode,
    match_type: data.match_type,
    play_day: data.play_day.toString(),
    start_date: data.start_date,
    end_date: data.end_date,
    start_time: data.start_time,
    end_time: data.end_time,
    gender_type: data.gender_type,
    total_players: data.total_players,
    courts: data.courts,
    cost: data.cost || 0,
    allow_substitutes: data.allow_substitutes,
    win_type: data.win_type,
    points_to_win: data.points_to_win,
    win_by_margin: data.win_by_margin,
    games_per_match: data.games_per_match,
    games_per_rotation: data.games_per_rotation,
    players_per_court: data.players_per_court,
    club_id: data.club_id,
  };
}

export function normalizeLeagueFormForDB(data: Partial<LeagueFormData>): any {
  return {
    name: data.name,
    description: data.description,
    location: data.location,
    access_mode: data.access_mode,
    match_type: data.match_type,
    play_day: parseInt(data.play_day || '0', 10),
    start_date: data.start_date,
    end_date: data.end_date,
    start_time: data.start_time,
    end_time: data.end_time,
    gender_type: data.gender_type,
    total_players: data.total_players,
    courts: data.courts,
    cost: data.cost,
    allow_substitutes: data.allow_substitutes,
    win_type: data.win_type,
    points_to_win: data.points_to_win,
    win_by_margin: data.win_by_margin,
    games_per_match: data.games_per_match,
    games_per_rotation: data.games_per_rotation,
    players_per_court: data.players_per_court,
    club_id: data.club_id,
    event_type: 'league',
    finalized: false,
  };
} 