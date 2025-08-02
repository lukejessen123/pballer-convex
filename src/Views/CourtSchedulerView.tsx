import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Save, Play, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';

interface Player {
  _id: string;
  first_name: string;
  last_name: string;
  dup_rating?: number;
  email?: string;
}

interface CourtConfig {
  court_number: number;
  display_name: string;
  players_count: number;
}

interface Rotation {
  game_number: number;
  rotation_number: number;
  team1: [Player | null, Player | null];
  team2: [Player | null, Player | null];
  start_time?: string;
  end_time?: string;
  team1_score?: number;
  team2_score?: number;
}

interface LeagueDetails {
  _id: string;
  courts: number;
  games_per_match: number;
  games_per_rotation: number;
  players_per_court: number;
  win_type: string;
  points_to_win: number;
  win_by_margin: number;
  start_time?: string;
  end_time?: string;
}

interface CourtRotations {
  [courtNumber: string]: Rotation[];
}

interface CourtSchedulerViewProps {
  leagueId: string;
  gameDayId: string;
  players: Player[];
  assignments: Record<string | number, Player[]>;
  courtConfigs: Record<number, string>;
  leagueDetails: LeagueDetails | null;
  rotations: CourtRotations;
  isLoading: boolean;
  isAdmin: boolean;
  isSaving: boolean;
  isGenerating: boolean;
  showScoring: boolean;
  isFinalized: boolean;
  searchTerm: string;
  searchResults: Player[];
  searchLoading: boolean;
  assignmentsSaved: boolean;
  onSave: () => Promise<void>;
  onGenerateRotations: () => Promise<void>;
  onFinalizeGameDay: () => Promise<void>;
  onRefreshStandings: () => Promise<void>;
  onDragEnd: (result: DropResult) => void;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddToLeague: (playerId: string) => Promise<void>;
  onNavigate: (path: string) => void;
}

const CourtSchedulerView: React.FC<CourtSchedulerViewProps> = ({
  leagueId,
  gameDayId,
  players,
  assignments,
  courtConfigs,
  leagueDetails,
  rotations,
  isLoading,
  isAdmin,
  isSaving,
  isGenerating,
  showScoring,
  isFinalized,
  searchTerm,
  searchResults,
  searchLoading,
  assignmentsSaved,
  onSave,
  onGenerateRotations,
  onFinalizeGameDay,
  onRefreshStandings,
  onDragEnd,
  onSearch,
  onAddToLeague,
  onNavigate
}) => {
  return (
    <div className="p-6">
      <div className="flex items-center mb-2">
        <button
          className="mr-4 px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600"
          onClick={() => onNavigate(`/leagues/${leagueId}`)}
        >
          ← Back to League
        </button>
        <h1 className="text-2xl font-bold text-white">Court Scheduler</h1>
      </div>
      {!gameDayId && (
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded">
          No game day exists for this date. {isAdmin ? 'Please use the Add Game Day button to create one.' : 'Contact your league admin to schedule a game day.'}
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <div />
        <div className="flex gap-2">
          {!showScoring && (
            <Button
              onClick={onSave}
              isLoading={isSaving}
              disabled={isLoading}
              leftIcon={<Save size={16} />}
            >
              Save Assignments
            </Button>
          )}
          {!showScoring && !isGenerating && Object.keys(assignments).length > 1 && (
            <Button
              onClick={onGenerateRotations}
              isLoading={isGenerating}
              leftIcon={<Play size={16} />}
              disabled={!assignmentsSaved || isGenerating}
            >
              Generate Rotations
            </Button>
          )}
          {showScoring && !isFinalized && isAdmin && (
            <Button
              onClick={onFinalizeGameDay}
              variant="success"
            >
              Finalize Game Day
            </Button>
          )}
          {isFinalized && isAdmin && (
            <Button
              onClick={onRefreshStandings}
              leftIcon={<RefreshCw size={16} />}
            >
              Refresh Standings
            </Button>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <p className="text-white">Loading...</p>
      ) : showScoring ? (
        <>
          <div className="space-y-8">
            {Object.entries(rotations).map(([courtNumber, courtRotations]) => {
              if (!courtConfigs[parseInt(courtNumber)]) return null;
              return (
                <div key={courtNumber}>
                  <h2 className="mb-4 text-xl font-bold text-white">
                    {courtConfigs[parseInt(courtNumber)] || `Court ${courtNumber}`}
                  </h2>
                  <div className="space-y-6 text-black">
                    {/* MatchScoring component would be passed as a prop or imported */}
                    <div className="bg-gray-100 p-4 rounded">
                      <p>Match Scoring Component for Court {courtNumber}</p>
                      <p>Rotations: {courtRotations.length}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Droppable droppableId="unassigned">
              {(provided: any) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-gray-800 p-4 rounded-lg"
                >
                  <h2 className="font-semibold mb-2 text-white">Unassigned Players</h2>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search players..."
                      value={searchTerm}
                      onChange={onSearch}
                      className="w-full rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 px-3 py-2 outline-none transition"
                    />
                    {searchLoading && <div>Loading...</div>}
                    {searchResults.length > 0 && (
                      <div className="bg-gray-800 rounded mt-2 p-2">
                        {searchResults.map(player => {
                          const alreadyInLeague = assignments.unassigned.some(p => p._id === player._id) ||
                            Object.values(assignments).some(list => list.some(p => p._id === player._id));
                          return (
                            <div key={player._id} className="flex justify-between items-center py-1 border-b border-gray-700 last:border-b-0">
                              <span>{player.first_name} {player.last_name} ({player.email})</span>
                              {!alreadyInLeague ? (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => onAddToLeague(player._id)}
                                >
                                  Add to League
                                </button>
                              ) : (
                                <span className="text-green-400 text-xs">Already in league</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {(assignments.unassigned ?? []).map((player, index) => (
                    <Draggable key={player._id} draggableId={player._id} index={index}>
                      {(provided: any) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-gray-700 p-2 rounded mb-2 text-white"
                        >
                          {player.first_name} {player.last_name} - Rating: {player.dup_rating ?? 'N/A'}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            
            {Object.keys(courtConfigs).length === 0 ? (
              <div className="col-span-full text-white text-center mt-4">
                ⚠️ No court configurations found for this league.
                <p className="mt-2 text-sm text-gray-400">
                  Please set up court configurations in the league settings.
                </p>
              </div>
            ) : (
              Object.entries(courtConfigs).map(([courtNumber, displayName]) => (
                <Droppable key={courtNumber} droppableId={courtNumber}>
                  {(provided: any) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="bg-gray-800 p-4 rounded-lg"
                    >
                      <h2 className="font-semibold mb-2 text-white">{displayName}</h2>
                      {(assignments[courtNumber] ?? []).map((player, index) => (
                        <Draggable key={player._id} draggableId={player._id} index={index}>
                          {(provided: any) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-gray-700 p-2 rounded mb-2 text-white"
                            >
                              {player.first_name} {player.last_name} - Rating: {player.dup_rating ?? 'N/A'}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))
            )}
          </div>
        </DragDropContext>
      )}
    </div>
  );
};

export default CourtSchedulerView;