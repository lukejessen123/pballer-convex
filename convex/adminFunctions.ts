import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Query to get all users (for super admins)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("profiles").collect();
    return users.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// Query to get leagues for admin (filtered by user role)
export const getLeaguesForAdmin = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return [];

    // If super admin, get all leagues
    if (user.role === 'super_admin') {
      const leagues = await ctx.db.query("leagues").collect();
      return leagues.map(league => ({
        ...league,
        creator: null, // Will be populated in a separate query if needed
      }));
    }

    // If league creator, get only their leagues
    if (user.role === 'league_creator') {
      const leagues = await ctx.db
        .query("leagues")
        .filter((q) => q.eq(q.field("created_by"), userId))
        .collect();
      return leagues.map(league => ({
        ...league,
        creator: user,
      }));
    }

    return [];
  },
});

// Query to get announcements for admin (filtered by user role)
export const getAnnouncementsForAdmin = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return [];

    // If super admin, get all announcements
    if (user.role === 'super_admin') {
      const announcements = await ctx.db.query("announcements").collect();
      return announcements.sort((a, b) => b._creationTime - a._creationTime);
    }

    // If league creator, get announcements for their leagues
    if (user.role === 'league_creator') {
      const userLeagues = await ctx.db
        .query("leagues")
        .filter((q) => q.eq(q.field("created_by"), userId))
        .collect();
      
      const leagueIds = userLeagues.map(league => league._id);
      // Since we can't use inArray, we'll query each league separately
      const allAnnouncements = [];
      for (const leagueId of leagueIds) {
        const announcements = await ctx.db
          .query("announcements")
          .filter((q) => q.eq(q.field("league_id"), leagueId))
          .collect();
        allAnnouncements.push(...announcements);
      }
      
      return allAnnouncements.sort((a, b) => b._creationTime - a._creationTime);
    }

    return [];
  },
});

// Query to get pending join count for admin
export const getPendingJoinCount = query({
  args: { userId: v.id("profiles") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return 0;

    // If super admin, get count for all leagues
    if (user.role === 'super_admin') {
      const pendingRequests = await ctx.db
        .query("league_players")
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();
      return pendingRequests.length;
    }

    // If league creator, get count for their leagues
    if (user.role === 'league_creator') {
      const userLeagues = await ctx.db
        .query("leagues")
        .filter((q) => q.eq(q.field("created_by"), userId))
        .collect();
      
      const leagueIds = userLeagues.map(league => league._id);
      // Since we can't use inArray, we'll query each league separately
      let totalPending = 0;
      for (const leagueId of leagueIds) {
        const pendingRequests = await ctx.db
          .query("league_players")
          .filter((q) => 
            q.and(
              q.eq(q.field("status"), "pending"),
              q.eq(q.field("league_id"), leagueId)
            )
          )
          .collect();
        totalPending += pendingRequests.length;
      }
      
      return totalPending;
    }

    return 0;
  },
});

// Mutation to update user role
export const updateUserRole = mutation({
  args: { 
    userId: v.id("profiles"),
    role: v.string()
  },
  handler: async (ctx, { userId, role }) => {
    await ctx.db.patch(userId, { role });
  },
});

// Mutation to update user active status
export const updateUserActive = mutation({
  args: { 
    userId: v.id("profiles"),
    active: v.boolean()
  },
  handler: async (ctx, { userId, active }) => {
    await ctx.db.patch(userId, { active });
  },
});

// Mutation to delete user
export const deleteUser = mutation({
  args: { 
    userId: v.id("profiles")
  },
  handler: async (ctx, { userId }) => {
    // Delete user's profile
    await ctx.db.delete(userId);
    
    // Note: In production, you would also need to:
    // 1. Delete user from auth system
    // 2. Clean up related data (leagues, announcements, etc.)
    // 3. Handle cascading deletes
  },
});

// Mutation to create announcement
export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    leagueId: v.optional(v.id("leagues")),
    targetRole: v.optional(v.string()),
    isGlobal: v.boolean(),
    pinned: v.boolean(),
    expiresAt: v.optional(v.string()),
  },
  handler: async (ctx, { title, message, leagueId, targetRole, isGlobal, pinned, expiresAt }) => {
    // Note: In production, you would get the current user's ID from auth context
    const currentUserId = "placeholder_user_id" as Id<"profiles">;
    
    await ctx.db.insert("announcements", {
      title,
      message,
      created_by: currentUserId,
      league_id: leagueId,
      target_role: targetRole || "all",
      is_global: isGlobal,
      pinned,
      expires_at: expiresAt ? new Date(expiresAt).getTime() : undefined,
    });
  },
});

// Mutation to update announcement
export const updateAnnouncement = mutation({
  args: {
    announcementId: v.id("announcements"),
    title: v.string(),
    message: v.string(),
    leagueId: v.optional(v.id("leagues")),
    targetRole: v.optional(v.string()),
    isGlobal: v.boolean(),
    pinned: v.boolean(),
    expiresAt: v.optional(v.string()),
  },
  handler: async (ctx, { announcementId, title, message, leagueId, targetRole, isGlobal, pinned, expiresAt }) => {
    await ctx.db.patch(announcementId, {
      title,
      message,
      league_id: leagueId,
      target_role: targetRole || "all",
      is_global: isGlobal,
      pinned,
      expires_at: expiresAt ? new Date(expiresAt).getTime() : undefined,
    });
  },
});

// Mutation to delete announcement
export const deleteAnnouncement = mutation({
  args: {
    announcementId: v.id("announcements")
  },
  handler: async (ctx, { announcementId }) => {
    await ctx.db.delete(announcementId);
  },
}); 