import React, { useState } from 'react';
import { Id } from '../../../convex/_generated/dataModel';
import { CourtCard } from './CourtCard';
import { MatchScoring } from './MatchScoring';
import { PlayButton } from './PlayButton';
import { SubstituteModal } from './SubstituteModal';
import { 
  useCourtRotationsWithPlayers, 
  useCourtAssignments, 
  useAvailableSubstitutes,
  useUpdateRotationScores,
  useAddSubstituteToCourt,
  useStartCourtRotation,
  useEndCourtRotation,
  getTeamPlayers,
  getRotationStatus,
  formatTime,
  getCurrentTimeString,
  type Player,
  type CourtRotationWithPlayers
} from '../../services/playService';

interface PlayDashboardProps {
  leagueId: Id<"leagues">;
  gameDayId: Id<"game_days">;
  courtNumbers: number[];
}

export const PlayDashboard: React.FC<PlayDashboardProps> = ({
  leagueId,
  gameDayId,
  courtNumbers
}) => {
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
  const [selectedRotation, setSelectedRotation] = useState<CourtRotationWithPlayers | null>(null);
  const [showSubstituteModal, setShowSubstituteModal] = useState(false);
  const [substituteModalData, setSubstituteModalData] = useState<{
    courtNumber: number;
    slotNumber: number;
    currentPlayer?: Player;
  } | null>(null);

  // Hooks
  const updateRotationScores = useUpdateRotationScores();
  const addSubstituteToCourt = useAddSubstituteToCourt();
  const startCourtRotation = useStartCourtRotation();
  const endCourtRotation = useEndCourtRotation();

  // Get available substitutes
  const availableSubstitutes = useAvailableSubstitutes(leagueId);

  const handleCourtClick = (courtNumber: number) => {
    setSelectedCourt(courtNumber);
    setSelectedRotation(null);
  };

  const handleRotationClick = (rotation: CourtRotationWithPlayers) => {
    setSelectedRotation(rotation);
  };

  const handleScoreUpdate = async (team1Score: number, team2Score: number) => {
    if (!selectedRotation) return;
    
    try {
      await updateRotationScores({
        rotationId: selectedRotation._id,
        team1Score,
        team2Score,
      });
    } catch (error) {
      console.error('Failed to update scores:', error);
    }
  };

  const handleStartPlay = async () => {
    if (!selectedRotation) return;
    
    try {
      await startCourtRotation({
        rotationId: selectedRotation._id,
        startTime: getCurrentTimeString(),
      });
    } catch (error) {
      console.error('Failed to start rotation:', error);
    }
  };

  const handleStopPlay = async () => {
    if (!selectedRotation) return;
    
    try {
      await endCourtRotation({
        rotationId: selectedRotation._id,
        endTime: getCurrentTimeString(),
      });
    } catch (error) {
      console.error('Failed to end rotation:', error);
    }
  };

  const handlePausePlay = async () => {
    if (!selectedRotation) return;
    
    try {
      await endCourtRotation({
        rotationId: selectedRotation._id,
        endTime: getCurrentTimeString(),
      });
    } catch (error) {
      console.error('Failed to pause rotation:', error);
    }
  };

  const handleResumePlay = async () => {
    if (!selectedRotation) return;
    
    try {
      await startCourtRotation({
        rotationId: selectedRotation._id,
        startTime: getCurrentTimeString(),
      });
    } catch (error) {
      console.error('Failed to resume rotation:', error);
    }
  };

  const handleAddSubstitute = async (substituteName: string, regularPlayerId: Id<"profiles">) => {
    if (!substituteModalData) return;
    
    try {
      await addSubstituteToCourt({
        leagueId,
        gameDayId,
        courtNumber: substituteModalData.courtNumber,
        slotNumber: substituteModalData.slotNumber,
        substituteName,
        regularPlayerId,
      });
      setShowSubstituteModal(false);
      setSubstituteModalData(null);
    } catch (error) {
      console.error('Failed to add substitute:', error);
    }
  };

  const openSubstituteModal = (courtNumber: number, slotNumber: number, currentPlayer?: Player) => {
    setSubstituteModalData({ courtNumber, slotNumber, currentPlayer });
    setShowSubstituteModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Game Day Play</h1>
          <p className="text-gray-600">Manage courts, scoring, and player substitutions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Courts Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Courts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courtNumbers.map((courtNumber) => (
                <CourtCard
                  key={courtNumber}
                  courtNumber={courtNumber}
                  displayName={`Court ${courtNumber}`}
                  playersCount={4}
                  players={[]} // This would be populated with actual court assignments
                  onCourtClick={handleCourtClick}
                  isActive={selectedCourt === courtNumber}
                />
              ))}
            </div>
          </div>

          {/* Court Details */}
          <div className="lg:col-span-1">
            {selectedCourt && (
              <CourtDetails
                leagueId={leagueId}
                gameDayId={gameDayId}
                courtNumber={selectedCourt}
                onRotationClick={handleRotationClick}
                selectedRotation={selectedRotation}
                onAddSubstitute={openSubstituteModal}
              />
            )}
          </div>
        </div>

        {/* Match Scoring Modal */}
        {selectedRotation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Court {selectedRotation.court_number} - Game {selectedRotation.game_number}
                  </h3>
                  <button
                    onClick={() => setSelectedRotation(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Play Controls */}
                  <div>
                    <PlayButton
                      leagueId={leagueId}
                      gameDayId={gameDayId}
                      courtNumber={selectedRotation.court_number}
                      isActive={getRotationStatus(selectedRotation) === "active"}
                      onStartPlay={handleStartPlay}
                      onStopPlay={handleStopPlay}
                      onPausePlay={handlePausePlay}
                      onResumePlay={handleResumePlay}
                      isPaused={getRotationStatus(selectedRotation) === "completed"}
                    />
                  </div>

                  {/* Match Scoring */}
                  <div>
                    {(() => {
                      const { team1, team2 } = getTeamPlayers(selectedRotation);
                      if (team1 && team2) {
                        return (
                          <MatchScoring
                            leagueId={leagueId}
                            gameDayId={gameDayId}
                            courtNumber={selectedRotation.court_number}
                            rotationNumber={selectedRotation.rotation_number}
                            gameNumber={selectedRotation.game_number}
                            team1={team1}
                            team2={team2}
                            team1Score={selectedRotation.team1_score}
                            team2Score={selectedRotation.team2_score}
                            onScoreUpdate={handleScoreUpdate}
                            isEditable={getRotationStatus(selectedRotation) !== "completed"}
                          />
                        );
                      }
                      return (
                        <div className="text-center text-gray-500 py-8">
                          No teams assigned to this rotation
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Substitute Modal */}
        {showSubstituteModal && substituteModalData && availableSubstitutes && (
          <SubstituteModal
            isOpen={showSubstituteModal}
            onClose={() => {
              setShowSubstituteModal(false);
              setSubstituteModalData(null);
            }}
            onConfirm={handleAddSubstitute}
            courtNumber={substituteModalData.courtNumber}
            slotNumber={substituteModalData.slotNumber}
            currentPlayer={substituteModalData.currentPlayer}
            availableSubstitutes={availableSubstitutes.map(sub => ({
              id: sub._id,
              first_name: sub.first_name,
              last_name: sub.last_name,
              dup_rating: sub.dup_rating,
            }))}
          />
        )}
      </div>
    </div>
  );
};

// Court Details Component
interface CourtDetailsProps {
  leagueId: Id<"leagues">;
  gameDayId: Id<"game_days">;
  courtNumber: number;
  onRotationClick: (rotation: CourtRotationWithPlayers) => void;
  selectedRotation: CourtRotationWithPlayers | null;
  onAddSubstitute: (courtNumber: number, slotNumber: number, currentPlayer?: Player) => void;
}

const CourtDetails: React.FC<CourtDetailsProps> = ({
  leagueId,
  gameDayId,
  courtNumber,
  onRotationClick,
  selectedRotation,
  onAddSubstitute,
}) => {
  const rotations = useCourtRotationsWithPlayers(leagueId, gameDayId, courtNumber);
  const assignments = useCourtAssignments(leagueId, gameDayId, courtNumber);

  if (!rotations || !assignments) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Court {courtNumber}</h3>
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Court {courtNumber}</h3>
      
      {/* Current Players */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Players</h4>
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <div key={assignment._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  Slot {assignment.slot_number}:
                </span>
                <span className="text-sm text-gray-700">
                  {assignment.player 
                    ? `${assignment.player.first_name} ${assignment.player.last_name}`
                    : assignment.substitute_name || 'Unassigned'
                  }
                </span>
              </div>
              {assignment.player && (
                <button
                  onClick={() => onAddSubstitute(courtNumber, assignment.slot_number, {
                    id: assignment.player!._id,
                    first_name: assignment.player!.first_name,
                    last_name: assignment.player!.last_name,
                    dup_rating: assignment.player!.dup_rating,
                  })}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Add Substitute
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rotations */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Rotations</h4>
        <div className="space-y-2">
          {rotations.map((rotation) => {
            const status = getRotationStatus(rotation);
            const isSelected = selectedRotation?._id === rotation._id;
            
            return (
              <div
                key={rotation._id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onRotationClick(rotation)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Game {rotation.game_number} - Rotation {rotation.rotation_number}
                    </span>
                    <div className="text-xs text-gray-500">
                      {rotation.start_time && `Started: ${formatTime(rotation.start_time)}`}
                      {rotation.end_time && ` | Ended: ${formatTime(rotation.end_time)}`}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    status === 'active' ? 'bg-green-100 text-green-800' :
                    status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {status}
                  </span>
                </div>
                {rotation.team1_score !== undefined && rotation.team2_score !== undefined && (
                  <div className="text-xs text-gray-600 mt-1">
                    Score: {rotation.team1_score} - {rotation.team2_score}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 