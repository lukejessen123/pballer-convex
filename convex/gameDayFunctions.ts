import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Helper function to convert local date/time to UTC ISO string
function toUtcIsoString(localDate: string, localTime: string): string {
  const [year, month, day] = localDate.split('-').map(Number);
  const [hour, minute] = localTime.split(':').map(Number);
  const local = new Date(year, month - 1, day, hour, minute);
  return new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString();
}

// Helper function to convert UTC ISO string to local date string
function utcToLocalDate(utcIso: string): string {
  const d = new Date(utcIso);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Helper function to convert UTC ISO string to local time string
function utcToLocalTime(utcIso: string): string {
  const d = new Date(utcIso);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
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

// Helper function to generate rotations for a court
function generateRotationsForCourt(
  courtNumber: number,
  players: any[],
  gamesPerMatch: number,
  gamesPerRotation: number
): any[] {
  const rotations: any[] = [];
  
  if (players.length === 4) {
    // For 4 players, follow the exact sequence:
    // Games 1 & 2: 1&4 vs 2&3
    // Games 3 & 4: 1&2 vs 3&4
    // Games 5 & 6: 1&3 vs 2&4
    const [p1, p2, p3, p4] = players;
    const pairings = [
      { team1: [p1, p4], team2: [p2, p3] }, // Games 1-2
      { team1: [p1, p2], team2: [p3, p4] }, // Games 3-4
      { team1: [p1, p3], team2: [p2, p4] }  // Games 5-6
    ];
    
    let gameNumber = 1;
    pairings.forEach((pairing, rotationNumber) => {
      for (let i = 0; i < gamesPerRotation; i++) {
        if (gameNumber <= gamesPerMatch) {
          rotations.push({
            game_number: gameNumber,
            rotation_number: rotationNumber + 1,
            team1: pairing.team1,
            team2: pairing.team2
          });
          gameNumber++;
        }
      }
    });
  } else if (players.length >= 5) {
    // For 5+ players, implement sit-out rotations
    let gameNumber = 1;
    let rotationNumber = 1;
    
    while (gameNumber <= gamesPerMatch) {
      // Calculate who sits out this rotation
      const sitOutIndex = (rotationNumber - 1) % players.length;
      const activePlayers = [
        ...players.slice(0, sitOutIndex),
        ...players.slice(sitOutIndex + 1)
      ];
      
      // Generate pairings for active players
      const team1 = [activePlayers[0], activePlayers[3]];
      const team2 = [activePlayers[1], activePlayers[2]];
      
      // Add games for this rotation
      for (let i = 0; i < gamesPerRotation; i++) {
        if (gameNumber <= gamesPerMatch) {
          rotations.push({
            game_number: gameNumber,
            rotation_number: rotationNumber,
            team1: team1,
            team2: team2
          });
          gameNumber++;
        }
      }
      rotationNumber++;
    }
  }
  
  return rotations;
}

export const getPlayers = query({
  args: {
    leagueId: v.id("leagues"),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      first_name: v.string(),
      last_name: v.string(),
      dup_rating: v.optional(v.number()),
      is_present: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    // Get all league members (join league_players to profiles)
    const leaguePlayers = await ctx.db
      .query("league_players")
      .withIndex("by_league", (q) => q.eq("league_id", args.leagueId))
      .collect();

    const players = await Promise.all(
      leaguePlayers.map(async (lp) => {
        const profile = await ctx.db.get(lp.player_id);
        return profile;
      })
    );

    // Transform and map players with their attendance (default to present)
    return players
      .filter((player) => player !== null)
      .map((player) => ({
        id: player!._id,
        first_name: player!.first_name,
        last_name: player!.last_name,
        dup_rating: player!.dup_rating,
        is_present: true, // Default to present since attendance is not tracked
      }));
  },
});

export const markAttendance = mutation({
  args: {
    leagueId: v.id("leagues"),
    playerId: v.id("profiles"),
    isPresent: v.boolean(),
    gameDayId: v.optional(v.id("game_days")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if attendance record already exists
    const existingAttendance = await ctx.db
      .query("game_day_attendance")
      .withIndex("by_league_and_player", (q) => 
        q.eq("league_id", args.leagueId).eq("player_id", args.playerId)
      )
      .filter((q) => q.eq(q.field("date"), today))
      .first();

    if (existingAttendance) {
      // Update existing record
      await ctx.db.patch(existingAttendance._id, {
        is_present: args.isPresent,
      });
    } else {
      // Create new record - only if gameDayId is provided
      if (args.gameDayId) {
        await ctx.db.insert("game_day_attendance", {
          league_id: args.leagueId,
          game_day_id: args.gameDayId,
          player_id: args.playerId,
          is_present: args.isPresent,
          date: today,
        });
      }
    }
    
    return null;
  },
});

export const getCourtConfigurations = query({
  args: {
    leagueId: v.id("leagues"),
  },
  returns: v.array(
    v.object({
      court_number: v.number(),
      players_count: v.number(),
      display_name: v.string(),
      players: v.array(
        v.object({
          id: v.string(),
          first_name: v.string(),
          last_name: v.string(),
          dup_rating: v.optional(v.number()),
          is_present: v.boolean(),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("court_configurations")
      .withIndex("by_league", (q) => q.eq("league_id", args.leagueId))
      .order("asc")
      .collect();

    return configs.map(config => ({
      court_number: config.court_number,
      players_count: config.players_count,
      display_name: config.display_name,
      players: [],
    }));
  },
});

export const updateCourtSize = mutation({
  args: {
    leagueId: v.id("leagues"),
    courtNumber: v.number(),
    playersCount: v.number(),
    displayName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if configuration already exists
    const existingConfig = await ctx.db
      .query("court_configurations")
      .withIndex("by_league_and_court", (q) => 
        q.eq("league_id", args.leagueId).eq("court_number", args.courtNumber)
      )
      .first();

    if (existingConfig) {
      // Update existing configuration
      await ctx.db.patch(existingConfig._id, {
        players_count: args.playersCount,
        display_name: args.displayName || `Court ${args.courtNumber}`,
      });
    } else {
      // Create new configuration
      await ctx.db.insert("court_configurations", {
        league_id: args.leagueId,
        court_number: args.courtNumber,
        players_count: args.playersCount,
        display_name: args.displayName || `Court ${args.courtNumber}`,
        players_moving_up: 1,
        players_moving_down: 1,
      });
    }
    
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

export const generateCourtRotations = mutation({
  args: {
    leagueId: v.id("leagues"),
    gameDayId: v.id("game_days"),
    assignments: v.any(), // Record<string | number, Player[]>
    gamesPerMatch: v.number(),
    gamesPerRotation: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Delete existing rotations
    const existingRotations = await ctx.db
      .query("court_rotations")
      .withIndex("by_league_and_game_day", (q) => 
        q.eq("league_id", args.leagueId).eq("game_day_id", args.gameDayId)
      )
      .collect();

    for (const rotation of existingRotations) {
      await ctx.db.delete(rotation._id);
    }

    // Generate rotations for each court
    const rotations: any[] = [];
    Object.entries(args.assignments).forEach(([courtNumber, players]) => {
      if (courtNumber === 'unassigned') return;
      
      const courtRotations = generateRotationsForCourt(
        parseInt(courtNumber),
        players as any[],
        args.gamesPerMatch,
        args.gamesPerRotation
      );
      
      rotations.push(...courtRotations.map((rotation: any) => ({
        league_id: args.leagueId,
        game_day_id: args.gameDayId,
        court_number: parseInt(courtNumber),
        rotation_number: rotation.rotation_number,
        game_number: rotation.game_number,
        team1_player1_id: rotation.team1[0].id,
        team1_player2_id: rotation.team1[1].id,
        team2_player1_id: rotation.team2[0].id,
        team2_player2_id: rotation.team2[1].id,
      })));
    });

    // Insert new rotations
    for (const rotation of rotations) {
      await ctx.db.insert("court_rotations", rotation);
    }
    
    return null;
  },
});

export const getCourtRotations = query({
  args: {
    leagueId: v.id("leagues"),
    gameDayId: v.id("game_days"),
    courtNumber: v.number(),
  },
  returns: v.array(
    v.object({
      game_number: v.number(),
      rotation_number: v.number(),
      team1: v.array(
        v.object({
          id: v.string(),
          first_name: v.string(),
          last_name: v.string(),
          dup_rating: v.optional(v.number()),
        })
      ),
      team2: v.array(
        v.object({
          id: v.string(),
          first_name: v.string(),
          last_name: v.string(),
          dup_rating: v.optional(v.number()),
        })
      ),
      start_time: v.optional(v.string()),
      end_time: v.optional(v.string()),
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

    const rotationsWithPlayers = await Promise.all(
      rotations.map(async (rotation) => {
        const team1_player1 = await ctx.db.get(rotation.team1_player1_id!);
        const team1_player2 = await ctx.db.get(rotation.team1_player2_id!);
        const team2_player1 = await ctx.db.get(rotation.team2_player1_id!);
        const team2_player2 = await ctx.db.get(rotation.team2_player2_id!);

        return {
          game_number: rotation.game_number,
          rotation_number: rotation.rotation_number,
          team1: [
            {
              id: team1_player1!._id,
              first_name: team1_player1!.first_name,
              last_name: team1_player1!.last_name,
              dup_rating: team1_player1!.dup_rating,
            },
            {
              id: team1_player2!._id,
              first_name: team1_player2!.first_name,
              last_name: team1_player2!.last_name,
              dup_rating: team1_player2!.dup_rating,
            },
          ],
          team2: [
            {
              id: team2_player1!._id,
              first_name: team2_player1!.first_name,
              last_name: team2_player1!.last_name,
              dup_rating: team2_player1!.dup_rating,
            },
            {
              id: team2_player2!._id,
              first_name: team2_player2!.first_name,
              last_name: team2_player2!.last_name,
              dup_rating: team2_player2!.dup_rating,
            },
          ],
          start_time: rotation.start_time,
          end_time: rotation.end_time,
          team1_score: rotation.team1_score,
          team2_score: rotation.team2_score,
        };
      })
    );

    return rotationsWithPlayers;
  },
});

export const saveCourtAssignments = mutation({
  args: {
    leagueId: v.id("leagues"),
    gameDayId: v.id("game_days"),
    assignments: v.any(), // Record<string | number, Player[]>
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // First, delete existing assignments for this game day
    const existingAssignments = await ctx.db
      .query("court_assignments")
      .withIndex("by_league_and_game_day", (q) => 
        q.eq("league_id", args.leagueId).eq("game_day_id", args.gameDayId)
      )
      .collect();

    for (const assignment of existingAssignments) {
      await ctx.db.delete(assignment._id);
    }

    // Prepare new assignments
    const newAssignments = Object.entries(args.assignments)
      .filter(([courtId]) => courtId !== 'unassigned')
      .flatMap(([courtId, players]) => 
        (players as any[]).map((player, index) => ({
          league_id: args.leagueId,
          game_day_id: args.gameDayId,
          court_number: parseInt(courtId),
          slot_number: index + 1,
          player_id: player.id,
          is_substitute: false,
        }))
      );

    // Insert new assignments
    for (const assignment of newAssignments) {
      await ctx.db.insert("court_assignments", assignment);
    }
    
    return null;
  },
});

export const fetchCourtAssignments = query({
  args: {
    leagueId: v.optional(v.id("leagues")),
    gameDayId: v.optional(v.id("game_days")),
  },
  returns: v.any(), // Record<string | number, Player[]>
  handler: async (ctx, args) => {
    if (!args.leagueId || !args.gameDayId) return {};

    const assignments = await ctx.db
      .query("court_assignments")
      .withIndex("by_league_and_game_day", (q) => 
        q.eq("league_id", args.leagueId!).eq("game_day_id", args.gameDayId!)
      )
      .collect();

    // Group players by court_number
    const assignmentsByCourt: Record<string | number, any[]> = {};
    
    for (const assignment of assignments) {
      const court = assignment.court_number?.toString() ?? 'unassigned';
      if (!assignmentsByCourt[court]) assignmentsByCourt[court] = [];
      
      const profile = await ctx.db.get(assignment.player_id);
      if (profile) {
        assignmentsByCourt[court].push({
          id: assignment.player_id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          dup_rating: profile.dup_rating,
        });
      }
    }

    return assignmentsByCourt;
  },
});

export const getAssignmentsForGameDay = query({
  args: {
    gameDayId: v.id("game_days"),
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
    })
  ),
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("court_assignments")
      .withIndex("by_game_day", (q) => q.eq("game_day_id", args.gameDayId))
      .order("asc")
      .collect();
    return assignments;
  },
});

export const updateGameDayStatus = mutation({
  args: {
    gameDayId: v.id("game_days"),
    status: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.gameDayId, {
      status: args.status,
      updated_at: new Date().toISOString(),
    });
    return null;
  },
});

export const getGameDay = query({
  args: {
    gameDayId: v.id("game_days"),
  },
  returns: v.union(
    v.object({
      _id: v.id("game_days"),
      _creationTime: v.number(),
      league_id: v.id("leagues"),
      date: v.string(),
      start_time: v.string(),
      end_time: v.string(),
      status: v.string(),
      is_finalized: v.boolean(),
      start_datetime_utc: v.string(),
      end_datetime_utc: v.string(),
      updated_at: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameDayId);
  },
});

export const getAssignmentsWithPlayers = query({
  args: {
    gameDayId: v.id("game_days"),
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
    const assignments = await ctx.db
      .query("court_assignments")
      .withIndex("by_game_day", (q) => q.eq("game_day_id", args.gameDayId))
      .order("asc")
      .collect();
    
    const assignmentsWithPlayers = await Promise.all(
      assignments.map(async (assignment) => {
        const player = await ctx.db.get(assignment.player_id);
        return {
          ...assignment,
          player,
        };
      })
    );
    
    return assignmentsWithPlayers;
  },
}); 

export const createGameDay = mutation({
  args: {
    leagueId: v.id("leagues"),
    date: v.string(),
  },
  returns: v.id("game_days"),
  handler: async (ctx, args) => {
    // Create a new game day
    const gameDayId = await ctx.db.insert("game_days", {
      league_id: args.leagueId,
      date: args.date,
      start_time: "09:00", // Default start time
      end_time: "12:00",   // Default end time
      status: "pending",
      is_finalized: false,
      start_datetime_utc: new Date(args.date + "T00:00:00").toISOString(),
      end_datetime_utc: new Date(args.date + "T23:59:59").toISOString(),
    });
    
    return gameDayId;
  },
});

export const getGameDays = query({
  args: {
    leagueId: v.id("leagues"),
  },
  returns: v.array(
    v.object({
      _id: v.id("game_days"),
      _creationTime: v.number(),
      league_id: v.id("leagues"),
      date: v.string(),
      status: v.string(),
      is_finalized: v.boolean(),
      start_datetime_utc: v.optional(v.string()),
      end_datetime_utc: v.optional(v.string()),
      updated_at: v.optional(v.string()),
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