import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface LeagueSettings {
  win_type: string;
  points_to_win: number;
  win_by_margin: number;
  games_per_match: number;
  players_per_court: number;
  games_per_rotation: number;
}

export function useLeagueSettings(leagueId: string | Id<"leagues">) {
  // Use the existing Convex league query
  const league = useQuery(api.leagueFunctions.getLeague, { 
    leagueId: leagueId as Id<"leagues"> 
  });

  // Transform the league data to match the expected LeagueSettings interface
  const settings: LeagueSettings | null = league ? {
    win_type: league.win_type,
    points_to_win: league.points_to_win,
    win_by_margin: league.win_by_margin,
    games_per_match: league.games_per_match,
    players_per_court: league.players_per_court,
    games_per_rotation: league.games_per_rotation,
  } : null;

  return { 
    settings, 
    isLoading: league === undefined, 
    error: league === null ? new Error('League not found') : null 
  };
}