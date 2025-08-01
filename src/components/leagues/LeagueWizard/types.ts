export interface CourtMovementRule {
  courtNumber: number;
  moveUp: number;
  moveDown: number;
  displayName: string;
}

export interface Team {
  name: string;
  players: string[];
}

export interface LeagueFormData {
  name: string;
  description: string;
  location: string;
  access_mode: 'open' | 'invite' | 'paid';
  match_type: 'singles' | 'doubles' | null;
  play_day: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  gender_type: 'Men' | 'Women' | 'Mixed' | null;
  total_players: number;
  cost?: number;
  allow_substitutes: boolean;
  win_type: 'wins' | 'points' | null;
  points_to_win: number;
  win_by_margin: number;
  games_per_match: number;
  games_per_rotation: number;
  players_per_court: number;
  court_movement_rules: CourtMovementRule[];
  club_id?: string;
  courts: number;
  teams?: Team[];
} 