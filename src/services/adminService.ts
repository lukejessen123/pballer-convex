import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Join request interface
export interface JoinRequest {
  _id: Id<"league_players">;
  _creationTime: number;
  player_id: Id<"profiles">;
  league_id: Id<"leagues">;
  status: string;
  invited_at?: number;
  player?: {
    _id: Id<"profiles">;
    first_name: string;
    last_name: string;
    email: string;
    dup_rating?: number;
  };
  league?: {
    _id: Id<"leagues">;
    name: string;
  };
}

// League interface for admin
export interface AdminLeague {
  _id: Id<"leagues">;
  _creationTime: number;
  name: string;
}

// Hooks for admin operations
export const useLeaguesByCreator = (creatorId: Id<"profiles">) => {
  return useQuery(api.adminFunctions.getLeaguesByCreator, { creatorId });
};

export const usePendingJoinRequests = (leagueIds: Id<"leagues">[]) => {
  return useQuery(api.adminFunctions.getPendingJoinRequests, { leagueIds });
};

export const useUpdateJoinRequestStatus = () => {
  return useMutation(api.adminFunctions.updateJoinRequestStatus);
};

export const useCreateAnnouncement = () => {
  return useMutation(api.adminFunctions.createAnnouncement);
}; 