import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getStandings = query({
  args: {
    leagueId: v.id("leagues"),
  },
  returns: v.array(
    v.object({
      _id: v.id("standings"),
      _creationTime: v.number(),
      league_id: v.id("leagues"),
      player_id: v.id("profiles"),
      total_points: v.number(),
      games_won: v.number(),
      win_pct: v.number(),
      points_per_game: v.number(),
      court_number: v.number(),
      movement: v.string(),
      game_day_id: v.optional(v.id("game_days")),
      is_substitute: v.boolean(),
      substitute_name: v.optional(v.string()),
      games_played: v.number(),
      court_rank: v.number(),
      move_up: v.number(),
      move_down: v.number(),
      display_name: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const standings = await ctx.db
      .query("standings")
      .withIndex("by_league", (q) => q.eq("league_id", args.leagueId))
      .order("asc")
      .collect();
    return standings;
  },
});

export const getStandingsWithPlayers = query({
  args: {
    leagueId: v.id("leagues"),
  },
  returns: v.array(
    v.object({
      _id: v.id("standings"),
      _creationTime: v.number(),
      league_id: v.id("leagues"),
      player_id: v.id("profiles"),
      total_points: v.number(),
      games_won: v.number(),
      win_pct: v.number(),
      points_per_game: v.number(),
      court_number: v.number(),
      movement: v.string(),
      game_day_id: v.optional(v.id("game_days")),
      is_substitute: v.boolean(),
      substitute_name: v.optional(v.string()),
      games_played: v.number(),
      court_rank: v.number(),
      move_up: v.number(),
      move_down: v.number(),
      display_name: v.string(),
      player: v.union(
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
        }),
        v.null()
      ),
    })
  ),
  handler: async (ctx, args) => {
    const standings = await ctx.db
      .query("standings")
      .withIndex("by_league", (q) => q.eq("league_id", args.leagueId))
      .order("asc")
      .collect();
    const standingsWithPlayers = await Promise.all(
      standings.map(async (standing) => {
        const player = await ctx.db.get(standing.player_id);
        return {
          ...standing,
          player,
        };
      })
    );
    return standingsWithPlayers;
  },
});

export const getCourtAssignments = query({
  args: {
    leagueId: v.id("leagues"),
  },
  returns: v.array(
    v.object({
      court_number: v.number(),
      players: v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          role: v.string(),
          dup_rating: v.number(),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const standings = await ctx.db
      .query("standings")
      .withIndex("by_league", (q) => q.eq("league_id", args.leagueId))
      .order("asc")
      .collect();

    const courtAssignments: any[] = [];
    
    for (const standing of standings) {
      const player = await ctx.db.get(standing.player_id);
      if (!player) continue;

      const playerObj = {
        id: player._id,
        name: `${player.first_name} ${player.last_name}`,
        role: player.role,
        dup_rating: player.dup_rating ?? 0,
      };

      const court = courtAssignments.find(
        (c) => c.court_number === standing.court_number
      );
      
      if (court) {
        court.players.push(playerObj);
      } else {
        courtAssignments.push({
          court_number: standing.court_number,
          players: [playerObj],
        });
      }
    }

    return courtAssignments;
  },
});

export const markPlayerAbsent = mutation({
  args: {
    leagueId: v.id("leagues"),
    playerId: v.id("profiles"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Find the player's standing record
    const standing = await ctx.db
      .query("standings")
      .withIndex("by_league_and_player", (q) => 
        q.eq("league_id", args.leagueId).eq("player_id", args.playerId)
      )
      .first();

    if (standing) {
      // Mark as substitute and set substitute name
      await ctx.db.patch(standing._id, {
        is_substitute: true,
        substitute_name: "ABSENT",
      });
    }
    
    return null;
  },
});

export const updateCourtSize = mutation({
  args: {
    leagueId: v.id("leagues"),
    courtNumber: v.number(),
    size: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Update court configuration
    const existingConfig = await ctx.db
      .query("court_configurations")
      .withIndex("by_league_and_court", (q) => 
        q.eq("league_id", args.leagueId).eq("court_number", args.courtNumber)
      )
      .first();

    if (existingConfig) {
      await ctx.db.patch(existingConfig._id, {
        players_count: args.size,
      });
    } else {
      await ctx.db.insert("court_configurations", {
        league_id: args.leagueId,
        court_number: args.courtNumber,
        players_count: args.size,
        display_name: `Court ${args.courtNumber}`,
        players_moving_up: 1,
        players_moving_down: 1,
      });
    }
    
    return null;
  },
});

export const refreshCourtAssignments = mutation({
  args: {
    leagueId: v.id("leagues"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // This would typically involve complex logic to recalculate standings
    // and reassign players to courts based on their performance
    // For now, we'll just mark this as a placeholder
    console.log("Refreshing court assignments for league:", args.leagueId);
    
    return null;
  },
});

export const finalizeGameDay = mutation({
  args: {
    leagueId: v.id("leagues"),
    gameDayId: v.id("game_days"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Update game day status to finalized
    await ctx.db.patch(args.gameDayId, {
      is_finalized: true,
      status: "finalized",
      updated_at: new Date().toISOString(),
    });
    
    return null;
  },
}); 