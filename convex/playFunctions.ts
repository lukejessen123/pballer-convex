import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get court rotations for a specific court on a game day
export const getCourtRotations = query({
  args: {
    leagueId: v.id("leagues"),
    gameDayId: v.id("game_days"),
    courtNumber: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id("court_rotations"),
      _creationTime: v.number(),
      league_id: v.id("leagues"),
      game_day_id: v.id("game_days"),
      court_number: v.number(),
      start_time: v.string(),
      end_time: v.string(),
      team1_player1_id: v.optional(v.id("profiles")),
      team1_player2_id: v.optional(v.id("profiles")),
      team2_player1_id: v.optional(v.id("profiles")),
      team2_player2_id: v.optional(v.id("profiles")),
      game_number: v.number(),
      rotation_number: v.number(),
      team1_score: v.optional(v.number()),
      team2_score: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const rotations = await ctx.db
      .query("court_rotations")
      .withIndex("by_game_day_and_court", (q) =>
        q.eq("game_day_id", args.gameDayId).eq("court_number", args.courtNumber)
      )
      .order("asc")
      .collect();

    return rotations;
  },
});

// Get court rotations with player details
export const getCourtRotationsWithPlayers = query({
  args: {
    leagueId: v.id("leagues"),
    gameDayId: v.id("game_days"),
    courtNumber: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id("court_rotations"),
      _creationTime: v.number(),
      league_id: v.id("leagues"),
      game_day_id: v.id("game_days"),
      court_number: v.number(),
      start_time: v.string(),
      end_time: v.string(),
      team1_player1_id: v.optional(v.id("profiles")),
      team1_player2_id: v.optional(v.id("profiles")),
      team2_player1_id: v.optional(v.id("profiles")),
      team2_player2_id: v.optional(v.id("profiles")),
      game_number: v.number(),
      rotation_number: v.number(),
      team1_score: v.optional(v.number()),
      team2_score: v.optional(v.number()),
      team1_player1: v.optional(
        v.object({
          _id: v.id("profiles"),
          _creationTime: v.number(),
          email: v.string(),
          first_name: v.string(),
          last_name: v.string(),
          avatar_url: v.optional(v.string()),
          dup_rating: v.optional(v.number()),
          role: v.string(),
          active: v.boolean(),
          auth_id: v.id("profiles"),
        })
      ),
      team1_player2: v.optional(
        v.object({
          _id: v.id("profiles"),
          _creationTime: v.number(),
          email: v.string(),
          first_name: v.string(),
          last_name: v.string(),
          avatar_url: v.optional(v.string()),
          dup_rating: v.optional(v.number()),
          role: v.string(),
          active: v.boolean(),
          auth_id: v.id("profiles"),
        })
      ),
      team2_player1: v.optional(
        v.object({
          _id: v.id("profiles"),
          _creationTime: v.number(),
          email: v.string(),
          first_name: v.string(),
          last_name: v.string(),
          avatar_url: v.optional(v.string()),
          dup_rating: v.optional(v.number()),
          role: v.string(),
          active: v.boolean(),
          auth_id: v.id("profiles"),
        })
      ),
      team2_player2: v.optional(
        v.object({
          _id: v.id("profiles"),
          _creationTime: v.number(),
          email: v.string(),
          first_name: v.string(),
          last_name: v.string(),
          avatar_url: v.optional(v.string()),
          dup_rating: v.optional(v.number()),
          role: v.string(),
          active: v.boolean(),
          auth_id: v.id("profiles"),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const rotations = await ctx.db
      .query("court_rotations")
      .withIndex("by_game_day_and_court", (q) =>
        q.eq("game_day_id", args.gameDayId).eq("court_number", args.courtNumber)
      )
      .order("asc")
      .collect();

    const rotationsWithPlayers = await Promise.all(
      rotations.map(async (rotation) => {
        const team1_player1 = rotation.team1_player1_id
          ? await ctx.db.get(rotation.team1_player1_id)
          : undefined;
        const team1_player2 = rotation.team1_player2_id
          ? await ctx.db.get(rotation.team1_player2_id)
          : undefined;
        const team2_player1 = rotation.team2_player1_id
          ? await ctx.db.get(rotation.team2_player1_id)
          : undefined;
        const team2_player2 = rotation.team2_player2_id
          ? await ctx.db.get(rotation.team2_player2_id)
          : undefined;

        return {
          ...rotation,
          team1_player1: team1_player1 || undefined,
          team1_player2: team1_player2 || undefined,
          team2_player1: team2_player1 || undefined,
          team2_player2: team2_player2 || undefined,
        };
      })
    );

    return rotationsWithPlayers;
  },
});

// Update scores for a court rotation
export const updateRotationScores = mutation({
  args: {
    rotationId: v.id("court_rotations"),
    team1Score: v.number(),
    team2Score: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.rotationId, {
      team1_score: args.team1Score,
      team2_score: args.team2Score,
    });
    return null;
  },
});

// Get available substitutes for a league
export const getAvailableSubstitutes = query({
  args: {
    leagueId: v.id("leagues"),
  },
  returns: v.array(
    v.object({
      _id: v.id("profiles"),
      _creationTime: v.number(),
      email: v.string(),
      first_name: v.string(),
      last_name: v.string(),
      avatar_url: v.optional(v.string()),
      dup_rating: v.optional(v.number()),
      role: v.string(),
      active: v.boolean(),
      auth_id: v.id("profiles"),
    })
  ),
  handler: async (ctx, args) => {
    const league = await ctx.db.get(args.leagueId);
    if (!league) {
      throw new Error("League not found");
    }

    // Handle case where substitutes array might be empty or undefined
    if (!league.substitutes || league.substitutes.length === 0) {
      return [];
    }

    const substitutes = await Promise.all(
      league.substitutes.map(async (substituteId) => {
        const substitute = await ctx.db.get(substituteId);
        if (!substitute) {
          console.warn(`Substitute ${substituteId} not found`);
          return null;
        }
        return substitute;
      })
    );

    // Filter out null values (substitutes that weren't found)
    return substitutes.filter((substitute): substitute is NonNullable<typeof substitute> => substitute !== null);
  },
});

// Add a substitute to a court assignment
export const addSubstituteToCourt = mutation({
  args: {
    leagueId: v.id("leagues"),
    gameDayId: v.id("game_days"),
    courtNumber: v.number(),
    slotNumber: v.number(),
    substituteName: v.string(),
    regularPlayerId: v.id("profiles"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Find the existing court assignment
    const existingAssignment = await ctx.db
      .query("court_assignments")
      .withIndex("by_game_day_and_court", (q) =>
        q.eq("game_day_id", args.gameDayId).eq("court_number", args.courtNumber)
      )
      .filter((q) => q.eq(q.field("slot_number"), args.slotNumber))
      .unique();

    if (existingAssignment) {
      // Update the existing assignment
      await ctx.db.patch(existingAssignment._id, {
        substitute_name: args.substituteName,
        regular_player_id: args.regularPlayerId,
        is_substitute: true,
      });
    } else {
      // Create a new assignment
      await ctx.db.insert("court_assignments", {
        league_id: args.leagueId,
        game_day_id: args.gameDayId,
        court_number: args.courtNumber,
        player_id: args.regularPlayerId, // This will be the regular player's ID
        slot_number: args.slotNumber,
        substitute_name: args.substituteName,
        regular_player_id: args.regularPlayerId,
        is_substitute: true,
      });
    }

    return null;
  },
});

// Get court assignments for a specific court on a game day
export const getCourtAssignments = query({
  args: {
    leagueId: v.id("leagues"),
    gameDayId: v.id("game_days"),
    courtNumber: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id("court_assignments"),
      _creationTime: v.number(),
      league_id: v.id("leagues"),
      game_day_id: v.id("game_days"),
      court_number: v.number(),
      player_id: v.id("profiles"),
      slot_number: v.number(),
      substitute_name: v.optional(v.string()),
      regular_player_id: v.optional(v.id("profiles")),
      is_substitute: v.boolean(),
      player: v.optional(
        v.object({
          _id: v.id("profiles"),
          _creationTime: v.number(),
          email: v.string(),
          first_name: v.string(),
          last_name: v.string(),
          avatar_url: v.optional(v.string()),
          dup_rating: v.optional(v.number()),
          role: v.string(),
          active: v.boolean(),
          auth_id: v.id("profiles"),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("court_assignments")
      .withIndex("by_game_day_and_court", (q) =>
        q.eq("game_day_id", args.gameDayId).eq("court_number", args.courtNumber)
      )
      .order("asc")
      .collect();

    const assignmentsWithPlayers = await Promise.all(
      assignments.map(async (assignment) => {
        const player = await ctx.db.get(assignment.player_id);
        return {
          ...assignment,
          player: player || undefined,
        };
      })
    );

    return assignmentsWithPlayers;
  },
});

// Start a court rotation (mark as active)
export const startCourtRotation = mutation({
  args: {
    rotationId: v.id("court_rotations"),
    startTime: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.rotationId, {
      start_time: args.startTime,
    });
    return null;
  },
});

// End a court rotation (mark as completed)
export const endCourtRotation = mutation({
  args: {
    rotationId: v.id("court_rotations"),
    endTime: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.rotationId, {
      end_time: args.endTime,
    });
    return null;
  },
});

// Get current active rotation for a court
export const getCurrentRotation = query({
  args: {
    leagueId: v.id("leagues"),
    gameDayId: v.id("game_days"),
    courtNumber: v.number(),
  },
  returns: v.union(
    v.object({
      _id: v.id("court_rotations"),
      _creationTime: v.number(),
      league_id: v.id("leagues"),
      game_day_id: v.id("game_days"),
      court_number: v.number(),
      start_time: v.string(),
      end_time: v.string(),
      team1_player1_id: v.optional(v.id("profiles")),
      team1_player2_id: v.optional(v.id("profiles")),
      team2_player1_id: v.optional(v.id("profiles")),
      team2_player2_id: v.optional(v.id("profiles")),
      game_number: v.number(),
      rotation_number: v.number(),
      team1_score: v.optional(v.number()),
      team2_score: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const currentRotation = await ctx.db
      .query("court_rotations")
      .withIndex("by_game_day_and_court", (q) =>
        q.eq("game_day_id", args.gameDayId).eq("court_number", args.courtNumber)
      )
      .filter((q) => 
        q.and(
          q.neq(q.field("start_time"), ""),
          q.eq(q.field("end_time"), "")
        )
      )
      .unique();

    return currentRotation || undefined;
  },
});