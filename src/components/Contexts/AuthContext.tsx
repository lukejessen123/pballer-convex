import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

// Convex-compatible user interface
interface ConvexUser {
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
  stripe_customer_id?: string;
  stripe_account_id?: string;
}

interface AuthContextType {
  user: ConvexUser | null;
  profile: ConvexUser | null; // Canonical profile object
  profileId: Id<"profiles"> | null; // Canonical profile ID (source of truth)
  signIn: (email: string, password: string) => Promise<{ error: any; data: any }>;
  signUp: (email: string, password: string, emailRedirectTo?: string) => Promise<{ error: any; data: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean | null;
  isLeagueCreator: boolean | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [isLeagueCreator, setIsLeagueCreator] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<ConvexUser | null>(null);
  const [profileId, setProfileId] = useState<Id<"profiles"> | null>(null);

  // For now, we'll use a placeholder user ID - in production, this would come from your auth system
  const [currentUserId, setCurrentUserId] = useState<Id<"profiles"> | null>(null);

  // Convex queries and mutations
  const userProfile = useQuery(api.authFunctions.getUserProfile, 
    currentUserId ? { userId: currentUserId } : 'skip'
  );
  
  const superAdminStatus = useQuery(api.authFunctions.getSuperAdminStatus,
    currentUserId ? { userId: currentUserId } : 'skip'
  );

  const signInMutation = useMutation(api.authFunctions.signIn);
  const signUpMutation = useMutation(api.authFunctions.signUp);
  const signOutMutation = useMutation(api.authFunctions.signOut);

  // Update profile when user data changes
  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
      setProfileId(userProfile._id);
      setLoading(false);
    }
  }, [userProfile]);

  // Update admin status when profile or super admin status changes
  useEffect(() => {
    if (profile) {
      const isAdminUser = 
        profile.role === 'club_admin' ||
        profile.role === 'league_creator' ||
        superAdminStatus === true;
      
      setIsAdmin(isAdminUser);
      setIsSuperAdmin(superAdminStatus);
      setIsLeagueCreator(profile.role === 'league_creator');
    } else {
      setIsAdmin(false);
      setIsSuperAdmin(null);
      setIsLeagueCreator(null);
    }
  }, [profile, superAdminStatus]);

  // Initialize auth state (placeholder - replace with your auth system)
  useEffect(() => {
    // This is a placeholder - in production, you would:
    // 1. Check for existing auth token/session
    // 2. Validate the token with your auth system
    // 3. Set the currentUserId based on the validated session
    
    // For now, we'll simulate a loading state
    const timer = setTimeout(() => {
      setLoading(false);
      // In production, you would set currentUserId here based on auth state
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInMutation({ email, password });
      if (result.success) {
        setCurrentUserId(result.userId);
        return { data: result, error: null };
      } else {
        return { data: null, error: result.error };
      }
    } catch (error) {
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, emailRedirectTo?: string) => {
    try {
      const result = await signUpMutation({ 
        email, 
        password, 
        emailRedirectTo: emailRedirectTo || undefined 
      });
      if (result.success) {
        return { data: result, error: null };
      } else {
        return { data: null, error: result.error };
      }
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      await signOutMutation();
      setCurrentUserId(null);
      setProfile(null);
      setProfileId(null);
      setIsAdmin(false);
      setIsSuperAdmin(null);
      setIsLeagueCreator(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user: profile, // For backward compatibility
    profile, // Canonical profile object
    profileId, // Canonical profile ID (source of truth for all app logic)
    signIn,
    signUp,
    signOut,
    loading,
    isAdmin,
    isSuperAdmin,
    isLeagueCreator,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};