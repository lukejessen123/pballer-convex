import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// Example functions for your pickleball app

// Get all clubs
export const listClubs = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("clubs"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      location: v.optional(v.string()),
      created_by: v.id("profiles"),
      admins: v.array(v.id("profiles")),
    })
  ),
  handler: async (ctx, args) => {
    const clubs = await ctx.db
      .query("clubs")
      .order("desc")
      .collect();
    return clubs;
  },
});

// Get leagues for a specific club
export const getLeaguesByClub = query({
  args: {
    clubId: v.id("clubs"),
  },
  returns: v.array(
    v.object({
      _id: v.id("leagues"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      start_date: v.string(),
      end_date: v.string(),
      match_type: v.string(),
      courts: v.number(),
      finalized: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const leagues = await ctx.db
      .query("leagues")
      .withIndex("by_club", (q) => q.eq("club_id", args.clubId))
      .order("desc")
      .collect();
    return leagues;
  },
});

// Get players for a specific league
export const getLeaguePlayers = query({
  args: {
    leagueId: v.id("leagues"),
  },
  returns: v.array(
    v.object({
      _id: v.id("league_players"),
      _creationTime: v.number(),
      player_id: v.id("profiles"),
      status: v.string(),
      joined_at: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("league_players")
      .withIndex("by_league", (q) => q.eq("league_id", args.leagueId))
      .order("desc")
      .collect();
    return players;
  },
});

// Create a new club
export const createClub = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    created_by: v.id("profiles"),
    admins: v.array(v.id("profiles")),
  },
  returns: v.id("clubs"),
  handler: async (ctx, args) => {
    const clubId = await ctx.db.insert("clubs", {
      name: args.name,
      description: args.description,
      location: args.location,
      created_by: args.created_by,
      admins: args.admins,
      updated_at: new Date().toISOString(),
    });
    return clubId;
  },
});

// Create a new league
export const createLeague = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    club_id: v.id("clubs"),
    created_by: v.id("profiles"),
    start_date: v.string(),
    end_date: v.string(),
    match_type: v.string(),
    courts: v.number(),
    players_per_court: v.number(),
    games_per_match: v.number(),
    points_to_win: v.number(),
    win_by_margin: v.number(),
    start_time: v.string(),
    end_time: v.string(),
    gender_type: v.string(),
    access_mode: v.string(),
    win_type: v.string(),
    games_per_rotation: v.number(),
    event_type: v.string(),
    finalized: v.boolean(),
  },
  returns: v.id("leagues"),
  handler: async (ctx, args) => {
    const leagueId = await ctx.db.insert("leagues", {
      name: args.name,
      description: args.description,
      club_id: args.club_id,
      created_by: args.created_by,
      players: [],
      substitutes: [],
      start_date: args.start_date,
      end_date: args.end_date,
      allow_substitutes: false,
      total_players: 0,
      match_type: args.match_type,
      play_day: 1,
      start_time: args.start_time,
      end_time: args.end_time,
      gender_type: args.gender_type,
      access_mode: args.access_mode,
      courts: args.courts,
      win_type: args.win_type,
      points_to_win: args.points_to_win,
      win_by_margin: args.win_by_margin,
      games_per_match: args.games_per_match,
      players_per_court: args.players_per_court,
      games_per_rotation: args.games_per_rotation,
      event_type: args.event_type,
      finalized: args.finalized,
      updated_at: new Date().toISOString(),
    });
    return leagueId;
  },
});

// Add a player to a league (finds or creates player profile first)
export const addPlayerToLeague = mutation({
  args: {
    leagueId: v.id("leagues"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    dupRating: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    player: v.object({
      _id: v.id("profiles"),
      _creationTime: v.number(),
      email: v.string(),
      first_name: v.string(),
      last_name: v.string(),
      phone: v.optional(v.string()),
      dup_rating: v.optional(v.number()),
      role: v.string(),
      active: v.boolean(),
      auth_id: v.id("profiles"),
    }),
  }),
  handler: async (ctx, args) => {
    // 1. Find or create player in profiles
    let player = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!player) {
      // Create new player profile
      const playerId = await ctx.db.insert("profiles", {
        first_name: args.firstName,
        last_name: args.lastName,
        email: args.email,
        phone: args.phone,
        dup_rating: args.dupRating,
        role: "player",
        active: true,
        auth_id: "temp" as any, // This will be updated when user authenticates
      });
      
      player = await ctx.db.get(playerId);
      if (!player) {
        throw new Error("Failed to create player profile");
      }
    }

    // 2. Add to league_players
    await ctx.db.insert("league_players", {
      league_id: args.leagueId,
      player_id: player._id,
      status: "active",
      joined_at: Date.now(),
    });

    return {
      success: true,
      player,
    };
  },
});

// Get game days for a league
export const getGameDays = query({
  args: {
    leagueId: v.id("leagues"),
  },
  returns: v.array(
    v.object({
      _id: v.id("game_days"),
      _creationTime: v.number(),
      date: v.string(),
      start_time: v.string(),
      end_time: v.string(),
      status: v.string(),
      is_finalized: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const gameDays = await ctx.db
      .query("game_days")
      .withIndex("by_league", (q) => q.eq("league_id", args.leagueId))
      .order("desc")
      .collect();
    return gameDays;
  },
});

// Create a game day
export const createGameDay = mutation({
  args: {
    league_id: v.id("leagues"),
    date: v.string(),
    start_time: v.string(),
    end_time: v.string(),
    status: v.string(),
    is_finalized: v.boolean(),
    start_datetime_utc: v.string(),
    end_datetime_utc: v.string(),
  },
  returns: v.id("game_days"),
  handler: async (ctx, args) => {
    const gameDayId = await ctx.db.insert("game_days", {
      league_id: args.league_id,
      date: args.date,
      start_time: args.start_time,
      end_time: args.end_time,
      status: args.status,
      is_finalized: args.is_finalized,
      start_datetime_utc: args.start_datetime_utc,
      end_datetime_utc: args.end_datetime_utc,
      updated_at: new Date().toISOString(),
    });
    return gameDayId;
  },
});

// Example action for external API calls
export const exampleAction = action({
  args: {
    message: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Example of calling external APIs
    console.log("Action called with message:", args.message);
    
    // You could make HTTP requests here
    // const response = await ctx.fetch("https://api.example.com");
    
    return `Processed: ${args.message}`;
  },
});
