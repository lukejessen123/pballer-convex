import React, { useState, useEffect } from 'react';
import { Card, CardBody } from '../ui/Card';
import Button from '../ui/Button';

interface Match {
  _id: string;
  team1_id: string;
  team2_id: string;
  team1_score?: number;
  team2_score?: number;
}

interface EventMatchScoringProps {
  matches: Match[];
  courtName: string;
  onScoreUpdate?: (matchId: string, team1Score: number, team2Score: number) => Promise<void>;
  userId: string;
  event: any;
  playerMap: Record<string, string>;
  isFinalized?: boolean;
}

const EventMatchScoring: React.FC<EventMatchScoringProps> = ({ 
  matches, 
  courtName, 
  onScoreUpdate, 
  userId, 
  event, 
  playerMap, 
  isFinalized 
}) => {
  const [scoreEdits, setScoreEdits] = useState<Record<string, { team1: number; team2: number; editing: boolean }>>({});
  const [saving, setSaving] = useState(false);

  // Auto-enter editing mode for unscored matches
  useEffect(() => {
    setScoreEdits(prev => {
      const newEdits = { ...prev };
      matches.forEach(m => {
        const isSubmitted = typeof m.team1_score === 'number' && typeof m.team2_score === 'number' && (m.team1_score !== 0 || m.team2_score !== 0);
        if (!isSubmitted && !newEdits[m._id]) {
          newEdits[m._id] = {
            team1: m.team1_score ?? 0,
            team2: m.team2_score ?? 0,
            editing: true,
          };
        }
      });
      return newEdits;
    });
  }, [matches]);

  const validateScore = (team1: number, team2: number): string | null => {
    const pointsToWin = event?.points_to_win || 11;
    const winByMargin = event?.win_by_margin || 2;
    if (team1 < 0 || team2 < 0) return 'Scores cannot be negative.';
    if (team1 === team2) return 'No ties allowed.';
    const maxScore = Math.max(team1, team2);
    const minScore = Math.min(team1, team2);
    if (maxScore < pointsToWin) return `Winner must reach at least ${pointsToWin} points.`;
    if (maxScore - minScore < winByMargin) return `Winner must win by at least ${winByMargin} points.`;
    return null;
  };

  const handleEditScore = (matchId: string, m: Match) => {
    setScoreEdits((prev) => ({
      ...prev,
      [matchId]: {
        team1: m.team1_score ?? 0,
        team2: m.team2_score ?? 0,
        editing: true,
      },
    }));
  };

  const handleScoreChange = (matchId: string, team: 'team1' | 'team2', inc: boolean) => {
    setScoreEdits((prev) => {
      const curr = prev[matchId] || { team1: 0, team2: 0, editing: true };
      return {
        ...prev,
        [matchId]: {
          ...curr,
          [team]: Math.max(0, curr[team] + (inc ? 1 : -1)),
          editing: true,
        },
      };
    });
  };

  const handleSubmitScore = async (matchId: string) => {
    const edit = scoreEdits[matchId];
    if (!edit || !onScoreUpdate) return;
    
    const validationError = validateScore(edit.team1, edit.team2);
    if (validationError) {
      alert(validationError);
      return;
    }
    
    setSaving(true);
    try {
      await onScoreUpdate(matchId, edit.team1, edit.team2);
      setScoreEdits((prev) => ({ ...prev, [matchId]: { ...prev[matchId], editing: false } }));
    } catch (error) {
      console.error('Failed to update score:', error);
      alert('Failed to update score. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = (matchId: string) => {
    setScoreEdits((prev) => ({ ...prev, [matchId]: { ...prev[matchId], editing: false } }));
  };

  const renderTeam = (teamId: string) => {
    return teamId
      .split(',')
      .map((pid) => playerMap[pid] || pid)
      .join(' & ');
  };

  // Only allow editing if user is on team1 or team2, or is the event owner
  const isOwner = event?.created_by === userId;
  const canEdit = (m: Match) => {
    const ids = (m.team1_id + ',' + m.team2_id).split(',');
    return ids.includes(userId) || isOwner;
  };

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-bold mb-2 text-white">{courtName}</h3>
      {matches.map((m, i) => {
        const edit = scoreEdits[m._id];
        // Determine if a score has been submitted (both scores are not null and not both zero)
        const isSubmitted = typeof m.team1_score === 'number' && typeof m.team2_score === 'number' && (m.team1_score !== 0 || m.team2_score !== 0);
        const isEditing = edit?.editing;
        return (
          <Card key={m._id || i} className="bg-gray-800">
            <CardBody>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                {/* Team 1 Block */}
                <div className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg ${m.team1_score && m.team2_score && m.team1_score > m.team2_score ? 'border-2 border-green-500' : ''}`}>
                  <div className="text-white text-lg font-semibold mb-2">{renderTeam(m.team1_id)}</div>
                  <div className="flex items-center gap-2">
                    {isEditing && !isFinalized && <button className="rounded-full bg-gray-700 p-3 text-white hover:bg-gray-600 disabled:opacity-50" onClick={() => handleScoreChange(m._id, 'team1', false)} disabled={edit?.team1 === 0}>-</button>}
                    <div className="text-4xl font-bold text-white">{isEditing ? edit?.team1 : m.team1_score ?? 0}</div>
                    {isEditing && !isFinalized && <button className="rounded-full bg-gray-700 p-3 text-white hover:bg-gray-600 disabled:opacity-50" onClick={() => handleScoreChange(m._id, 'team1', true)}>+</button>}
                  </div>
                </div>
                {/* Score Divider */}
                <div className="flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">vs</span>
                </div>
                {/* Team 2 Block */}
                <div className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg ${m.team1_score && m.team2_score && m.team2_score > m.team1_score ? 'border-2 border-green-500' : ''}`}>
                  <div className="text-white text-lg font-semibold mb-2">{renderTeam(m.team2_id)}</div>
                  <div className="flex items-center gap-2">
                    {isEditing && !isFinalized && <button className="rounded-full bg-gray-700 p-3 text-white hover:bg-gray-600 disabled:opacity-50" onClick={() => handleScoreChange(m._id, 'team2', false)} disabled={edit?.team2 === 0}>-</button>}
                    <div className="text-4xl font-bold text-white">{isEditing ? edit?.team2 : m.team2_score ?? 0}</div>
                    {isEditing && !isFinalized && <button className="rounded-full bg-gray-700 p-3 text-white hover:bg-gray-600 disabled:opacity-50" onClick={() => handleScoreChange(m._id, 'team2', true)}>+</button>}
                  </div>
                </div>
                {/* Submit/Edit/Cancel Buttons */}
                <div className="flex flex-col items-center gap-2 mt-4 md:mt-0">
                  {/* Show Submit button if not submitted, or if editing. Show Edit button if already submitted and not editing. */}
                  {canEdit(m) && !isFinalized && (
                    !isSubmitted || isEditing ? (
                      <>
                        <Button onClick={() => isEditing ? handleSubmitScore(m._id) : handleEditScore(m._id, m)} className="bg-green-600 text-white mb-2" disabled={saving}>
                          {isEditing ? 'Submit' : 'Submit'}
                        </Button>
                        {/* Only show Cancel if editing a previously submitted match */}
                        {isEditing && isSubmitted && (
                          <Button onClick={() => handleCancelEdit(m._id)} className="bg-gray-500 text-white">Cancel</Button>
                        )}
                      </>
                    ) : (
                      <Button onClick={() => handleEditScore(m._id, m)} className="bg-blue-600 text-white">Edit</Button>
                    )
                  )}
                  {isFinalized && <div className="text-xs text-gray-400">Finalized</div>}
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
};

export default EventMatchScoring; 