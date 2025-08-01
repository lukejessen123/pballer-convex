import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Player interface
export interface Player {
  id: string;
  first_name: string;
  last_name: string;
  dup_rating?: number;
}

// Court rotation interface
export interface CourtRotation {
  _id: Id<"court_rotations">;
  _creationTime: number;
  league_id: Id<"leagues">;
  game_day_id: Id<"game_days">;
  court_number: number;
  start_time: string;
  end_time: string;
  team1_player1_id?: Id<"profiles">;
  team1_player2_id?: Id<"profiles">;
  team2_player1_id?: Id<"profiles">;
  team2_player2_id?: Id<"profiles">;
  game_number: number;
  rotation_number: number;
  team1_score?: number;
  team2_score?: number;
}

// Court rotation with player details interface
export interface CourtRotationWithPlayers extends CourtRotation {
  team1_player1?: Player;
  team1_player2?: Player;
  team2_player1?: Player;
  team2_player2?: Player;
}

// Court assignment interface
export interface CourtAssignment {
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
  player?: Player;
}

// Hooks for court rotations
export const useCourtRotations = (
  leagueId: Id<"leagues">,
  gameDayId: Id<"game_days">,
  courtNumber: number
) => {
  return useQuery(api.playFunctions.getCourtRotations, {
    leagueId,
    gameDayId,
    courtNumber,
  });
};

export const useCourtRotationsWithPlayers = (
  leagueId: Id<"leagues">,
  gameDayId: Id<"game_days">,
  courtNumber: number
) => {
  return useQuery(api.playFunctions.getCourtRotationsWithPlayers, {
    leagueId,
    gameDayId,
    courtNumber,
  });
};

export const useCurrentRotation = (
  leagueId: Id<"leagues">,
  gameDayId: Id<"game_days">,
  courtNumber: number
) => {
  return useQuery(api.playFunctions.getCurrentRotation, {
    leagueId,
    gameDayId,
    courtNumber,
  });
};

// Hooks for scoring
export const useUpdateRotationScores = () => {
  return useMutation(api.playFunctions.updateRotationScores);
};

// Hooks for court assignments
export const useCourtAssignments = (
  leagueId: Id<"leagues">,
  gameDayId: Id<"game_days">,
  courtNumber: number
) => {
  return useQuery(api.playFunctions.getCourtAssignments, {
    leagueId,
    gameDayId,
    courtNumber,
  });
};

// Hooks for substitutes
export const useAvailableSubstitutes = (leagueId: Id<"leagues">) => {
  return useQuery(api.playFunctions.getAvailableSubstitutes, { leagueId });
};

export const useAddSubstituteToCourt = () => {
  return useMutation(api.playFunctions.addSubstituteToCourt);
};

// Hooks for rotation management
export const useStartCourtRotation = () => {
  return useMutation(api.playFunctions.startCourtRotation);
};

export const useEndCourtRotation = () => {
  return useMutation(api.playFunctions.endCourtRotation);
};

// Utility functions for play functionality
export const formatPlayerName = (player: Player): string => {
  return `${player.first_name} ${player.last_name}`;
};

export const getTeamPlayers = (
  rotation: CourtRotationWithPlayers
): {
  team1: [Player, Player] | null;
  team2: [Player, Player] | null;
} => {
  const team1: [Player, Player] | null =
    rotation.team1_player1 && rotation.team1_player2
      ? [
          {
            id: rotation.team1_player1._id,
            first_name: rotation.team1_player1.first_name,
            last_name: rotation.team1_player1.last_name,
            dup_rating: rotation.team1_player1.dup_rating,
          },
          {
            id: rotation.team1_player2._id,
            first_name: rotation.team1_player2.first_name,
            last_name: rotation.team1_player2.last_name,
            dup_rating: rotation.team1_player2.dup_rating,
          },
        ]
      : null;

  const team2: [Player, Player] | null =
    rotation.team2_player1 && rotation.team2_player2
      ? [
          {
            id: rotation.team2_player1._id,
            first_name: rotation.team2_player1.first_name,
            last_name: rotation.team2_player1.last_name,
            dup_rating: rotation.team2_player1.dup_rating,
          },
          {
            id: rotation.team2_player2._id,
            first_name: rotation.team2_player2.first_name,
            last_name: rotation.team2_player2.last_name,
            dup_rating: rotation.team2_player2.dup_rating,
          },
        ]
      : null;

  return { team1, team2 };
};

export const isRotationActive = (rotation: CourtRotation): boolean => {
  return rotation.start_time !== "" && rotation.end_time === "";
};

export const isRotationCompleted = (rotation: CourtRotation): boolean => {
  return rotation.start_time !== "" && rotation.end_time !== "";
};

export const getRotationStatus = (rotation: CourtRotation): "pending" | "active" | "completed" => {
  if (isRotationActive(rotation)) return "active";
  if (isRotationCompleted(rotation)) return "completed";
  return "pending";
};

export const formatTime = (timeString: string): string => {
  if (!timeString) return "";
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return timeString;
  }
};

export const getCurrentTimeString = (): string => {
  return new Date().toISOString();
}; 