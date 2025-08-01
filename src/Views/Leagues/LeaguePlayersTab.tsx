import React, { useState } from 'react';
import InvitePlayerModal from '../../components/players/InvitePlayerModal';

interface Player {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  dup_rating?: number;
}

interface LeaguePlayer {
  _id: string;
  player_id: string;
  status: string;
  invite_token?: string;
  invited_at?: string;
  joined_at?: string;
}

interface LeaguePlayersTabProps {
  leagueId: string;
  players: Player[];
  leaguePlayers: LeaguePlayer[];
  leagueName: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  onSearch: (searchTerm: string) => Promise<Player[]>;
  onAddToLeague: (playerId: string) => Promise<void>;
  onUpdatePlayer: (player: Player) => Promise<void>;
  onRemoveFromLeague: (playerId: string) => Promise<void>;
  onSendInvite: (playerId: string, playerEmail: string) => Promise<void>;
  onRefreshData: () => void;
}

const LeaguePlayersTab: React.FC<LeaguePlayersTabProps> = ({
  leagueId,
  players,
  leaguePlayers,
  leagueName,
  isAdmin,
  isSuperAdmin,
  onSearch,
  onAddToLeague,
  onUpdatePlayer,
  onRemoveFromLeague,
  onSendInvite,
  onRefreshData
}) => {
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search and Add Player Modal State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);

  // Search Logic
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const results = await onSearch(e.target.value);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddToLeague = async (playerId: string) => {
    try {
      await onAddToLeague(playerId);
      onRefreshData();
      setSearchResults([]);
      setSearchTerm('');
    } catch (err) {
      console.error('Add to league error:', err);
    }
  };

  // Helper to get league_player row for a player
  const getLeaguePlayer = (playerId: string) =>
    leaguePlayers.find((lp: LeaguePlayer) => lp.player_id === playerId);

  // Edit player modal logic
  const openEditModal = (player: Player) => {
    setEditPlayer({ ...player });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditPlayer(null);
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0,3)}-${digits.slice(3)}`;
    return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6,10)}`;
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editPlayer) return;
    if (e.target.name === 'phone') {
      setEditPlayer({ ...editPlayer, phone: formatPhone(e.target.value) });
    } else {
      setEditPlayer({ ...editPlayer, [e.target.name]: e.target.value });
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlayer) return;
    setEditLoading(true);
    setError(null);
    try {
      await onUpdatePlayer(editPlayer);
      setSuccess('Player updated!');
      onRefreshData();
      closeEditModal();
    } catch (err: any) {
      setError(err.message || 'Failed to update player');
    }
    setEditLoading(false);
  };

  // Remove player from league
  const handleRemoveFromLeague = async (playerId: string) => {
    setDeleteLoading(playerId);
    setError(null);
    try {
      await onRemoveFromLeague(playerId);
      setSuccess('Player removed from league');
      onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to remove player');
    }
    setDeleteLoading(null);
  };

  // Send/resend invite
  const handleSendInvite = async (playerId: string, playerEmail: string) => {
    setInviteLoading(playerId);
    setError(null);
    try {
      await onSendInvite(playerId, playerEmail);
      setSuccess('Invite sent!');
      onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to send invite');
    }
    setInviteLoading(null);
  };

  // Only show players in the league with approved status or 'not_invited' (Invite required)
  const filteredPlayers = players.filter((player) =>
    leaguePlayers.some(
      (lp: LeaguePlayer) =>
        lp.player_id === player._id &&
        (lp.status === 'invited' || lp.status === 'accepted' || lp.status === 'joined' || lp.status === 'not_invited')
    )
  );

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-white">Players</h2>
      {/* Search Bar and Add Player Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <div className="w-full md:w-1/2">
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 px-3 py-2 outline-none transition"
          />
          {searchLoading && <div className="text-white">Loading...</div>}
          {searchResults.length > 0 && (
            <div className="bg-gray-800 rounded mt-2 p-2 max-h-60 overflow-y-auto">
              {searchResults.map(player => {
                const alreadyInLeague = leaguePlayers.some(lp => lp.player_id === player._id);
                return (
                  <div key={player._id} className="flex justify-between items-center py-1 border-b border-gray-700 last:border-b-0">
                    <span className="text-white">{player.first_name} {player.last_name} ({player.email})</span>
                    {!alreadyInLeague ? (
                      <button
                        className="btn btn-sm btn-primary text-white"
                        onClick={() => handleAddToLeague(player._id)}
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
        <button
          className="btn btn-primary text-white"
          onClick={() => setShowAddPlayerModal(true)}
        >
          + Add Player
        </button>
      </div>

      {/* Success/Error Messages */}
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}

      {/* Player List */}
      <div className="mt-4 space-y-2">
        {filteredPlayers.map((player) => {
          const leaguePlayer = getLeaguePlayer(player._id);
          return (
            <div
              key={player._id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-800 p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div>
                <h3 className="font-medium text-white">
                  {player.first_name} {player.last_name}
                </h3>
                <p className="text-sm text-white">{player.email}</p>
                <p className="text-xs text-white mt-1">
                  Status: <span
                    className={`font-semibold ${
                      !leaguePlayer?.status || leaguePlayer?.status === 'not_invited'
                        ? 'text-gray-400'
                        : leaguePlayer?.status === 'invited'
                        ? 'text-yellow-400'
                        : leaguePlayer?.status === 'accepted'
                        ? 'text-green-400'
                        : 'text-white'
                    }`}
                  >
                    {!leaguePlayer?.status || leaguePlayer?.status === 'not_invited'
                      ? 'Invite required'
                      : leaguePlayer?.status === 'invited'
                      ? 'Invite sent'
                      : leaguePlayer?.status === 'accepted'
                      ? 'Accepted'
                      : leaguePlayer?.status}
                  </span>
                  {leaguePlayer?.invite_token && (
                    <>
                      {' | Invite Token: '}
                      <span className="font-mono">{leaguePlayer.invite_token}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {player.dup_rating ? (
                  <span className="font-medium text-white">{player.dup_rating.toFixed(1)}</span>
                ) : (
                  <span className="text-sm text-white">No rating</span>
                )}
                {(isAdmin || isSuperAdmin) && (
                  <>
                    <button
                      className="px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-600 transition"
                      onClick={() => openEditModal(player)}
                      disabled={editLoading}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to remove this player from the league? This action cannot be undone.')) {
                          handleRemoveFromLeague(player._id);
                        }
                      }}
                      disabled={deleteLoading === player._id}
                    >
                      {deleteLoading === player._id ? 'Removing...' : 'Remove'}
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-teal-600 text-white hover:bg-teal-700 transition"
                      onClick={() => handleSendInvite(player._id, player.email)}
                      disabled={inviteLoading === player._id || leaguePlayer?.status === 'accepted'}
                    >
                      {inviteLoading === player._id ? 'Sending...' : 'Send/Resend Invite'}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Player Modal */}
      {editModalOpen && editPlayer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-white">Edit Player</h3>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  name="first_name"
                  placeholder="First Name"
                  value={editPlayer.first_name}
                  onChange={handleEditChange}
                  className="w-full rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 px-3 py-2 outline-none transition"
                  required
                />
                <input
                  type="text"
                  name="last_name"
                  placeholder="Last Name"
                  value={editPlayer.last_name}
                  onChange={handleEditChange}
                  className="w-full rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 px-3 py-2 outline-none transition"
                  required
                />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={editPlayer.email}
                onChange={handleEditChange}
                className="w-full rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 px-3 py-2 outline-none transition"
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone (optional)"
                value={editPlayer.phone || ''}
                onChange={handleEditChange}
                className="w-full rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 px-3 py-2 outline-none transition"
              />
              <input
                type="number"
                name="dup_rating"
                step="0.01"
                placeholder="DUPR Rating (optional)"
                value={editPlayer.dup_rating || ''}
                onChange={handleEditChange}
                className="w-full rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 px-3 py-2 outline-none transition"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition"
                  onClick={closeEditModal}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 transition"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      <InvitePlayerModal
        isOpen={showAddPlayerModal}
        onClose={() => setShowAddPlayerModal(false)}
        onSuccess={() => {
          onRefreshData();
          setShowAddPlayerModal(false);
        }}
        leagueId={leagueId}
      />
    </div>
  );
};

export default LeaguePlayersTab;