import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Helper function to convert local date/time to UTC ISO string
function toUtcIsoString(localDate: string, localTime: string): string {
  const [year, month, day] = localDate.split('-').map(Number);
  const [hour, minute] = localTime.split(':').map(Number);
  const local = new Date(year, month - 1, day, hour, minute);
  return new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString();
}

// Helper function to generate game days
function generateGameDays(
  startDate: string,
  endDate: string,
  playDay: number,
  startTime: string,
  endTime: string
): { date: string, start_datetime_utc: string, end_datetime_utc: string }[] {
  const result: { date: string, start_datetime_utc: string, end_datetime_utc: string }[] = [];
  let current = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  // Find the first occurrence of playDay on or after startDate
  const dayDiff = (playDay - current.getDay() + 7) % 7;
  if (dayDiff > 0) current.setDate(current.getDate() + dayDiff);

  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    result.push({
      date: dateStr,
      start_datetime_utc: toUtcIsoString(dateStr, startTime),
      end_datetime_utc: toUtcIsoString(dateStr, endTime),
    });
    current.setDate(current.getDate() + 7);
  }
  return result;
}

export const getLeague = query({
  args: {
    leagueId: v.id("leagues"),
  },
  returns: v.union(
    v.object({
      _id: v.id("leagues"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      club_id: v.id("clubs"),
      created_by: v.id("profiles"),
      players: v.array(v.id("profiles")),
      substitutes: v.array(v.id("profiles")),
      start_date: v.string(),
      end_date: v.string(),
      allow_substitutes: v.boolean(),
      total_players: v.number(),
      dupr_min: v.optional(v.number()),
      dupr_max: v.optional(v.number()),
      match_type: v.string(),
      play_day: v.number(),
      start_time: v.string(),
      end_time: v.string(),
      gender_type: v.string(),
      cost: v.optional(v.number()),
      member_cost: v.optional(v.number()),
      non_member_cost: v.optional(v.number()),
      access_mode: v.string(),
      courts: v.number(),
      win_type: v.string(),
      points_to_win: v.number(),
      win_by_margin: v.number(),
      games_per_match: v.number(),
      players_per_court: v.number(),
      games_per_rotation: v.number(),
      location: v.optional(v.string()),
      event_type: v.string(),
      court_meta: v.optional(v.any()),
      max_players: v.optional(v.number()),
      finalized: v.boolean(),
      updated_at: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.leagueId);
  },
});

export const getCourtConfigurations = query({
  args: {
    leagueId: v.id("leagues"),
  },
  returns: v.array(
    v.object({
      _id: v.id("court_configurations"),
      _creationTime: v.number(),
      league_id: v.id("leagues"),
      court_number: v.number(),
      display_name: v.string(),
      players_moving_up: v.number(),
      players_moving_down: v.number(),
      players_count: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("court_configurations")
      .withIndex("by_league", (q) => q.eq("league_id", args.leagueId))
      .order("asc")
      .collect();
    
    return configs;
  },
});

export const createLeague = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    club_id: v.id("clubs"),
    created_by: v.id("profiles"),
    players: v.array(v.id("profiles")),
    substitutes: v.array(v.id("profiles")),
    start_date: v.string(),
    end_date: v.string(),
    allow_substitutes: v.boolean(),
    total_players: v.number(),
    dupr_min: v.optional(v.number()),
    dupr_max: v.optional(v.number()),
    match_type: v.string(),
    play_day: v.number(),
    start_time: v.string(),
    end_time: v.string(),
    gender_type: v.string(),
    cost: v.optional(v.number()),
    member_cost: v.optional(v.number()),
    non_member_cost: v.optional(v.number()),
    access_mode: v.string(),
    courts: v.number(),
    win_type: v.string(),
    points_to_win: v.number(),
    win_by_margin: v.number(),
    games_per_match: v.number(),
    players_per_court: v.number(),
    games_per_rotation: v.number(),
    location: v.optional(v.string()),
    event_type: v.string(),
    court_meta: v.optional(v.any()),
    max_players: v.optional(v.number()),
    finalized: v.boolean(),
    courtMovementRules: v.array(
      v.object({
        courtNumber: v.number(),
        displayName: v.string(),
        moveUp: v.number(),
        moveDown: v.number(),
      })
    ),
  },
  returns: v.id("leagues"),
  handler: async (ctx, args) => {
    const { courtMovementRules, ...leagueData } = args;
    
    // Create the league
    const leagueId = await ctx.db.insert("leagues", {
      ...leagueData,
      updated_at: new Date().toISOString(),
    });

    // Create court configurations
    for (const rule of courtMovementRules) {
      await ctx.db.insert("court_configurations", {
        league_id: leagueId,
        court_number: rule.courtNumber,
        display_name: rule.displayName,
        players_moving_up: rule.moveUp,
        players_moving_down: rule.moveDown,
        players_count: leagueData.players_per_court,
      });
    }

    // Generate and create game days
    const gameDayObjs = generateGameDays(
      leagueData.start_date,
      leagueData.end_date,
      leagueData.play_day,
      leagueData.start_time,
      leagueData.end_time
    );

    for (const gameDay of gameDayObjs) {
      await ctx.db.insert("game_days", {
        league_id: leagueId,
        date: gameDay.date,
        start_time: leagueData.start_time,
        end_time: leagueData.end_time,
        status: "pending",
        is_finalized: false,
        start_datetime_utc: gameDay.start_datetime_utc,
        end_datetime_utc: gameDay.end_datetime_utc,
      });
    }

    return leagueId;
  },
});

export const updateLeague = mutation({
  args: {
    leagueId: v.id("leagues"),
    name: v.string(),
    description: v.optional(v.string()),
    club_id: v.id("clubs"),
    players: v.array(v.id("profiles")),
    substitutes: v.array(v.id("profiles")),
    start_date: v.string(),
    end_date: v.string(),
    allow_substitutes: v.boolean(),
    total_players: v.number(),
    dupr_min: v.optional(v.number()),
    dupr_max: v.optional(v.number()),
    match_type: v.string(),
    play_day: v.number(),
    start_time: v.string(),
    end_time: v.string(),
    gender_type: v.string(),
    cost: v.optional(v.number()),
    member_cost: v.optional(v.number()),
    non_member_cost: v.optional(v.number()),
    access_mode: v.string(),
    courts: v.number(),
    win_type: v.string(),
    points_to_win: v.number(),
    win_by_margin: v.number(),
    games_per_match: v.number(),
    players_per_court: v.number(),
    games_per_rotation: v.number(),
    location: v.optional(v.string()),
    event_type: v.string(),
    court_meta: v.optional(v.any()),
    max_players: v.optional(v.number()),
    finalized: v.boolean(),
    courtMovementRules: v.array(
      v.object({
        courtNumber: v.number(),
        displayName: v.string(),
        moveUp: v.number(),
        moveDown: v.number(),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { leagueId, courtMovementRules, ...leagueData } = args;
    
    // Update the league
    await ctx.db.patch(leagueId, {
      ...leagueData,
      updated_at: new Date().toISOString(),
    });

    // Delete existing court configurations
    const existingConfigs = await ctx.db
      .query("court_configurations")
      .withIndex("by_league", (q) => q.eq("league_id", leagueId))
      .collect();
    
    for (const config of existingConfigs) {
      await ctx.db.delete(config._id);
    }

    // Create new court configurations
    for (const rule of courtMovementRules) {
      await ctx.db.insert("court_configurations", {
        league_id: leagueId,
        court_number: rule.courtNumber,
        display_name: rule.displayName,
        players_moving_up: rule.moveUp,
        players_moving_down: rule.moveDown,
        players_count: leagueData.players_per_court,
      });
    }

    // Delete existing game days in the date range
    const existingGameDays = await ctx.db
      .query("game_days")
      .withIndex("by_league", (q) => q.eq("league_id", leagueId))
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), leagueData.start_date),
          q.lte(q.field("date"), leagueData.end_date)
        )
      )
      .collect();
    
    for (const gameDay of existingGameDays) {
      await ctx.db.delete(gameDay._id);
    }

    // Generate and create new game days
    const gameDayObjs = generateGameDays(
      leagueData.start_date,
      leagueData.end_date,
      leagueData.play_day,
      leagueData.start_time,
      leagueData.end_time
    );

    for (const gameDay of gameDayObjs) {
      await ctx.db.insert("game_days", {
        league_id: leagueId,
        date: gameDay.date,
        start_time: leagueData.start_time,
        end_time: leagueData.end_time,
        status: "pending",
        is_finalized: false,
        start_datetime_utc: gameDay.start_datetime_utc,
        end_datetime_utc: gameDay.end_datetime_utc,
      });
    }

    return null;
  },
}); 