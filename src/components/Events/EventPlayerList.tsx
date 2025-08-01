import React from 'react';

interface Player {
  _id: string;
  player_id: string;
  rsvp_status: 'accepted' | 'declined' | 'pending';
  role?: string;
  profiles?: {
    _id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface EventPlayerListProps {
  eventId: string;
  ownerId: string;
  maxPlayers?: number;
  players: Player[];
  isLoading?: boolean;
  error?: string | null;
  onRSVP?: (status: 'accepted' | 'declined') => Promise<void>;
  onReinvite?: (player: Player) => Promise<void>;
  currentUserId?: string;
  isOwner?: boolean;
}

const RSVP_LABELS: Record<string, string> = {
  accepted: 'Accepted',
  declined: 'Declined',
  pending: 'Pending',
};

const EventPlayerList: React.FC<EventPlayerListProps> = ({ 
  eventId, 
  ownerId, 
  maxPlayers = 16,
  players = [],
  isLoading = false,
  error = null,
  onRSVP,
  onReinvite,
  currentUserId,
  isOwner = false
}) => {
  const spotsLeft = maxPlayers - players.length;
  const myPlayer = players.find(p => p.player_id === currentUserId);
  const myStatus = myPlayer?.rsvp_status;

  const handleRSVP = async (status: 'accepted' | 'declined') => {
    if (!onRSVP) return;
    try {
      await onRSVP(status);
    } catch (error) {
      console.error('Failed to update RSVP:', error);
    }
  };

  const handleReinvite = async (player: Player) => {
    if (!onReinvite) return;
    try {
      await onReinvite(player);
    } catch (error) {
      console.error('Failed to send reinvite:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg p-4 mt-4">
        <div className="mb-2 font-bold text-white text-xl">Player List</div>
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-4 mt-4">
        <div className="mb-2 font-bold text-white text-xl">Player List</div>
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 mt-4">
      <div className="mb-2 font-bold text-white text-xl">Player List</div>
      <ul className="divide-y divide-gray-800">
        {players.map((p) => {
          const playerName = (p.profiles?.first_name || p.profiles?.last_name)
            ? `${p.profiles?.first_name || ''} ${p.profiles?.last_name || ''}`.trim()
            : p.profiles?.email || p.player_id;
          
          return (
            <li key={p._id} className="py-2 flex flex-wrap items-center gap-2 text-white">
              <span>{playerName}</span>
              {p.player_id === ownerId && (
                <span className="ml-2 text-xs text-blue-400 bg-blue-900 px-2 py-0.5 rounded">
                  Owner
                </span>
              )}
              <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                p.rsvp_status === 'accepted' 
                  ? 'bg-green-800 text-green-300' 
                  : p.rsvp_status === 'declined' 
                    ? 'bg-red-800 text-red-300' 
                    : 'bg-yellow-800 text-yellow-300'
              }`}>
                {RSVP_LABELS[p.rsvp_status] || 'Pending'}
              </span>
              {p.player_id === currentUserId && p.rsvp_status === 'pending' && (
                <>
                  <button
                    className="ml-2 px-2 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700"
                    onClick={() => handleRSVP('accepted')}
                  >
                    Accept
                  </button>
                  <button
                    className="ml-2 px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
                    onClick={() => handleRSVP('declined')}
                  >
                    Decline
                  </button>
                </>
              )}
              {/* Re-invite button for owner */}
              {isOwner && (p.rsvp_status === 'pending' || p.rsvp_status === 'declined') && (
                <button
                  className="ml-2 px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-60"
                  onClick={() => handleReinvite(p)}
                >
                  Re-invite
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default EventPlayerList; 