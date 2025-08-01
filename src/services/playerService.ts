import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Player invitation interface
export interface InviteFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dupRating?: number;
}

// Hooks for player operations
export const useGetProfileByEmail = (email: string) => {
  return useQuery(api.playerFunctions.getProfileByEmail, { email });
};

export const useCreateProfile = () => {
  return useMutation(api.playerFunctions.createProfile);
};

export const useAddPlayerToLeague = () => {
  return useMutation(api.playerFunctions.addPlayerToLeague);
};

export const useInvitePlayerToLeague = () => {
  return useMutation(api.playerFunctions.invitePlayerToLeague);
}; 