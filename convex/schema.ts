import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles and authentication
  profiles: defineTable({
    email: v.string(),
    first_name: v.string(),
    last_name: v.string(),
    avatar_url: v.optional(v.string()),
    stripe_customer_id: v.optional(v.string()),
    stripe_account_id: v.optional(v.string()),
    dup_rating: v.optional(v.number()),
    role: v.string(),
    phone: v.optional(v.string()),
    active: v.boolean(),
    auth_id: v.id("profiles"),
    updated_at: v.optional(v.string()), // ISO string timestamp
  })
    .index("by_email", ["email"])
    .index("by_auth_id", ["auth_id"])
    .index("by_stripe_customer", ["stripe_customer_id"]),

  public_profiles: defineTable({
    first_name: v.string(),
    last_name: v.string(),
    avatar_url: v.optional(v.string()),
    dup_rating: v.optional(v.number()),
  }).index("by_name", ["first_name", "last_name"]),

  super_admins: defineTable({
    first_name: v.string(),
    last_name: v.string(),
  }).index("by_name", ["first_name", "last_name"]),

  // Clubs and organizations
  clubs: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    created_by: v.id("profiles"),
    admins: v.array(v.id("profiles")),
    updated_at: v.optional(v.string()), // ISO string timestamp
  })
    .index("by_name", ["name"])
    .index("by_created_by", ["created_by"]),

  // Leagues
  leagues: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    club_id: v.id("clubs"),
    created_by: v.id("profiles"),
    players: v.array(v.id("profiles")),
    substitutes: v.array(v.id("profiles")),
    start_date: v.string(), // date as string
    end_date: v.string(), // date as string
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
    updated_at: v.optional(v.string()), // ISO string timestamp
  })
    .index("by_club", ["club_id"])
    .index("by_created_by", ["created_by"])
    .index("by_date_range", ["start_date", "end_date"])
    .index("by_finalized", ["finalized"]),

  // League players
  league_players: defineTable({
    league_id: v.id("leagues"),
    player_id: v.id("profiles"),
    status: v.string(),
    invited_at: v.optional(v.number()),
    joined_at: v.optional(v.number()),
    invite_token: v.optional(v.string()),
    invite_expires_at: v.optional(v.number()),
  })
    .index("by_league", ["league_id"])
    .index("by_player", ["player_id"])
    .index("by_league_and_player", ["league_id", "player_id"])
    .index("by_status", ["status"])
    .index("by_invite_token", ["invite_token"]),

  // Game days
  game_days: defineTable({
    league_id: v.id("leagues"),
    date: v.string(), // date as string
    start_time: v.string(),
    end_time: v.string(),
    status: v.string(),
    is_finalized: v.boolean(),
    start_datetime_utc: v.string(),
    end_datetime_utc: v.string(),
    updated_at: v.optional(v.string()), // ISO string timestamp
  })
    .index("by_league", ["league_id"])
    .index("by_date", ["date"])
    .index("by_league_and_date", ["league_id", "date"])
    .index("by_status", ["status"])
    .index("by_finalized", ["is_finalized"]),

  // Court configurations
  court_configurations: defineTable({
    league_id: v.id("leagues"),
    court_number: v.number(),
    display_name: v.string(),
    players_moving_up: v.number(),
    players_moving_down: v.number(),
    players_count: v.number(),
  })
    .index("by_league", ["league_id"])
    .index("by_league_and_court", ["league_id", "court_number"]),

  // Court movement rules
  court_movement_rules: defineTable({
    league_id: v.id("leagues"),
    court_number: v.number(),
    move_up: v.number(),
    move_down: v.number(),
    display_name: v.string(),
  })
    .index("by_league", ["league_id"])
    .index("by_league_and_court", ["league_id", "court_number"]),

  // Game day attendance
  game_day_attendance: defineTable({
    league_id: v.id("leagues"),
    game_day_id: v.id("game_days"),
    player_id: v.id("profiles"),
    is_present: v.boolean(),
    date: v.string(), // date as string
  })
    .index("by_league", ["league_id"])
    .index("by_game_day", ["game_day_id"])
    .index("by_player", ["player_id"])
    .index("by_league_and_date", ["league_id", "date"])
    .index("by_league_and_player", ["league_id", "player_id"]),

  // Court assignments
  court_assignments: defineTable({
    league_id: v.id("leagues"),
    game_day_id: v.id("game_days"),
    court_number: v.number(),
    player_id: v.id("profiles"),
    slot_number: v.number(),
    substitute_name: v.optional(v.string()),
    regular_player_id: v.optional(v.id("profiles")),
    is_substitute: v.boolean(),
  })
    .index("by_league", ["league_id"])
    .index("by_game_day", ["game_day_id"])
    .index("by_court", ["court_number"])
    .index("by_player", ["player_id"])
    .index("by_league_and_game_day", ["league_id", "game_day_id"])
    .index("by_game_day_and_court", ["game_day_id", "court_number"]),

  // Court rotations
  court_rotations: defineTable({
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
    .index("by_league", ["league_id"])
    .index("by_game_day", ["game_day_id"])
    .index("by_court", ["court_number"])
    .index("by_league_and_game_day", ["league_id", "game_day_id"])
    .index("by_game_day_and_court", ["game_day_id", "court_number"])
    .index("by_rotation", ["rotation_number"]),

  // Matches
  matches: defineTable({
    league_id: v.id("leagues"),
    game_day_id: v.id("game_days"),
    court_number: v.number(),
    team1_score: v.optional(v.number()),
    team2_score: v.optional(v.number()),
    team1_player1_id: v.optional(v.id("profiles")),
    team1_player2_id: v.optional(v.id("profiles")),
    team2_player1_id: v.optional(v.id("profiles")),
    team2_player2_id: v.optional(v.id("profiles")),
  })
    .index("by_league", ["league_id"])
    .index("by_game_day", ["game_day_id"])
    .index("by_court", ["court_number"])
    .index("by_league_and_game_day", ["league_id", "game_day_id"])
    .index("by_game_day_and_court", ["game_day_id", "court_number"]),

  // Standings
  standings: defineTable({
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
    .index("by_league", ["league_id"])
    .index("by_player", ["player_id"])
    .index("by_league_and_player", ["league_id", "player_id"])
    .index("by_game_day", ["game_day_id"])
    .index("by_court", ["court_number"])
    .index("by_league_and_court", ["league_id", "court_number"])
    .index("by_rank", ["court_rank"]),

  // Events
  events: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    club_id: v.id("clubs"),
    created_by: v.id("profiles"),
    players: v.array(v.id("profiles")),
    substitutes: v.array(v.id("profiles")),
    start_date: v.string(), // date as string
    end_date: v.string(), // date as string
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
  })
    .index("by_club", ["club_id"])
    .index("by_created_by", ["created_by"])
    .index("by_date_range", ["start_date", "end_date"])
    .index("by_finalized", ["finalized"])
    .index("by_event_type", ["event_type"]),

  // Event players
  event_players: defineTable({
    event_id: v.id("events"),
    player_id: v.id("profiles"),
    role: v.string(),
    status: v.string(),
    rsvp_status: v.string(),
    invite_token: v.optional(v.string()),
    invited_at: v.optional(v.number()),
  })
    .index("by_event", ["event_id"])
    .index("by_player", ["player_id"])
    .index("by_event_and_player", ["event_id", "player_id"])
    .index("by_status", ["status"])
    .index("by_rsvp_status", ["rsvp_status"])
    .index("by_invite_token", ["invite_token"]),

  // Event matches
  event_matches: defineTable({
    event_id: v.id("events"),
    round_number: v.number(),
    court_number: v.number(),
    team1_id: v.string(),
    team2_id: v.string(),
    team1_score: v.optional(v.number()),
    team2_score: v.optional(v.number()),
    start_time: v.optional(v.number()),
    end_time: v.optional(v.number()),
  })
    .index("by_event", ["event_id"])
    .index("by_round", ["round_number"])
    .index("by_court", ["court_number"])
    .index("by_event_and_round", ["event_id", "round_number"])
    .index("by_event_and_court", ["event_id", "court_number"]),

  // Event waitlist
  event_waitlist: defineTable({
    event_id: v.id("events"),
    player_id: v.id("profiles"),
  })
    .index("by_event", ["event_id"])
    .index("by_player", ["player_id"])
    .index("by_event_and_player", ["event_id", "player_id"]),

  // Teams
  teams: defineTable({
    league_id: v.id("leagues"),
    name: v.string(),
  })
    .index("by_league", ["league_id"])
    .index("by_name", ["name"]),

  // Team members
  team_members: defineTable({
    team_id: v.id("teams"),
    player_id: v.id("profiles"),
  })
    .index("by_team", ["team_id"])
    .index("by_player", ["player_id"])
    .index("by_team_and_player", ["team_id", "player_id"]),

  // Announcements
  announcements: defineTable({
    title: v.string(),
    message: v.string(),
    created_by: v.id("profiles"),
    league_id: v.optional(v.id("leagues")),
    target_role: v.string(),
    is_global: v.boolean(),
    pinned: v.boolean(),
    expires_at: v.optional(v.number()),
    target_user_id: v.optional(v.id("profiles")),
  })
    .index("by_league", ["league_id"])
    .index("by_created_by", ["created_by"])
    .index("by_target_role", ["target_role"])
    .index("by_is_global", ["is_global"])
    .index("by_pinned", ["pinned"])
    .index("by_expires_at", ["expires_at"])
    .index("by_target_user", ["target_user_id"]),

  // Announcement reads
  announcement_reads: defineTable({
    announcement_id: v.id("announcements"),
    read_at: v.number(),
    user_email: v.string(),
    status: v.string(),
  })
    .index("by_announcement", ["announcement_id"])
    .index("by_user_email", ["user_email"])
    .index("by_announcement_and_user", ["announcement_id", "user_email"])
    .index("by_status", ["status"]),

  // Payments
  payments: defineTable({
    club_id: v.id("clubs"),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    stripe_payment_id: v.string(),
  })
    .index("by_club", ["club_id"])
    .index("by_status", ["status"])
    .index("by_stripe_payment", ["stripe_payment_id"]),
});
