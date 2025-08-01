import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Utility function to handle updated_at logic (equivalent to PostgreSQL handle_updated_at trigger)
 * 
 * This function automatically adds an updated_at timestamp to any data object.
 * Use this function when inserting or updating records that have an updated_at field.
 * 
 * Example usage:
 * - For inserts: await ctx.db.insert("table", withUpdatedAt({ field1: "value1" }))
 * - For updates: await ctx.db.patch(id, withUpdatedAt({ field1: "new_value" }))
 * 
 * Tables with updated_at fields:
 * - profiles
 * - clubs  
 * - leagues
 * - game_days
 */
export const withUpdatedAt = <T extends Record<string, any>>(data: T): T & { updated_at: string } => {
  return {
    ...data,
    updated_at: new Date().toISOString(),
  };
};

/**
 * Utility function to check if the current user is a super admin
 * 
 * This function queries the super_admins table to determine if the currently
 * authenticated user has super admin privileges.
 * 
 * Example usage:
 * - In queries: const isAdmin = await ctx.runQuery(internal.standingsFunctions.isSuperAdmin);
 * - In mutations: const isAdmin = await ctx.runQuery(internal.standingsFunctions.isSuperAdmin);
 * 
 * Returns true if the user is a super admin, false otherwise.
 */
export const isSuperAdmin = internalQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    // Get the current user's ID from authentication context
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      // No authenticated user
      return false;
    }
    
    const userId = identity.subject;
    
    // Check if the user exists in the super_admins table
    const superAdmin = await ctx.db
      .query("super_admins")
      .filter((q) => q.eq(q.field("_id"), userId))
      .first();
    
    return superAdmin !== null;
  },
});

/**
 * Get leagues that the current user has access to
 * 
 * Returns league IDs where the user is:
 * 1. A player in the league
 * 2. An admin or creator of the club that owns the league
 * 3. The creator of the league itself (when not tied to a club)
 */
export const leaguesForCurrentUser = query({
  args: {},
  returns: v.array(v.id("leagues")),
  handler: async (ctx) => {
    // Get the current user's ID from authentication context
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      // No authenticated user
      return [];
    }

    const userId = identity.subject as Id<"profiles">;
    const leagueIds = new Set<Id<"leagues">>();

    // Case 1: User is a player in the league
    const playerLeagues = await ctx.db
      .query("league_players")
      .filter((q) => q.eq(q.field("player_id"), userId))
      .collect();

    for (const playerLeague of playerLeagues) {
      leagueIds.add(playerLeague.league_id);
    }

    // Case 2: User is admin or creator of the club that owns the league
    const clubLeagues = await ctx.db
      .query("leagues")
      .filter((q) => q.neq(q.field("club_id"), undefined))
      .collect();

    for (const league of clubLeagues) {
      if (league.club_id) {
        const club = await ctx.db.get(league.club_id);
        if (club) {
          // Check if user is club creator
          if (club.created_by === userId) {
            leagueIds.add(league._id);
          }
          // Check if user is in club admins array
          else if (club.admins && club.admins.includes(userId)) {
            leagueIds.add(league._id);
          }
        }
      }
    }

    // Case 3: User is the creator of the league (when not tied to a club)
    const directLeagues = await ctx.db
      .query("leagues")
      .filter((q) => 
        q.and(
          q.eq(q.field("created_by"), userId),
          q.eq(q.field("club_id"), undefined)
        )
      )
      .collect();

    for (const league of directLeagues) {
      leagueIds.add(league._id);
    }

    // Convert Set to Array and return
    return Array.from(leagueIds);
  },
});

/**
 * Updates a court rotation score and sets game day status to 'in_progress' if pending
 * (Equivalent to PostgreSQL set_game_day_in_progress trigger function)
 *
 * This mutation simulates the trigger behavior by:
 * 1. Updating the court rotation with new scores
 * 2. Checking if either score is non-null
 * 3. If so, checking if the associated game day is 'pending'
 * 4. If both conditions are met, updating the game day status to 'in_progress'
 *
 * Usage: Call this mutation whenever a score is being entered or updated for a court rotation
 */
export const updateRotationScore = mutation({
  args: {
    rotationId: v.id("court_rotations"),
    team1_score: v.optional(v.number()),
    team2_score: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    gameDayUpdated: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get the court rotation record
    const rotation = await ctx.db.get(args.rotationId);
    if (!rotation) {
      throw new Error("Court rotation not found");
    }

    // Update the court rotation with new scores
    await ctx.db.patch(args.rotationId, {
      team1_score: args.team1_score,
      team2_score: args.team2_score,
    });

    // Check if either score is being set (not null)
    const hasScore = args.team1_score !== null || args.team2_score !== null;

    if (hasScore) {
      // Get the associated game day
      const gameDay = await ctx.db.get(rotation.game_day_id);
      if (gameDay && gameDay.status === "pending") {
        // Update the game day status to 'in_progress'
        await ctx.db.patch(rotation.game_day_id, {
          status: "in_progress",
        });

        console.log(`Game day ${rotation.game_day_id} status updated to 'in_progress'`);
        
        return {
          success: true,
          gameDayUpdated: true,
          message: "Score updated and game day status changed to in_progress",
        };
      }
    }

    return {
      success: true,
      gameDayUpdated: false,
      message: "Score updated successfully",
    };
  },
});

// Types for our standings calculation
interface GameStats {
  player_id: Id<"profiles">;
  court_number: number;
  is_substitute: boolean;
  substitute_name?: string;
  players_moving_up: number;
  players_moving_down: number;
  players_count: number;
  display_name: string;
  total_points: number;
  games_won: number;
  games_played: number;
}

interface RankedPlayer extends GameStats {
  win_pct: number;
  points_per_game: number;
  court_rank: number;
  is_all_sub_court: boolean;
  h2hWins: number;
}

interface CourtStats {
  court_number: number;
  regular_count: number;
  players_moving_up: number;
}

interface MovementCalculated extends RankedPlayer {
  players_moving_up: number;
  players_moving_down: number;
  players_count: number;
  move_up_rank?: number;
  should_move_up: number;
  should_move_down: number;
}

interface FinalStanding {
  league_id: Id<"leagues">;
  game_day_id: Id<"game_days">;
  player_id: Id<"profiles">;
  court_number: number;
  is_substitute: boolean;
  substitute_name?: string;
  games_played: number;
  games_won: number;
  total_points: number;
  win_pct: number;
  points_per_game: number;
  court_rank: number;
  move_up: number;
  move_down: number;
  display_name: string;
  movement: "up" | "down" | "stay";
}

/**
 * Calculate standings for a pickleball league on a specific game day
 * This is a complex function that replicates the PostgreSQL logic
 */
export const calculateStandings = internalMutation({
  args: {
    league_id: v.id("leagues"),
    game_day_id: v.id("game_days"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { league_id, game_day_id } = args;

    // Get league configuration
    const league = await ctx.db.get(league_id);
    if (!league) {
      throw new ConvexError("League not found");
    }

    const isPointsMode = league.win_type === "points";

    // Get max court number
    const courtAssignments = await ctx.db
      .query("court_assignments")
      .withIndex("by_league_and_game_day", (q) =>
        q.eq("league_id", league_id).eq("game_day_id", game_day_id)
      )
      .collect();

    const maxCourt = Math.max(...courtAssignments.map(ca => ca.court_number), 0);

    // Delete existing standings for this league and game day
    const existingStandings = await ctx.db
      .query("standings")
      .withIndex("by_league_and_player", (q) =>
        q.eq("league_id", league_id)
      )
      .filter((q) => q.eq(q.field("game_day_id"), game_day_id))
      .collect();

    for (const standing of existingStandings) {
      await ctx.db.delete(standing._id);
    }

    // Get all court rotations for this game day
    const courtRotations = await ctx.db
      .query("court_rotations")
      .withIndex("by_game_day", (q) => q.eq("game_day_id", game_day_id))
      .collect();

    // Get court configurations
    const courtConfigs = await ctx.db
      .query("court_configurations")
      .withIndex("by_league", (q) => q.eq("league_id", league_id))
      .collect();

    const courtConfigMap = new Map(
      courtConfigs.map(cc => [cc.court_number, cc])
    );

    // Calculate game stats for each player
    const gameStats: GameStats[] = [];
    const playerStats = new Map<string, GameStats>();

    for (const assignment of courtAssignments) {
      const config = courtConfigMap.get(assignment.court_number);
      if (!config) continue;

      const playerKey = `${assignment.player_id}_${assignment.court_number}`;
      
      if (!playerStats.has(playerKey)) {
        playerStats.set(playerKey, {
          player_id: assignment.player_id,
          court_number: assignment.court_number,
          is_substitute: assignment.is_substitute,
          substitute_name: assignment.substitute_name,
          players_moving_up: config.players_moving_up,
          players_moving_down: config.players_moving_down,
          players_count: config.players_count,
          display_name: config.display_name,
          total_points: 0,
          games_won: 0,
          games_played: 0,
        });
      }

      const stats = playerStats.get(playerKey)!;

      // Calculate points and wins from court rotations
      for (const rotation of courtRotations) {
        if (rotation.court_number !== assignment.court_number) continue;

        const isTeam1 = rotation.team1_player1_id === assignment.player_id || 
                       rotation.team1_player2_id === assignment.player_id;
        const isTeam2 = rotation.team2_player1_id === assignment.player_id || 
                       rotation.team2_player2_id === assignment.player_id;

        if (isTeam1 || isTeam2) {
          const teamScore = isTeam1 ? rotation.team1_score : rotation.team2_score;
          const otherTeamScore = isTeam1 ? rotation.team2_score : rotation.team1_score;

          stats.total_points += teamScore || 0;
          stats.games_played += 1;

          if ((teamScore || 0) > (otherTeamScore || 0)) {
            stats.games_won += 1;
          }
        }
      }
    }

    gameStats.push(...playerStats.values());

    // Calculate head-to-head records
    const headToHead = new Map<string, number>();
    
    for (const p1 of gameStats) {
      for (const p2 of gameStats) {
        if (p1.player_id >= p2.player_id || p1.court_number !== p2.court_number) continue;

        const key = `${p1.player_id}_${p2.player_id}`;
        let p1Wins = 0;

        for (const rotation of courtRotations) {
          if (rotation.court_number !== p1.court_number) continue;

          const p1IsTeam1 = rotation.team1_player1_id === p1.player_id || 
                           rotation.team1_player2_id === p1.player_id;
          const p2IsTeam2 = rotation.team2_player1_id === p2.player_id || 
                           rotation.team2_player2_id === p2.player_id;

          if (p1IsTeam1 && p2IsTeam2) {
            if ((rotation.team1_score || 0) > (rotation.team2_score || 0)) {
              p1Wins++;
            }
          } else if (!p1IsTeam1 && !p2IsTeam2) {
            if ((rotation.team2_score || 0) > (rotation.team1_score || 0)) {
              p1Wins++;
            }
          }
        }

        headToHead.set(key, p1Wins);
      }
    }

    // Calculate all-substitute courts
    const allSubCourts = new Set<number>();
    const courtPlayerCounts = new Map<number, { total: number; subCount: number }>();

    for (const assignment of courtAssignments) {
      const current = courtPlayerCounts.get(assignment.court_number) || { total: 0, subCount: 0 };
      current.total++;
      if (assignment.is_substitute) {
        current.subCount++;
      }
      courtPlayerCounts.set(assignment.court_number, current);
    }

    for (const [courtNumber, counts] of courtPlayerCounts) {
      if (counts.total === counts.subCount && counts.total > 0) {
        allSubCourts.add(courtNumber);
      }
    }

    // Rank players within each court
    const rankedPlayers: RankedPlayer[] = [];
    
    const courts = new Set(gameStats.map(gs => gs.court_number));
    
    for (const courtNumber of courts) {
      const courtPlayers = gameStats.filter(gs => gs.court_number === courtNumber);
      
      const ranked = courtPlayers.map(player => {
        const winPct = player.games_played > 0 ? 
          Math.round((player.games_won / player.games_played) * 100 * 100) / 100 : 0;
        const pointsPerGame = player.games_played > 0 ? 
          Math.round((player.total_points / player.games_played) * 100) / 100 : 0;

        // Calculate head-to-head wins for this player
        let h2hWins = 0;
        for (const [key, wins] of headToHead) {
          const [p1Id, p2Id] = key.split('_');
          if (p1Id === player.player_id) {
            h2hWins += wins;
          }
        }

        return {
          ...player,
          win_pct: winPct,
          points_per_game: pointsPerGame,
          court_rank: 0, // Will be set below
          is_all_sub_court: allSubCourts.has(courtNumber),
          h2hWins,
        };
      });

      // Sort and rank players
      ranked.sort((a, b) => {
        // Primary sort by points or wins based on mode
        const aPrimary = isPointsMode ? a.total_points : a.games_won;
        const bPrimary = isPointsMode ? b.total_points : b.games_won;
        
        if (aPrimary !== bPrimary) {
          return bPrimary - aPrimary;
        }

        // Secondary sort by the other metric
        const aSecondary = isPointsMode ? a.games_won : a.total_points;
        const bSecondary = isPointsMode ? b.games_won : b.total_points;
        
        if (aSecondary !== bSecondary) {
          return bSecondary - aSecondary;
        }

        // Tertiary sort by head-to-head
        if (a.h2hWins !== b.h2hWins) {
          return b.h2hWins - a.h2hWins;
        }

        // Final tiebreaker - random (we'll use player ID for consistency)
        return a.player_id.localeCompare(b.player_id);
      });

      // Assign ranks
      for (let i = 0; i < ranked.length; i++) {
        ranked[i].court_rank = i + 1;
      }

      rankedPlayers.push(...ranked);
    }

    // Calculate court stats
    const courtStats = new Map<number, CourtStats>();
    
    for (const courtNumber of courts) {
      const courtPlayers = rankedPlayers.filter(rp => rp.court_number === courtNumber);
      const regularCount = courtPlayers.filter(rp => !rp.is_substitute).length;
      const config = courtConfigMap.get(courtNumber);
      
      courtStats.set(courtNumber, {
        court_number: courtNumber,
        regular_count: regularCount,
        players_moving_up: config?.players_moving_up || 0,
      });
    }

    // Calculate movement
    const finalStandings: FinalStanding[] = [];

    for (const player of rankedPlayers) {
      const config = courtConfigMap.get(player.court_number);
      if (!config) continue;

      const stats = courtStats.get(player.court_number);
      if (!stats) continue;

      // Calculate move up eligibility
      let shouldMoveUp = 0;
      if (player.is_all_sub_court && player.court_rank <= config.players_moving_up) {
        shouldMoveUp = 1;
      } else {
        // Check if player is eligible to move up
        const eligibleForMoveUp = (stats.regular_count >= stats.players_moving_up && 
                                  !player.is_substitute && 
                                  player.court_rank <= stats.players_moving_up) ||
                                 (stats.regular_count < stats.players_moving_up && 
                                  ((!player.is_substitute) || 
                                   (player.is_substitute && player.court_rank <= stats.players_moving_up && 
                                    player.court_rank > stats.regular_count)));
        
        if (eligibleForMoveUp) {
          shouldMoveUp = 1;
        }
      }

      // Calculate move down eligibility
      let shouldMoveDown = 0;
      if (player.is_substitute && player.court_rank === config.players_count && 
          player.court_number !== maxCourt) {
        shouldMoveDown = 1;
      } else if (player.court_rank > (config.players_count - config.players_moving_down)) {
        shouldMoveDown = 1;
      }

      // Determine final movement
      const moveUp = shouldMoveUp;
      const moveDown = shouldMoveDown;
      const movement: "up" | "down" | "stay" = moveUp === 1 ? "up" : moveDown === 1 ? "down" : "stay";

      finalStandings.push({
        league_id,
        game_day_id,
        player_id: player.player_id,
        court_number: player.court_number,
        is_substitute: player.is_substitute,
        substitute_name: player.substitute_name,
        games_played: player.games_played,
        games_won: player.games_won,
        total_points: player.total_points,
        win_pct: player.win_pct,
        points_per_game: player.points_per_game,
        court_rank: player.court_rank,
        move_up: moveUp,
        move_down: moveDown,
        display_name: player.display_name,
        movement,
      });
    }

    // Deduplicate by player (take the best court rank)
    const playerBestStandings = new Map<string, FinalStanding>();
    
    for (const standing of finalStandings) {
      const key = standing.player_id;
      const existing = playerBestStandings.get(key);
      
      if (!existing || standing.court_rank < existing.court_rank) {
        playerBestStandings.set(key, standing);
      }
    }

    // Insert final standings
    for (const standing of playerBestStandings.values()) {
      await ctx.db.insert("standings", standing);
    }

    return null;
  },
});

/**
 * Finalize a game day for a pickleball league
 * Validates game completion, updates status, and triggers standings calculation
 */
export const finalizeGameDay = mutation({
  args: {
    league_id: v.id("leagues"),
    game_day_id: v.id("game_days"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { league_id, game_day_id } = args;

    // Check if game day exists
    const gameDay = await ctx.db.get(game_day_id);
    if (!gameDay || gameDay.league_id !== league_id) {
      throw new ConvexError("Game day not found");
    }

    // Count incomplete games
    const incompleteGames = await ctx.db
      .query("court_rotations")
      .withIndex("by_game_day", (q) => q.eq("game_day_id", game_day_id))
      .filter((q) => 
        q.eq(q.field("league_id"), league_id) &&
        (q.eq(q.field("team1_score"), null) || q.eq(q.field("team2_score"), null))
      )
      .collect();

    const incompleteCount = incompleteGames.length;

    // Log debug information
    console.log('Finalizing game day:');
    console.log('League ID:', league_id, 'Game Day ID:', game_day_id);
    console.log('Incomplete games:', incompleteCount);

    // Check if all games are complete
    if (incompleteCount > 0) {
      throw new ConvexError(`Cannot finalize: ${incompleteCount} games are incomplete`);
    }

    // Update game day status with updated_at timestamp
    await ctx.db.patch(game_day_id, withUpdatedAt({
      is_finalized: true,
      status: "completed"
    }));

    // Schedule the standings calculation
    await ctx.scheduler.runAfter(0, internal.standingsFunctions.calculateStandings, {
      league_id,
      game_day_id,
    });

    console.log('Game day finalization completed successfully');
    
    return null;
  },
});

/**
 * Generate court rotations for a pickleball league game day
 * Creates 3 standard rotation games for each court with exactly 4 players
 */
export const generateCourtRotations = mutation({
  args: {
    league_id: v.id("leagues"),
    game_day_id: v.id("game_days"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { league_id, game_day_id } = args;

    // Get all distinct court numbers for this game day
    const courtAssignments = await ctx.db
      .query("court_assignments")
      .withIndex("by_league_and_game_day", (q) =>
        q.eq("league_id", league_id).eq("game_day_id", game_day_id)
      )
      .collect();

    // Get unique court numbers
    const courtNumbers = [...new Set(courtAssignments.map(ca => ca.court_number))];

    // Process each court
    for (const courtNumber of courtNumbers) {
      // Get all players assigned to this court, ordered by slot_number, then player_id
      const courtPlayers = courtAssignments
        .filter(ca => ca.court_number === courtNumber)
        .sort((a, b) => {
          // Sort by slot_number first, then by player_id as tiebreaker
          if (a.slot_number !== b.slot_number) {
            return a.slot_number - b.slot_number;
          }
          return a.player_id.localeCompare(b.player_id);
        })
        .map(ca => ca.player_id);

      // Check if we have exactly 4 players
      if (courtPlayers.length === 4) {
        const [player1, player2, player3, player4] = courtPlayers;

                          // Game 1: 1&4 vs 2&3
         await ctx.db.insert("court_rotations", {
           league_id,
           game_day_id,
           court_number: courtNumber,
           start_time: "",
           end_time: "",
           game_number: 1,
           rotation_number: 1,
           team1_player1_id: player1,
           team1_player2_id: player4,
           team2_player1_id: player2,
           team2_player2_id: player3,
           team1_score: undefined,
           team2_score: undefined,
         });

         // Game 2: 1&2 vs 3&4
         await ctx.db.insert("court_rotations", {
           league_id,
           game_day_id,
           court_number: courtNumber,
           start_time: "",
           end_time: "",
           game_number: 2,
           rotation_number: 2,
           team1_player1_id: player1,
           team1_player2_id: player2,
           team2_player1_id: player3,
           team2_player2_id: player4,
           team1_score: undefined,
           team2_score: undefined,
         });

         // Game 3: 1&3 vs 2&4
         await ctx.db.insert("court_rotations", {
           league_id,
           game_day_id,
           court_number: courtNumber,
           start_time: "",
           end_time: "",
           game_number: 3,
           rotation_number: 3,
           team1_player1_id: player1,
           team1_player2_id: player3,
           team2_player1_id: player2,
           team2_player2_id: player4,
           team1_score: undefined,
           team2_score: undefined,
         });

        console.log(`Generated 3 rotations for court ${courtNumber} with players:`, courtPlayers);
      } else {
        console.log(`Court ${courtNumber} has ${courtPlayers.length} players (need exactly 4)`);
      }
    }

    return null;
  },
});

/**
 * Generate game days for a pickleball league
 * Creates game day records at 7-day intervals within a specified date range
 */
export const generateGameDays = mutation({
  args: {
    league_id: v.id("leagues"),
    start_date: v.string(), // date as string (YYYY-MM-DD)
    end_date: v.string(), // date as string (YYYY-MM-DD)
    play_day: v.number(), // 0 = Sunday, 1 = Monday, etc.
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { league_id, start_date, end_date, play_day } = args;

    // Get league's season end date
    const league = await ctx.db.get(league_id);
    if (!league) {
      throw new ConvexError("League not found");
    }

    const seasonEndDate = league.end_date;

    // Parse dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const seasonEnd = new Date(seasonEndDate);

    // Find the first occurrence of the desired play day
    const firstGameDay = new Date(startDate);
    const currentDayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate days to add to get to the target play day
    let daysToAdd = (7 + play_day - currentDayOfWeek) % 7;
    if (daysToAdd === 0 && startDate.getDay() !== play_day) {
      daysToAdd = 7; // If we're already on the target day but want the next occurrence
    }
    
    firstGameDay.setDate(startDate.getDate() + daysToAdd);

    // Determine the actual end date (earlier of user end_date or league end_date)
    const actualEndDate = endDate < seasonEnd ? endDate : seasonEnd;

    // Generate game days every 7 days
    const gameDays: Array<{
      league_id: Id<"leagues">;
      date: string;
      status: string;
      start_time: string;
      end_time: string;
      is_finalized: boolean;
      start_datetime_utc: string;
      end_datetime_utc: string;
    }> = [];

    const currentDate = new Date(firstGameDay);
    
    while (currentDate <= actualEndDate) {
      const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Check if game day already exists for this league and date
      const existingGameDay = await ctx.db
        .query("game_days")
        .withIndex("by_league_and_date", (q) =>
          q.eq("league_id", league_id).eq("date", dateString)
        )
        .unique();

      if (!existingGameDay) {
        // Create UTC datetime strings for the game day
        const startDateTime = new Date(currentDate);
        startDateTime.setHours(7, 0, 0, 0); // 7:00 AM local time
        
        const endDateTime = new Date(currentDate);
        endDateTime.setHours(10, 0, 0, 0); // 10:00 AM local time

        gameDays.push({
          league_id,
          date: dateString,
          status: "pending",
          start_time: "07:00:00",
          end_time: "10:00:00",
          is_finalized: false,
          start_datetime_utc: startDateTime.toISOString(),
          end_datetime_utc: endDateTime.toISOString(),
        });
      }

      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }

    // Insert all game days
    for (const gameDay of gameDays) {
      await ctx.db.insert("game_days", gameDay);
    }

    console.log(`Generated ${gameDays.length} game days for league ${league_id}`);
    console.log(`Date range: ${firstGameDay.toISOString().split('T')[0]} to ${actualEndDate.toISOString().split('T')[0]}`);

    return null;
  },
});

/**
 * Generate court rotations and set game day status to in_progress
 * Creates 3 standard rotation games for each court with exactly 4 players
 * and updates game day status from 'pending' to 'in_progress'
 */
export const generateRotationsAndSetStatus = mutation({
  args: {
    league_id: v.id("leagues"),
    game_day_id: v.id("game_days"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { league_id, game_day_id } = args;

    // Get all distinct court numbers for this game day
    const courtAssignments = await ctx.db
      .query("court_assignments")
      .withIndex("by_league_and_game_day", (q) =>
        q.eq("league_id", league_id).eq("game_day_id", game_day_id)
      )
      .collect();

    // Get unique court numbers
    const courtNumbers = [...new Set(courtAssignments.map(ca => ca.court_number))];

    // Process each court
    for (const courtNumber of courtNumbers) {
      // Get all players assigned to this court, ordered by slot_number, then player_id
      const courtPlayers = courtAssignments
        .filter(ca => ca.court_number === courtNumber)
        .sort((a, b) => {
          // Sort by slot_number first, then by player_id as tiebreaker
          if (a.slot_number !== b.slot_number) {
            return a.slot_number - b.slot_number;
          }
          return a.player_id.localeCompare(b.player_id);
        })
        .map(ca => ca.player_id);

      // Check if we have exactly 4 players
      if (courtPlayers.length === 4) {
        const [player1, player2, player3, player4] = courtPlayers;

        // Game 1: 1&4 vs 2&3
        await ctx.db.insert("court_rotations", {
          league_id,
          game_day_id,
          court_number: courtNumber,
          start_time: "",
          end_time: "",
          game_number: 1,
          rotation_number: 1,
          team1_player1_id: player1,
          team1_player2_id: player4,
          team2_player1_id: player2,
          team2_player2_id: player3,
          team1_score: undefined,
          team2_score: undefined,
        });

        // Game 2: 1&2 vs 3&4
        await ctx.db.insert("court_rotations", {
          league_id,
          game_day_id,
          court_number: courtNumber,
          start_time: "",
          end_time: "",
          game_number: 2,
          rotation_number: 2,
          team1_player1_id: player1,
          team1_player2_id: player2,
          team2_player1_id: player3,
          team2_player2_id: player4,
          team1_score: undefined,
          team2_score: undefined,
        });

        // Game 3: 1&3 vs 2&4
        await ctx.db.insert("court_rotations", {
          league_id,
          game_day_id,
          court_number: courtNumber,
          start_time: "",
          end_time: "",
          game_number: 3,
          rotation_number: 3,
          team1_player1_id: player1,
          team1_player2_id: player3,
          team2_player1_id: player2,
          team2_player2_id: player4,
          team1_score: undefined,
          team2_score: undefined,
        });

        console.log(`Generated 3 rotations for court ${courtNumber} with players:`, courtPlayers);
      } else {
        console.log(`Court ${courtNumber} has ${courtPlayers.length} players (need exactly 4)`);
      }
    }

    // Set the game day status to 'in_progress' if it is still 'pending'
    const gameDay = await ctx.db.get(game_day_id);
    if (gameDay && gameDay.status === "pending") {
      await ctx.db.patch(game_day_id, withUpdatedAt({
        status: "in_progress"
      }));
      console.log(`Updated game day ${game_day_id} status from 'pending' to 'in_progress'`);
    } else {
      console.log(`Game day ${game_day_id} status is already '${gameDay?.status || 'unknown'}'`);
    }

    return null;
  },
});

/**
 * Get standings for a specific league
 * Replaces: getStandings(leagueId: string)
 */
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

/**
 * Get standings with player details for a specific league
 */
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

    // Fetch player details for each standing
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

/**
 * Get detailed game day rankings with player stats and game scores
 * Returns rankings for each player including their performance stats and individual game scores
 */
export const getGameDayRankings = query({
  args: {
    league_id: v.id("leagues"),
    game_day_id: v.id("game_days"),
  },
  returns: v.array(
    v.object({
      player_id: v.id("profiles"),
      first_name: v.string(),
      last_name: v.string(),
      court_number: v.number(),
      total_points: v.number(),
      games_won: v.number(),
      games_played: v.number(),
      win_pct: v.number(),
      points_per_game: v.number(),
      movement: v.string(),
      substitute_name: v.optional(v.string()),
      game_scores: v.array(v.union(v.number(), v.null())),
    })
  ),
  handler: async (ctx, args) => {
    const { league_id, game_day_id } = args;

    // Get all standings for this league and game day
    const standings = await ctx.db
      .query("standings")
      .withIndex("by_league_and_player", (q) =>
        q.eq("league_id", league_id)
      )
      .filter((q) => q.eq(q.field("game_day_id"), game_day_id))
      .collect();

    // Get all court rotations for this game day
    const courtRotations = await ctx.db
      .query("court_rotations")
      .withIndex("by_game_day", (q) => q.eq("game_day_id", game_day_id))
      .collect();

    // Get all court assignments for this league and game day
    const courtAssignments = await ctx.db
      .query("court_assignments")
      .withIndex("by_league_and_game_day", (q) =>
        q.eq("league_id", league_id).eq("game_day_id", game_day_id)
      )
      .collect();

    // Build results
    const rankings = [];

    for (const standing of standings) {
      // Get player profile
      const player = await ctx.db.get(standing.player_id);
      if (!player) continue;

      // Find court assignment for substitute name
      const courtAssignment = courtAssignments.find(ca => 
        ca.player_id === standing.player_id || ca.regular_player_id === standing.player_id
      );

      // Build game scores array
      const gameScores: (number | null)[] = [];
      
      // Get all rotations where this player participated
      const playerRotations = courtRotations.filter(cr => 
        cr.team1_player1_id === standing.player_id || 
        cr.team1_player2_id === standing.player_id ||
        cr.team2_player1_id === standing.player_id || 
        cr.team2_player2_id === standing.player_id
      );

      // Sort by game number and extract scores
      const sortedRotations = playerRotations.sort((a, b) => a.game_number - b.game_number);
      
      for (const rotation of sortedRotations) {
        let score: number | null = null;
        
        // Determine which team the player was on and get their score
        if (rotation.team1_player1_id === standing.player_id || 
            rotation.team1_player2_id === standing.player_id) {
          score = rotation.team1_score ?? null;
        } else if (rotation.team2_player1_id === standing.player_id || 
                   rotation.team2_player2_id === standing.player_id) {
          score = rotation.team2_score ?? null;
        }
        
        gameScores.push(score);
      }

      rankings.push({
        player_id: standing.player_id,
        first_name: player.first_name,
        last_name: player.last_name,
        court_number: standing.court_number,
        total_points: standing.total_points,
        games_won: standing.games_won,
        games_played: standing.games_played,
        win_pct: standing.win_pct,
        points_per_game: standing.points_per_game,
        movement: standing.movement,
        substitute_name: courtAssignment?.substitute_name,
        game_scores: gameScores,
      });
    }

    // Sort by court_number ASC, total_points DESC
    rankings.sort((a, b) => {
      if (a.court_number !== b.court_number) {
        return a.court_number - b.court_number;
      }
      return b.total_points - a.total_points;
    });

    return rankings;
  },
}); 

/**
 * Get next week's court assignments based on current standings and player movement
 * Calculates where each player should be assigned for the following game day
 */
export const getNextWeekCourtAssignments = query({
  args: {
    league_id: v.id("leagues"),
    game_day_id: v.id("game_days"),
  },
  returns: v.array(
    v.object({
      next_court_number: v.number(),
      player_id: v.id("profiles"),
      first_name: v.string(),
      last_name: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const { league_id, game_day_id } = args;

    // Get the maximum court number from court assignments
    const courtAssignments = await ctx.db
      .query("court_assignments")
      .withIndex("by_league_and_game_day", (q) =>
        q.eq("league_id", league_id).eq("game_day_id", game_day_id)
      )
      .collect();

    const maxCourt = Math.max(...courtAssignments.map(ca => ca.court_number), 0);

    // Get all standings for this league and game day
    const standings = await ctx.db
      .query("standings")
      .withIndex("by_league_and_player", (q) =>
        q.eq("league_id", league_id)
      )
      .filter((q) => q.eq(q.field("game_day_id"), game_day_id))
      .collect();

    // Build results with next court assignments
    const nextWeekAssignments = [];

    for (const standing of standings) {
      // Get player profile
      const player = await ctx.db.get(standing.player_id);
      if (!player) continue;

      // Calculate next court number based on movement
      let nextCourtNumber = standing.court_number;
      
      if (standing.movement === 'up' && standing.court_number > 1) {
        nextCourtNumber = standing.court_number - 1;
      } else if (standing.movement === 'down' && standing.court_number < maxCourt) {
        nextCourtNumber = standing.court_number + 1;
      }
      // Otherwise, keep the same court number

      nextWeekAssignments.push({
        next_court_number: nextCourtNumber,
        player_id: standing.player_id,
        first_name: player.first_name,
        last_name: player.last_name,
      });
    }

    // Sort by next_court_number ASC, last_name ASC, first_name ASC
    nextWeekAssignments.sort((a, b) => {
      if (a.next_court_number !== b.next_court_number) {
        return a.next_court_number - b.next_court_number;
      }
      if (a.last_name !== b.last_name) {
        return a.last_name.localeCompare(b.last_name);
      }
      return a.first_name.localeCompare(b.first_name);
    });

    return nextWeekAssignments;
  },
}); 

/**
 * Get season rankings with cumulative statistics for each player in a league
 * Returns aggregated stats and rankings based on league win_type (points or wins)
 */
export const getSeasonRankings = query({
  args: {
    league_id: v.id("leagues"),
  },
  returns: v.array(
    v.object({
      player_id: v.id("profiles"),
      first_name: v.string(),
      last_name: v.string(),
      total_points: v.number(),
      total_games_won: v.number(),
      total_games_played: v.number(),
      weeks_played: v.number(),
      weekly_avg_points: v.number(),
      avg_points_per_game: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const { league_id } = args;

    // Get the win_type for this league
    const league = await ctx.db.get(league_id);
    if (!league) {
      throw new ConvexError("League not found");
    }
    const winType = league.win_type;

    // Get all standings for this league
    const standings = await ctx.db
      .query("standings")
      .withIndex("by_league_and_player", (q) =>
        q.eq("league_id", league_id)
      )
      .collect();

    // Group standings by player and calculate aggregates
    const playerStats = new Map<Id<"profiles">, {
      player_id: Id<"profiles">;
      total_points: number;
      total_games_won: number;
      total_games_played: number;
      game_days: Set<string>;
    }>();

    for (const standing of standings) {
      const playerKey = standing.player_id;
      
      if (!playerStats.has(playerKey)) {
        playerStats.set(playerKey, {
          player_id: standing.player_id,
          total_points: 0,
          total_games_won: 0,
          total_games_played: 0,
          game_days: new Set(),
        });
      }

      const stats = playerStats.get(playerKey)!;
      stats.total_points += standing.total_points;
      stats.total_games_won += standing.games_won;
      stats.total_games_played += standing.games_played;
      stats.game_days.add(standing.game_day_id || "");
    }

    // Build results with calculated averages
    const seasonRankings = [];

    for (const [playerId, stats] of playerStats) {
      // Get player profile
      const player = await ctx.db.get(playerId);
      if (!player) continue;

      const weeksPlayed = stats.game_days.size;
      const weeklyAvgPoints = weeksPlayed > 0 ? 
        Math.round((stats.total_points / weeksPlayed) * 100) / 100 : 0;
      const avgPointsPerGame = stats.total_games_played > 0 ? 
        Math.round((stats.total_points / stats.total_games_played) * 100) / 100 : 0;

      seasonRankings.push({
        player_id: stats.player_id,
        first_name: player.first_name,
        last_name: player.last_name,
        total_points: stats.total_points,
        total_games_won: stats.total_games_won,
        total_games_played: stats.total_games_played,
        weeks_played: weeksPlayed,
        weekly_avg_points: weeklyAvgPoints,
        avg_points_per_game: avgPointsPerGame,
      });
    }

    // Sort based on win_type
    seasonRankings.sort((a, b) => {
      if (winType === 'points') {
        // Primary sort by total points, secondary by total wins
        if (a.total_points !== b.total_points) {
          return b.total_points - a.total_points;
        }
        return b.total_games_won - a.total_games_won;
      } else {
        // Primary sort by total wins, secondary by total points
        if (a.total_games_won !== b.total_games_won) {
          return b.total_games_won - a.total_games_won;
        }
        return b.total_points - a.total_points;
      }
    });

    return seasonRankings;
  },
}); 

/**
 * Handle user deletion cleanup
 * Deletes the corresponding profile when a user is deleted
 * This replaces the PostgreSQL trigger functionality
 */
export const handleDeletedUser = mutation({
  args: {
    user_id: v.id("profiles"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const { user_id } = args;

    try {
      // Find the profile to delete
      const profile = await ctx.db.get(user_id);
      
      if (!profile) {
        return {
          success: false,
          message: `Profile not found for user ID: ${user_id}`,
        };
      }

      // Delete the profile
      await ctx.db.delete(user_id);

      console.log(`Successfully deleted profile for user: ${user_id}`);

      return {
        success: true,
        message: `Profile deleted successfully for user: ${user_id}`,
      };
    } catch (error) {
      console.error(`Error deleting profile for user ${user_id}:`, error);
      
      return {
        success: false,
        message: `Failed to delete profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

/**
 * Bulk cleanup function for multiple deleted users
 * Useful for batch operations or data migration
 */
export const handleBulkUserDeletion = mutation({
  args: {
    user_ids: v.array(v.id("profiles")),
  },
  returns: v.object({
    success: v.boolean(),
    deleted_count: v.number(),
    failed_count: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const { user_ids } = args;
    let deletedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const user_id of user_ids) {
      try {
        const profile = await ctx.db.get(user_id);
        
        if (profile) {
          await ctx.db.delete(user_id);
          deletedCount++;
          console.log(`Deleted profile for user: ${user_id}`);
        } else {
          failedCount++;
          errors.push(`Profile not found for user: ${user_id}`);
        }
      } catch (error) {
        failedCount++;
        const errorMessage = `Failed to delete profile for user ${user_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMessage);
        console.error(errorMessage);
      }
    }

    return {
      success: failedCount === 0,
      deleted_count: deletedCount,
      failed_count: failedCount,
      errors,
    };
  },
}); 

/**
 * Handle new user creation
 * Links new user to existing profile or creates new profile
 * This replaces the PostgreSQL trigger functionality
 */
export const handleNewUser = mutation({
  args: {
    user_id: v.id("profiles"),
    email: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    profile_id: v.id("profiles"),
    action: v.union(v.literal("linked"), v.literal("created")),
  }),
  handler: async (ctx, args) => {
    const { user_id, email } = args;

    try {
      // Try to find an existing profile with the same email but no auth_id
      const existingProfile = await ctx.db
        .query("profiles")
        .withIndex("by_email", (q) => q.eq("email", email))
        .filter((q) => q.eq(q.field("auth_id"), null))
        .unique();

      if (existingProfile && !existingProfile.auth_id) {
        // Link existing profile to the new user
        await ctx.db.patch(existingProfile._id, withUpdatedAt({
          auth_id: user_id,
        }));

        console.log(`Linked existing profile ${existingProfile._id} to new user ${user_id}`);

        return {
          success: true,
          message: `Successfully linked existing profile to new user: ${email}`,
          profile_id: existingProfile._id,
          action: "linked" as const,
        };
      } else {
        // Create a new profile for the user
        const newProfileId = await ctx.db.insert("profiles", withUpdatedAt({
          email: email,
          auth_id: user_id,
          first_name: "",
          last_name: "",
          avatar_url: undefined,
          stripe_customer_id: undefined,
          stripe_account_id: undefined,
          dup_rating: undefined,
          role: "player", // Default role
          phone: undefined,
          active: true,
        }));

        console.log(`Created new profile ${newProfileId} for user ${user_id}`);

        return {
          success: true,
          message: `Successfully created new profile for user: ${email}`,
          profile_id: newProfileId,
          action: "created" as const,
        };
      }
    } catch (error) {
      console.error(`Error handling new user ${user_id}:`, error);
      
      return {
        success: false,
        message: `Failed to handle new user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        profile_id: user_id,
        action: "created" as const, // Default fallback
      };
    }
  },
});

/**
 * Bulk user creation handler
 * Useful for batch operations or data migration
 */
export const handleBulkNewUsers = mutation({
  args: {
    users: v.array(
      v.object({
        user_id: v.id("profiles"),
        email: v.string(),
      })
    ),
  },
  returns: v.object({
    success: v.boolean(),
    linked_count: v.number(),
    created_count: v.number(),
    failed_count: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const { users } = args;
    let linkedCount = 0;
    let createdCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        // Try to find an existing profile with the same email but no auth_id
        const existingProfile = await ctx.db
          .query("profiles")
          .withIndex("by_email", (q) => q.eq("email", user.email))
          .filter((q) => q.eq(q.field("auth_id"), null))
          .unique();

        if (existingProfile && !existingProfile.auth_id) {
          // Link existing profile to the new user
          await ctx.db.patch(existingProfile._id, withUpdatedAt({
            auth_id: user.user_id,
          }));
          linkedCount++;
          console.log(`Linked existing profile ${existingProfile._id} to new user ${user.user_id}`);
        } else {
          // Create a new profile for the user
          await ctx.db.insert("profiles", withUpdatedAt({
            email: user.email,
            auth_id: user.user_id,
            first_name: "",
            last_name: "",
            avatar_url: undefined,
            stripe_customer_id: undefined,
            stripe_account_id: undefined,
            dup_rating: undefined,
            role: "player", // Default role
            phone: undefined,
            active: true,
          }));
          createdCount++;
          console.log(`Created new profile for user ${user.user_id}`);
        }
      } catch (error) {
        failedCount++;
        const errorMessage = `Failed to handle new user ${user.user_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMessage);
        console.error(errorMessage);
      }
    }

    return {
      success: failedCount === 0,
      linked_count: linkedCount,
      created_count: createdCount,
      failed_count: failedCount,
      errors,
    };
  },
}); 

/**
 * Generate court rotations for a game day
 * 
 * This function:
 * 1. Fetches court assignments for the given league and game day
 * 2. Groups players by court number
 * 3. Generates team matchups based on predefined partnerships
 * 4. Inserts court rotation records
 * 5. Updates game day status to 'in_progress' if still pending
 */
export const generateRotations = mutation({
  args: {
    leagueId: v.id("leagues"),
    gameDayId: v.id("game_days"),
    gamesPerMatch: v.optional(v.number()), // default to 3
    gamesPerRotation: v.optional(v.number()), // default to 1
    playersPerCourt: v.optional(v.number()), // default to 4
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const {
        leagueId,
        gameDayId,
        gamesPerMatch = 3,
        gamesPerRotation = 1,
        playersPerCourt = 4,
      } = args;

      console.log("Generating rotations with payload:", {
        leagueId,
        gameDayId,
        gamesPerMatch,
        gamesPerRotation,
        playersPerCourt,
      });

      // 1. Fetch all court assignments for this league/game day
      const assignments = await ctx.db
        .query("court_assignments")
        .withIndex("by_league_and_game_day", (q) =>
          q.eq("league_id", leagueId).eq("game_day_id", gameDayId)
        )
        .collect();

      if (!assignments || assignments.length === 0) {
        throw new Error("No court assignments found for this league and game day");
      }

      // Group players by court_number
      const courtMap: Record<number, Array<{
        player_id: Id<"profiles">;
        slot_number: number;
      }>> = {};

      for (const assignment of assignments) {
        if (!courtMap[assignment.court_number]) {
          courtMap[assignment.court_number] = [];
        }
        courtMap[assignment.court_number].push({
          player_id: assignment.player_id,
          slot_number: assignment.slot_number,
        });
      }

      // Partnership definitions for 4 players
      const partnershipDefs = [
        [0, 3, 1, 2], // Team 1: Players 0 & 3, Team 2: Players 1 & 2
        [0, 1, 2, 3], // Team 1: Players 0 & 1, Team 2: Players 2 & 3
        [0, 2, 1, 3], // Team 1: Players 0 & 2, Team 2: Players 1 & 3
      ];

      // 2. For each court, generate games as per the clarified logic
      for (const [courtNumberStr, players] of Object.entries(courtMap)) {
        const courtNumber = Number(courtNumberStr);

        // Clean up old rotations for this court
        const existingRotations = await ctx.db
          .query("court_rotations")
          .withIndex("by_league_and_game_day", (q) =>
            q.eq("league_id", leagueId).eq("game_day_id", gameDayId)
          )
          .filter((q) => q.eq(q.field("court_number"), courtNumber))
          .collect();

        for (const rotation of existingRotations) {
          await ctx.db.delete(rotation._id);
        }

        // Sort by slot_number or fallback to player_id
        players.sort((a, b) => {
          if (a.slot_number !== null && b.slot_number !== null) {
            return a.slot_number - b.slot_number;
          }
          return a.player_id.localeCompare(b.player_id);
        });

        if (players.length === 4) {
          let gameCount = 0;
          let partnershipIdx = 0;
          let rotationNumber = 1;

          while (gameCount < gamesPerMatch) {
            // For each partnership, play gamesPerRotation consecutive games
            for (let i = 0; i < gamesPerRotation && gameCount < gamesPerMatch; i++) {
              const [t1p1, t1p2, t2p1, t2p2] = partnershipDefs[partnershipIdx];

              await ctx.db.insert("court_rotations", {
                league_id: leagueId,
                game_day_id: gameDayId,
                court_number: courtNumber,
                rotation_number: rotationNumber,
                game_number: gameCount + 1,
                team1_player1_id: players[t1p1].player_id,
                team1_player2_id: players[t1p2].player_id,
                team2_player1_id: players[t2p1].player_id,
                team2_player2_id: players[t2p2].player_id,
                team1_score: 0,
                team2_score: 0,
                start_time: "", // Will be set when games start
                end_time: "", // Will be set when games end
              });

              gameCount++;
            }

            // Move to next partnership and rotation
            partnershipIdx = (partnershipIdx + 1) % partnershipDefs.length;
            rotationNumber++;
          }

          console.log(`Generated ${gameCount} games for court ${courtNumber}`);
        } else {
          console.log(`Court ${courtNumber} does not have 4 players (has ${players.length}), skipping rotation generation.`);
        }
      }

      // 3. Set the game day status to 'in_progress' if it is still 'pending'
      const gameDay = await ctx.db.get(gameDayId);
      if (gameDay && gameDay.status === "pending") {
        await ctx.db.patch(gameDayId, {
          status: "in_progress",
        });
        console.log(`Updated game day ${gameDayId} status to 'in_progress'`);
      }

      return {
        success: true,
        message: "Court rotations generated successfully",
      };
    } catch (error) {
      console.error("Error generating rotations:", error);
      throw new ConvexError(
        `Failed to generate rotations: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
}); 

/**
 * Admin function to delete a user (super admin only)
 * 
 * This function:
 * 1. Verifies the current user is a super admin
 * 2. Fetches the user's profile by ID
 * 3. Deletes the profile from the database
 * 4. Note: Auth user deletion would need to be handled via external API call
 * 
 * Note: Convex doesn't have direct auth admin APIs like Supabase, so auth user
 * deletion would need to be implemented as a separate action that calls
 * Supabase's admin API, or handled through your authentication provider's API.
 */
export const adminDeleteUser = mutation({
  args: {
    profileId: v.id("profiles"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    authUserDeleted: v.boolean(),
  }),
  handler: async (ctx, args) => {
    try {
      const { profileId } = args;

      // Step 1: Authenticate the current user
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new ConvexError("Not authenticated");
      }

      const userId = identity.subject;

      // Step 2: Check if the current user is a super admin
      const superAdmin = await ctx.db
        .query("super_admins")
        .filter((q) => q.eq(q.field("_id"), userId))
        .first();

      if (!superAdmin) {
        throw new ConvexError("Not authorized - super admin access required");
      }

      console.log(`Super admin ${userId} attempting to delete profile ${profileId}`);

      // Step 3: Get the profile to find the user's email
      const profile = await ctx.db.get(profileId);
      if (!profile) {
        throw new ConvexError(`Profile not found with ID ${profileId}`);
      }

      const userEmail = profile.email;
      console.log(`Found profile for email: ${userEmail}`);

      // Step 4: Delete the profile record
      await ctx.db.delete(profileId);
      console.log(`Deleted profile ${profileId}`);

      // Step 5: Note about auth user deletion
      // Since Convex doesn't have direct auth admin APIs, we would need to:
      // 1. Create a separate action that calls Supabase's admin API
      // 2. Or handle auth user deletion through your auth provider's API
      // 3. Or implement this as a scheduled cleanup task
      
      console.log(`Profile ${profileId} deleted successfully. Auth user deletion would need to be handled separately.`);

      return {
        success: true,
        message: `User with profile ${profileId} cleaned up from database. Auth user deletion requires external API call.`,
        authUserDeleted: false, // Would be true if auth deletion was implemented
      };

    } catch (error) {
      console.error(`Error in adminDeleteUser: ${error instanceof Error ? error.message : "Unknown error"}`);
      
      if (error instanceof ConvexError) {
        throw error; // Re-throw ConvexError as-is
      }
      
      throw new ConvexError(
        `Failed to delete user: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});

 