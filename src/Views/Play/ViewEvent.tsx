import React, { useEffect, useState, useMemo } from 'react';
import EventJoinButton from '../../components/Events/EventJoinButton';
import EventQRCode from '../../components/Events/EventQRCode';
import EventPlayerList from '../../components/Events/EventPlayerList';
import EventMatchScoring from '../../components/Events/EventMatchScoring';
import EventDetailsSection from '../../components/Events/EventDetailsSection';
import { format, parse, parseISO } from 'date-fns';

interface Event {
  _id: string;
  name: string;
  location: string;
  start_date: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  access_mode: string;
  total_players: number;
  max_players?: number;
  dupr_min?: number;
  dupr_max?: number;
  gender_type: string;
  games_per_match: number;
  points_to_win: number;
  win_by_margin: number;
  courts: number;
  court_meta?: Record<number, string>;
  created_by: string;
  event_type: string;
  finalized?: boolean;
}

interface Player {
  _id: string;
  rsvp_status: string;
  first_name: string;
  last_name: string;
  email: string;
  invite_token?: string;
}

interface Match {
  _id: string;
  event_id: string;
  round_number: number;
  court_number: number;
  team1_id: string;
  team2_id: string;
  team1_score?: number;
  team2_score?: number;
}

interface ViewEventProps {
  eventId: string;
  event: Event | null;
  players: Player[];
  matches: Match[];
  playerMap: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  joined: boolean;
  isOwner: boolean;
  currentUserId?: string;
  profileId?: string;
  inviteToken?: string | null;
  inviteError?: string | null;
  inviteSuccess?: string | null;
  waitlisted: boolean;
  waitlistUsers: any[];
  onJoinEvent: () => Promise<void>;
  onDeclineEvent: () => Promise<void>;
  onAddToWaitlist: () => Promise<void>;
  onSaveEventSettings: (updated: any) => Promise<void>;
  onStartGame: (startType: 'singles' | 'doubles') => Promise<void>;
  onReset: () => Promise<void>;
  onRegenerate: () => Promise<void>;
  onAddRound: () => Promise<void>;
  onScoreUpdate: (matchId: string, team1Score: number, team2Score: number) => Promise<void>;
  onFinalizeGames: () => Promise<void>;
  onNavigate?: (path: string) => void;
}

function generateRoundRobinTeams(players: any[], teamSize: number) {
  // For doubles, group into teams of 2 (fixed partners)
  if (teamSize === 2) {
    const teams = [];
    for (let i = 0; i < players.length; i += 2) {
      if (i + 1 < players.length) {
        teams.push([players[i], players[i + 1]]);
      } else {
        // Odd player out, make a team of 1
        teams.push([players[i]]);
      }
    }
    return teams;
  }
  // For singles, each player is a team
  return players.map((p) => [p]);
}

function generateRoundRobinSchedule(teams: any[], startRound = 1) {
  const n = teams.length;
  const rounds = n % 2 === 0 ? n - 1 : n;
  const teamsCopy = [...teams];
  if (n % 2 === 1) teamsCopy.push(null);
  const schedule: { round: number; matches: [any, any][] }[] = [];
  for (let round = 0; round < rounds; round++) {
    const matches: [any, any][] = [];
    for (let i = 0; i < teamsCopy.length / 2; i++) {
      const team1 = teamsCopy[i];
      const team2 = teamsCopy[teamsCopy.length - 1 - i];
      if (team1 && team2) matches.push([team1, team2]);
    }
    schedule.push({ round: startRound + round, matches });
    teamsCopy.splice(1, 0, teamsCopy.pop());
  }
  return schedule;
}

// Helper to format event date and time
function formatEventDateTime(dateStr: string, startTime?: string, endTime?: string) {
  if (!dateStr) return '';
  let dateObj: Date;
  // Try parsing as ISO, fallback to Y-M-D
  try {
    dateObj = parseISO(dateStr);
    if (isNaN(dateObj.getTime())) {
      dateObj = parse(dateStr, 'yyyy-MM-dd', new Date());
    }
  } catch {
    dateObj = parse(dateStr, 'yyyy-MM-dd', new Date());
  }
  const datePart = format(dateObj, 'MMMM do, yyyy');
  // Format times if present
  if (startTime && endTime) {
    // Accept both '18:30' and '6:30 PM' etc.
    const parseTime = (t: string) => {
      if (/\d{1,2}:\d{2}\s*[APMapm]{0,2}/.test(t)) {
        // e.g. '6:30 PM' or '18:30'
        const d = new Date(dateObj);
        const [h, m] = t.split(/:| /);
        let hour = parseInt(h, 10);
        let minute = parseInt(m, 10);
        if (/pm/i.test(t) && hour < 12) hour += 12;
        if (/am/i.test(t) && hour === 12) hour = 0;
        d.setHours(hour, minute, 0, 0);
        return d;
      }
      return null;
    };
    const s = parseTime(startTime);
    const e = parseTime(endTime);
    if (s && e) {
      return `${datePart} - ${format(s, 'h:mma').replace(':00', '')}-${format(e, 'h:mma').replace(':00', '')}`.toLowerCase();
    }
  }
  return datePart;
}

const ViewEvent: React.FC<ViewEventProps> = ({
  eventId,
  event,
  players,
  matches,
  playerMap,
  isLoading,
  error,
  joined,
  isOwner,
  currentUserId,
  profileId,
  inviteToken,
  inviteError,
  inviteSuccess,
  waitlisted,
  waitlistUsers,
  onJoinEvent,
  onDeclineEvent,
  onAddToWaitlist,
  onSaveEventSettings,
  onStartGame,
  onReset,
  onRegenerate,
  onAddRound,
  onScoreUpdate,
  onFinalizeGames,
  onNavigate
}) => {
  const [showStart, setShowStart] = useState(false);
  const [startType, setStartType] = useState<'singles' | 'doubles'>('doubles');
  const [starting, setStarting] = useState(false);
  const [fetchingMatches, setFetchingMatches] = useState(false);
  const [scoreEdits, setScoreEdits] = useState<Record<string, { team1: number; team2: number; editing: boolean }>>({});
  const [resetting, setResetting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [addingRound, setAddingRound] = useState(false);
  const [editScoring, setEditScoring] = useState(false);
  const [pointsToWin, setPointsToWin] = useState<number | null>(null);
  const [winByMargin, setWinByMargin] = useState<number | null>(null);
  const [savingScoring, setSavingScoring] = useState(false);
  const [scoringMsg, setScoringMsg] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventMsg, setEventMsg] = useState<string | null>(null);
  const [finalized, setFinalized] = useState(event?.finalized || false);

  // Group matches by round (move this up here)
  const matchesByRound: Record<string, any[]> = {};
  for (const m of matches) {
    const roundKey = String(m.round_number);
    if (!matchesByRound[roundKey]) matchesByRound[roundKey] = [];
    matchesByRound[roundKey].push(m);
  }
  const allRounds: string[] = Object.keys(matchesByRound);

  // Standings calculation (teams by total wins)
  const teamWinCounts: Record<string, { wins: number; matches: any[] }> = {};
  matches.forEach((m) => {
    // Only count matches with a winner
    if (typeof m.team1_score === 'number' && typeof m.team2_score === 'number' && m.team1_score !== m.team2_score) {
      const winner = m.team1_score > m.team2_score ? m.team1_id : m.team2_id;
      if (!teamWinCounts[winner]) teamWinCounts[winner] = { wins: 0, matches: [] };
      teamWinCounts[winner].wins += 1;
      teamWinCounts[winner].matches.push(m);
    }
    // Ensure all teams are present
    if (!teamWinCounts[m.team1_id]) teamWinCounts[m.team1_id] = { wins: 0, matches: [] };
    if (!teamWinCounts[m.team2_id]) teamWinCounts[m.team2_id] = { wins: 0, matches: [] };
  });
  const [standingsSort, setStandingsSort] = useState<'wins' | 'points'>('wins');
  const standings = useMemo(() => {
    let arr = Object.entries(teamWinCounts).map(([teamId, data]) => {
      // Calculate total points for the team
      const points = data.matches.reduce((sum, m) => {
        if (m.team1_id === teamId) return sum + (m.team1_score || 0);
        if (m.team2_id === teamId) return sum + (m.team2_score || 0);
        return sum;
      }, 0);
      return { teamId, ...data, points };
    });
    if (standingsSort === 'wins') {
      arr.sort((a, b) => b.wins - a.wins);
    } else {
      arr.sort((a, b) => b.points - a.points);
    }
    return arr;
  }, [teamWinCounts, standingsSort]);

  // Mapping for event type display names
  const eventTypeLabels: Record<string, string> = {
    'round_robin_set': 'Round Robin: Set Partners',
    'round_robin': 'Round Robin: Rotating Partners',
    'king_of_the_court': 'King of the Court',
    'social': 'Social Play',
    // Add more as needed
  };
  const eventTypeTitle = eventTypeLabels[event?.event_type] || event?.event_type || '';

  useEffect(() => {
    if (event) {
      setPointsToWin(event.points_to_win ?? 11);
      setWinByMargin(event.win_by_margin ?? 2);
    }
  }, [event]);

  if (isLoading) return <div className="p-8 text-white">Loading event...</div>;
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;
  if (!event) return <div className="p-8 text-white">Event not found.</div>;

  // Now it's safe to access event properties:
  const joinCode = event.join_code || event._id;
  const maxPlayers = event.max_players || event.total_players;
  const ownerId = event.created_by;
  const enoughForSingles = players.length >= 2;
  const enoughForDoubles = players.length >= 4;
  const canStart = (startType === 'singles' && enoughForSingles) || (startType === 'doubles' && enoughForDoubles);
  // Helper: is user a player?
  const isPlayer = players.some(p => currentUserId && p._id === currentUserId);
  // Helper: is event full?
  const acceptedCount = players.filter(p => p.rsvp_status === 'accepted').length;
  const eventIsFull = maxPlayers && acceptedCount >= maxPlayers;

  // Prepare invited player IDs for QR/Share logic
  const invitedPlayerIds = players.map(p => p._id);
  // For private events, generate joinUrl with inviteToken if user has one
  let joinUrl = `${window.location.origin}/play/event/${event._id}`;
  if (event?.access_mode === 'private' && currentUserId) {
    const myPlayer = players.find(p => p._id === currentUserId);
    if (myPlayer && myPlayer.invite_token) {
      joinUrl = `${window.location.origin}/play/event/${event._id}?inviteToken=${myPlayer.invite_token}`;
    }
  }

  let joinSection = null;
  if (currentUserId && !isPlayer) {
    if (eventIsFull) {
      joinSection = waitlisted ? (
        <span className="inline-block bg-yellow-700 text-yellow-200 px-3 py-2 rounded">Waitlisted</span>
      ) : (
        <button
          className="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700"
          onClick={onAddToWaitlist}
        >
          Add to Waitlist
        </button>
      );
    } else {
      joinSection = (
        <>
          <button
            className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 mr-2"
            onClick={onJoinEvent}
          >
            Join Event
          </button>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            onClick={onDeclineEvent}
          >
            Decline
          </button>
        </>
      );
    }
  }

  // Helper to render team names
  const renderTeam = (teamId: string) => {
    return teamId
      .split(',')
      .map((pid) => playerMap[pid] || pid)
      .join(' & ');
  };

  // Helper to get court name
  const getCourtName = (courtNumber: number) => {
    if (event?.court_meta && typeof event.court_meta === 'object') {
      return event.court_meta[courtNumber] || `Court ${courtNumber}`;
    }
    if (event?.court_details && typeof event.court_details === 'object') {
      return event.court_details[courtNumber] || `Court ${courtNumber}`;
    }
    return `Court ${courtNumber}`;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Error/Success messages for invite edge cases */}
      {inviteError && !isPlayer && !inviteToken && <div className="p-4 mb-4 bg-red-900 text-red-200 rounded">{inviteError}</div>}
      {inviteSuccess && <div className="p-4 mb-4 bg-green-900 text-green-200 rounded">{inviteSuccess}</div>}
      {/* Event Type Title */}
      {eventTypeTitle && (
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-teal-400 tracking-tight drop-shadow-lg">{eventTypeTitle}</h1>
        </div>
      )}
      {/* Event Overview Card */}
      <div className="bg-gray-900 rounded-lg p-6 shadow-md mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1 text-white">{event.name}</h1>
            <div className="text-lg font-bold text-white mb-1 capitalize">{formatEventDateTime(event.start_date, event.start_time, event.end_time)}</div>
            <div className="text-lg font-bold text-white mb-1">{event.location}</div>
            {isOwner && <span className="inline-block bg-blue-600 text-xs px-2 py-1 rounded">Owner</span>}
          </div>
          <div className="flex flex-col items-center gap-2">
            <EventQRCode
              eventId={event._id}
              accessMode={event.access_mode}
              ownerId={ownerId}
              userId={currentUserId || null}
              invitedPlayerIds={invitedPlayerIds}
              joinUrl={joinUrl}
            />
            <div className="flex justify-center my-4">{joinSection}</div>
          </div>
        </div>
      </div>

      {/* Game Description */}
      <div className="bg-gray-900 rounded-lg p-4 mb-4">
        <div className="font-bold text-2xl text-white mb-1">Game Description</div>
        <div className="bg-gray-800 rounded p-3 min-h-[48px] text-white">{event.description || <span className="text-gray-500">No description</span>}</div>
      </div>

      {/* Event Details (collapsible, under description) */}
      <details className="bg-gray-900 rounded-lg p-4 mb-4" open={Boolean(currentUserId && currentUserId === ownerId)}>
        <summary className="cursor-pointer px-2 py-1 font-bold text-2xl text-white select-none">Event Details & Settings</summary>
        <div className="mt-4">
          <EventDetailsSection
            event={event}
            isOwner={Boolean(currentUserId && currentUserId === ownerId)}
            onSave={onSaveEventSettings}
          />
        </div>
        {eventMsg && <div className={eventMsg.startsWith('Error') ? 'text-red-500' : 'text-green-500'}>{eventMsg}</div>}
      </details>

      {/* Player List (collapsible) */}
      <details className="bg-gray-900 rounded-lg p-4 mb-4" open={false}>
        <summary className="cursor-pointer px-2 py-1 font-bold text-2xl text-white select-none">
          Player List <span className="ml-2 text-white">{acceptedCount}/{maxPlayers}</span>
        </summary>
        <div className="mt-4">
          <EventPlayerList 
            players={players}
            isLoading={false}
            error={null}
            onRSVP={() => {}}
            onReinvite={() => {}}
            currentUserId={currentUserId}
            isOwner={isOwner}
          />
        </div>
      </details>

      {/* Schedule & Scoring (collapsible) */}
      <details className="bg-gray-900 rounded-lg p-4 mb-4" open={false}>
        <summary className="cursor-pointer px-2 py-1 font-bold text-2xl text-white select-none">Schedule & Scoring</summary>
        <div className="mt-4">
          {currentUserId && currentUserId === ownerId && !finalized && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                onClick={() => setShowStart((v) => !v)}
              >
                {showStart ? 'Cancel' : 'Start Game'}
              </button>
              <button
                className="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700"
                onClick={onReset}
                disabled={resetting}
              >
                Reset Schedule
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={onRegenerate}
                disabled={regenerating}
              >
                Regenerate Schedule
              </button>
              <button
                className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700"
                onClick={onAddRound}
                disabled={addingRound}
              >
                Add Another Round
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={onFinalizeGames}
                disabled={finalized}
              >
                Finalize Games
              </button>
            </div>
          )}
          {finalized && (
            <div className="mb-6 bg-green-900 text-green-200 p-4 rounded text-center font-bold text-lg">
              Games are finalized. No further changes can be made.
            </div>
          )}
          {showStart && currentUserId && currentUserId === ownerId && !finalized && (
            <div className="mb-6 bg-gray-800 p-4 rounded">
              <div className="mb-2">
                <label className="mr-4 text-white">
                  <input
                    type="radio"
                    name="startType"
                    value="singles"
                    checked={startType === 'singles'}
                    onChange={() => setStartType('singles')}
                  />{' '}
                  Singles
                </label>
                <label className="text-white">
                  <input
                    type="radio"
                    name="startType"
                    value="doubles"
                    checked={startType === 'doubles'}
                    onChange={() => setStartType('doubles')}
                  />{' '}
                  Doubles
                </label>
              </div>
              <button
                className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700"
                onClick={() => onStartGame(startType)}
                disabled={starting || !canStart}
              >
                {starting ? 'Generating...' : 'Generate Round Robin Schedule'}
              </button>
              {!canStart && (
                <div className="text-yellow-400 mt-2 text-sm">
                  Not enough players for {startType}.
                </div>
              )}
            </div>
          )}
          {fetchingMatches ? (
            <div className="text-gray-400">Loading schedule...</div>
          ) : matches.length === 0 ? (
            <div className="text-gray-400">No schedule or scoring data available.</div>
          ) : (
            <>
              {allRounds.length > 1 && (
                <div className="mb-4">
                  <label htmlFor="round-select" className="mr-2 font-semibold text-white">Select Round:</label>
                  <select
                    id="round-select"
                    className="rounded bg-gray-800 text-white border border-gray-700 px-3 py-2"
                    value={selectedRound || allRounds[0]}
                    onChange={e => setSelectedRound(e.target.value)}
                  >
                    {allRounds.map(r => (
                      <option key={r} value={r}>Round {r}</option>
                    ))}
                  </select>
                </div>
              )}
              {(selectedRound ? [selectedRound] : allRounds).map((round) => {
                const ms: any[] = matchesByRound[round] || [];
                // Group matches by court for this round
                const matchesByCourt: Record<number, any[]> = {};
                ms.forEach((m: any) => {
                  if (!matchesByCourt[m.court_number]) matchesByCourt[m.court_number] = [];
                  matchesByCourt[m.court_number].push(m);
                });
                return (
                  <div key={round} className="mb-6">
                    <div className="font-semibold mb-2 text-white">Round {round}</div>
                    <div className="space-y-6">
                      {Object.entries(matchesByCourt).map(([courtNum, courtMatches]) => (
                        <EventMatchScoring
                          key={courtNum}
                          matches={courtMatches}
                          courtName={getCourtName(Number(courtNum))}
                          onScoreUpdate={onScoreUpdate}
                          userId={currentUserId || ''}
                          event={event}
                          playerMap={playerMap}
                          isFinalized={finalized || event?.finalized}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </details>

      {/* Standings (collapsible, sortable, now below schedule) */}
      <details className="bg-gray-900 rounded-lg p-4 mb-4" open={false}>
        <summary className="cursor-pointer px-2 py-1 font-bold text-2xl text-white select-none">Standings</summary>
        <div className="mt-4 overflow-x-auto">
          <div className="mb-2 flex gap-4 items-center" style={{ minHeight: '2.5rem' }}>
            <span className="text-white font-semibold">Sort by:</span>
            <button
              className={`px-3 py-1 rounded ${standingsSort === 'wins' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setStandingsSort('wins')}
            >
              Wins
            </button>
            <button
              className={`px-3 py-1 rounded ${standingsSort === 'points' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setStandingsSort('points')}
            >
              Points
            </button>
          </div>
          <table className="min-w-full bg-gray-900 rounded-lg">
            <thead>
              <tr className="text-gray-300">
                <th className="px-4 py-2 text-left w-16">Rank</th>
                <th className="px-4 py-2 text-left">Team</th>
                <th className="px-4 py-2 text-right w-20 cursor-pointer" onClick={() => setStandingsSort('wins')}>Wins</th>
                <th className="px-4 py-2 text-right w-24 cursor-pointer" onClick={() => setStandingsSort('points')}>Points</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, idx) => (
                <tr key={row.teamId} className="border-b border-gray-800">
                  <td className="px-4 py-3 text-white text-right w-16 align-middle">{idx + 1}</td>
                  <td className="px-4 py-3 text-white text-left align-middle">{renderTeam(row.teamId)}</td>
                  <td className="px-4 py-3 text-white text-right w-20 align-middle">{row.wins}</td>
                  <td className="px-4 py-3 text-white text-right w-24 align-middle">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* Waitlist (collapsible) */}
      {isOwner && waitlistUsers.length > 0 && (
        <details className="bg-gray-900 rounded-lg p-4 mb-4" open={false}>
          <summary className="cursor-pointer px-2 py-1 font-bold text-2xl text-white select-none">Waitlist</summary>
          <div className="mt-4">
            <div className="font-bold text-white mb-2">Waitlist</div>
            <ul className="list-disc ml-6 text-white">
              {waitlistUsers.map((u, idx) => (
                <li key={u.player_id}>
                  {playerMap[u.player_id] || u.player_id} {idx === 0 && <span className="text-xs text-yellow-400">(next up)</span>}
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </div>
  );
};

export default ViewEvent; 