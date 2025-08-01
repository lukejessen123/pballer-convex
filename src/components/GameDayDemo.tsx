import React, { useState } from "react";
import { 
  useAssignmentsForGameDay, 
  useUpdateGameDayStatus, 
  useGameDay,
  usePlayers,
  useMarkAttendance,
  useCourtConfigurations,
  useUpdateCourtSize,
  useFinalizeGameDay,
  useCourtRotations,
  useSaveCourtAssignments,
  useFetchCourtAssignments
} from "../services/gameDayService";
import { 
  useStandings, 
  useCourtAssignments,
  useMarkPlayerAbsent,
  useUpdateCourtSize as useUpdateStandingsCourtSize,
  useRefreshCourtAssignments as useRefreshStandingsCourtAssignments,
  useFinalizeGameDay as useFinalizeStandingsGameDay
} from "../services/standingsService";
import { Id } from "../../convex/_generated/dataModel";

export const GameDayDemo: React.FC = () => {
  const [selectedGameDayId, setSelectedGameDayId] = useState<Id<"game_days"> | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<Id<"leagues"> | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [courtNumber, setCourtNumber] = useState<number>(1);
  const [playersCount, setPlayersCount] = useState<number>(4);

  // Game Day hooks
  const assignments = useAssignmentsForGameDay(selectedGameDayId!);
  const gameDay = useGameDay(selectedGameDayId!);
  const players = usePlayers(selectedLeagueId!);
  const courtConfigs = useCourtConfigurations(selectedLeagueId!);
  const courtRotations = useCourtRotations(selectedLeagueId!, selectedGameDayId!, courtNumber);
  const courtAssignments = useFetchCourtAssignments(selectedLeagueId || undefined, selectedGameDayId || undefined);

  // Standings hooks
  const standings = useStandings(selectedLeagueId!);
  const standingsCourtAssignments = useCourtAssignments(selectedLeagueId!);

  // Mutation hooks
  const updateGameDayStatus = useUpdateGameDayStatus();
  const markAttendance = useMarkAttendance();
  const updateCourtSize = useUpdateCourtSize();
  const finalizeGameDay = useFinalizeGameDay();
  const saveCourtAssignments = useSaveCourtAssignments();
  const markPlayerAbsent = useMarkPlayerAbsent();
  const updateStandingsCourtSize = useUpdateStandingsCourtSize();
  const refreshCourtAssignments = useRefreshStandingsCourtAssignments();
  const finalizeStandingsGameDay = useFinalizeStandingsGameDay();

  const handleUpdateStatus = async () => {
    if (!selectedGameDayId || !newStatus) return;
    try {
      await updateGameDayStatus({ gameDayId: selectedGameDayId, status: newStatus });
      setNewStatus("");
      alert("Game day status updated successfully!");
    } catch (error) {
      console.error("Error updating game day status:", error);
      alert("Failed to update game day status");
    }
  };

  const handleUpdateCourtSize = async () => {
    if (!selectedLeagueId) return;
    try {
      await updateCourtSize({ 
        leagueId: selectedLeagueId, 
        courtNumber, 
        playersCount, 
        displayName: `Court ${courtNumber}` 
      });
      alert("Court size updated successfully!");
    } catch (error) {
      console.error("Error updating court size:", error);
      alert("Failed to update court size");
    }
  };

  const handleFinalizeGameDay = async () => {
    if (!selectedLeagueId || !selectedGameDayId) return;
    try {
      await finalizeGameDay({ leagueId: selectedLeagueId, gameDayId: selectedGameDayId });
      alert("Game day finalized successfully!");
    } catch (error) {
      console.error("Error finalizing game day:", error);
      alert("Failed to finalize game day");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Complete Game Day & Standings Demo</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Day Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Game Day Operations</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Game Day ID
              </label>
              <input
                type="text"
                value={selectedGameDayId || ""}
                onChange={(e) => setSelectedGameDayId(e.target.value as Id<"game_days">)}
                placeholder="Enter game day ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <input
                type="text"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                placeholder="Enter new status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleUpdateStatus}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              Update Game Day Status
            </button>

            <button
              onClick={handleFinalizeGameDay}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
            >
              Finalize Game Day
            </button>
          </div>

          {/* Display Game Day Info */}
          {gameDay && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-2">Game Day Info:</h3>
              <p><strong>Date:</strong> {gameDay.date}</p>
              <p><strong>Status:</strong> {gameDay.status}</p>
              <p><strong>Finalized:</strong> {gameDay.is_finalized ? "Yes" : "No"}</p>
            </div>
          )}

          {/* Display Assignments */}
          {assignments && assignments.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-2">Court Assignments:</h3>
              <div className="space-y-2">
                {assignments.map((assignment) => (
                  <div key={assignment._id} className="text-sm">
                    Court {assignment.court_number} - Slot {assignment.slot_number} - Player {assignment.player_id}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Players & Court Management Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Players & Court Management</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                League ID
              </label>
              <input
                type="text"
                value={selectedLeagueId || ""}
                onChange={(e) => setSelectedLeagueId(e.target.value as Id<"leagues">)}
                placeholder="Enter league ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Court Number
                </label>
                <input
                  type="number"
                  value={courtNumber}
                  onChange={(e) => setCourtNumber(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Players Count
                </label>
                <input
                  type="number"
                  value={playersCount}
                  onChange={(e) => setPlayersCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleUpdateCourtSize}
              className="w-full bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 transition-colors"
            >
              Update Court Size
            </button>
          </div>

          {/* Display Players */}
          {players && players.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-2">League Players ({players.length}):</h3>
              <div className="space-y-1">
                {players.slice(0, 5).map((player) => (
                  <div key={player.id} className="text-sm">
                    {player.first_name} {player.last_name} (Rating: {player.dup_rating || 'N/A'})
                  </div>
                ))}
                {players.length > 5 && <div className="text-sm text-gray-500">... and {players.length - 5} more</div>}
              </div>
            </div>
          )}

          {/* Display Court Configurations */}
          {courtConfigs && courtConfigs.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-2">Court Configurations:</h3>
              <div className="space-y-1">
                {courtConfigs.map((config) => (
                  <div key={config.court_number} className="text-sm">
                    Court {config.court_number}: {config.players_count} players - {config.display_name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Standings Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Standings & Court Assignments</h2>
          
          {/* Display Standings */}
          {standings && standings.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-2">League Standings ({standings.length} players):</h3>
              <div className="space-y-1">
                {standings.slice(0, 5).map((standing) => (
                  <div key={standing._id} className="text-sm">
                    Court {standing.court_number} - {standing.display_name} - {standing.total_points} pts
                  </div>
                ))}
                {standings.length > 5 && <div className="text-sm text-gray-500">... and {standings.length - 5} more</div>}
              </div>
            </div>
          )}

          {/* Display Court Assignments */}
          {standingsCourtAssignments && standingsCourtAssignments.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-2">Court Assignments:</h3>
              <div className="space-y-2">
                {standingsCourtAssignments.map((court) => (
                  <div key={court.court_number} className="text-sm">
                    <strong>Court {court.court_number}:</strong>
                                         <div className="ml-2">
                       {court.players.map((player: any, index: number) => (
                         <div key={index} className="text-xs">
                           {player.name} (Rating: {player.dup_rating})
                         </div>
                       ))}
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Display Court Rotations */}
          {courtRotations && courtRotations.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-2">Court {courtNumber} Rotations:</h3>
              <div className="space-y-1">
                {courtRotations.slice(0, 3).map((rotation) => (
                  <div key={rotation.game_number} className="text-sm">
                    Game {rotation.game_number}: {rotation.team1[0].first_name} & {rotation.team1[1].first_name} vs {rotation.team2[0].first_name} & {rotation.team2[1].first_name}
                  </div>
                ))}
                {courtRotations.length > 3 && <div className="text-sm text-gray-500">... and {courtRotations.length - 3} more games</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Migration Notes */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Complete Migration Benefits:</h3>
        <ul className="space-y-2 text-sm">
          <li>✅ <strong>Real-time updates:</strong> All data automatically syncs across clients</li>
          <li>✅ <strong>Type safety:</strong> Full TypeScript support with generated types</li>
          <li>✅ <strong>Automatic caching:</strong> Convex handles data caching and optimization</li>
          <li>✅ <strong>Serverless:</strong> No need to manage database connections or scaling</li>
          <li>✅ <strong>Built-in validation:</strong> All inputs are validated on the server</li>
          <li>✅ <strong>Complete functionality:</strong> All original Supabase functions migrated</li>
          <li>✅ <strong>Helper functions:</strong> Date/time utilities and data transformation functions</li>
          <li>✅ <strong>Complex operations:</strong> Court rotations, attendance tracking, and standings management</li>
        </ul>
      </div>
    </div>
  );
}; 