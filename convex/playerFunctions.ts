import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getProfileByEmail = query({
  args: {
    email: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("profiles"),
      email: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .take(1);
    
    return profiles.length > 0 ? profiles[0] : null;
  },
});

export const createProfile = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    dupRating: v.optional(v.number()),
    role: v.string(),
  },
  returns: v.id("profiles"),
  handler: async (ctx, args) => {
    // Create profile with a temporary auth_id (we'll update it)
    const profileId = await ctx.db.insert("profiles", {
      first_name: args.firstName,
      last_name: args.lastName,
      email: args.email,
      phone: args.phone,
      dup_rating: args.dupRating,
      role: args.role,
      active: true,
      auth_id: "temp" as any, // Temporary value
    });

    // Update with the correct auth_id (self-reference)
    await ctx.db.patch(profileId, {
      auth_id: profileId,
    });

    return profileId;
  },
});

export const addPlayerToLeague = mutation({
  args: {
    leagueId: v.id("leagues"),
    playerId: v.id("profiles"),
    status: v.string(),
  },
  returns: v.id("league_players"),
  handler: async (ctx, args) => {
    // Check if player is already in the league
    const existing = await ctx.db
      .query("league_players")
      .withIndex("by_league", (q) => q.eq("league_id", args.leagueId))
      .filter((q) => q.eq(q.field("player_id"), args.playerId))
      .take(1);
    
    if (existing.length > 0) {
      // Update existing record
      await ctx.db.patch(existing[0]._id, {
        status: args.status,
      });
      return existing[0]._id;
    } else {
      // Create new record
      return await ctx.db.insert("league_players", {
        league_id: args.leagueId,
        player_id: args.playerId,
        status: args.status,
      });
    }
  },
});

export const invitePlayerToLeague = mutation({
  args: {
    leagueId: v.id("leagues"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    dupRating: v.optional(v.number()),
  },
  returns: v.object({
    playerId: v.id("profiles"),
    leaguePlayerId: v.id("league_players"),
    isNewPlayer: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Check if profile with this email already exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .take(1);
    
    let playerId: Id<"profiles">;
    let isNewPlayer = false;
    
    if (existingProfile.length > 0) {
      // Player already exists
      playerId = existingProfile[0]._id;
    } else {
      // Create new profile with self-referencing auth_id
      playerId = await ctx.db.insert("profiles", {
        first_name: args.firstName,
        last_name: args.lastName,
        email: args.email,
        phone: args.phone,
        dup_rating: args.dupRating,
        role: 'player',
        active: true,
        auth_id: "temp" as any, // Temporary value
      });

      // Update with the correct auth_id (self-reference)
      await ctx.db.patch(playerId, {
        auth_id: playerId,
      });
      
      isNewPlayer = true;
    }

    // Add player to league
    const leaguePlayerId = await ctx.db.insert("league_players", {
      league_id: args.leagueId,
      player_id: playerId,
      status: 'not_invited',
    });

    return {
      playerId,
      leaguePlayerId,
      isNewPlayer,
    };
  },
}); 

// Query to get invite by token
export const getInviteByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const invite = await ctx.db
      .query("league_players")
      .filter((q) => q.eq(q.field("invite_token"), token))
      .first();
    
    return invite;
  },
});

// Mutation to accept an invite
export const acceptInvite = mutation({
  args: { 
    token: v.string(),
    leagueId: v.id("leagues"),
    playerId: v.id("profiles")
  },
  handler: async (ctx, { token, leagueId, playerId }) => {
    // Find the invite by token
    const invite = await ctx.db
      .query("league_players")
      .filter((q) => q.eq(q.field("invite_token"), token))
      .first();
    
    if (!invite) {
      throw new Error("Invite not found");
    }
    
    // Update the invite to accepted status
    await ctx.db.patch(invite._id, {
      status: "accepted",
      joined_at: Date.now(),
      player_id: playerId,
    });
  },
}); 