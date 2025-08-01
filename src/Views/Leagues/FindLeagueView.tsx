import React, { useEffect, useState } from 'react';
import Input from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

interface League {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  access_mode?: string;
  created_by?: string;
  isNew?: boolean;
}

interface FindLeagueViewProps {
  leagues: League[];
  joinedLeagues: Record<string, string>; // leagueId -> status
  isLoading: boolean;
  onJoin: (league: League) => Promise<void>;
  onRequestToJoin: (league: League) => Promise<void>;
  onInvite: (league: League) => void;
  onNavigate?: (path: string) => void;
  currentUserId?: string;
}

const FindLeagueView: React.FC<FindLeagueViewProps> = ({ 
  leagues, 
  joinedLeagues, 
  isLoading, 
  onJoin, 
  onRequestToJoin, 
  onInvite,
  onNavigate,
  currentUserId
}) => {
  const [filteredLeagues, setFilteredLeagues] = useState<League[]>([]);
  const [search, setSearch] = useState('');
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    if (!search) {
      setFilteredLeagues(leagues);
    } else {
      const lower = search.toLowerCase();
      setFilteredLeagues(
        leagues.filter(l =>
          l.name.toLowerCase().includes(lower) ||
          (l.description && l.description.toLowerCase().includes(lower)) ||
          (l.location && l.location.toLowerCase().includes(lower))
        )
      );
    }
  }, [search, leagues]);

  const handleJoin = async (league: League) => {
    if (!currentUserId) {
      // Handle not logged in case
      return;
    }
    setJoining(league._id);
    try {
      await onJoin(league);
    } finally {
      setJoining(null);
    }
  };

  const handleRequestToJoin = async (league: League) => {
    if (!currentUserId) {
      // Handle not logged in case
      return;
    }
    setJoining(league._id);
    try {
      await onRequestToJoin(league);
    } finally {
      setJoining(null);
    }
  };

  const handleInvite = (league: League) => {
    onInvite(league);
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Find a League</h1>
      <div className="mb-6 flex justify-center">
        <Input
          type="text"
          placeholder="Search by name, location, or description..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded border border-gray-300 dark:border-gray-700"
        />
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filteredLeagues.length === 0 ? (
        <div className="text-center text-gray-500">No leagues found.</div>
      ) : (
        <div className="space-y-4">
          {filteredLeagues.map(league => {
            const status = joinedLeagues[league._id];
            return (
              <div key={league._id} className="bg-gray-800 rounded-xl shadow-md p-5 mb-4">
                <h2 className="text-lg font-bold text-white mb-1">{league.name}</h2>
                {league.description && (
                  <p className="text-gray-400 text-sm mb-1">{league.description}</p>
                )}
                {league.location && (
                  <p className="text-gray-400 text-xs mb-1">{league.location}</p>
                )}
                {league.isNew && (
                  <span className="inline-block text-xs text-primary-400 mb-4">New League</span>
                )}
                <div className="flex flex-col gap-2 mt-2">
                  {status === 'joined' ? (
                    <span className="w-full text-green-600 font-semibold">Joined</span>
                  ) : status === 'pending' ? (
                    <span className="w-full text-yellow-600 font-semibold">Request Pending</span>
                  ) : league.access_mode === 'invitation' ? (
                    <button
                      className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 rounded transition"
                      onClick={() => handleRequestToJoin(league)}
                      disabled={joining === league._id}
                    >
                      Request to Join
                    </button>
                  ) : (
                    <button
                      className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 rounded transition"
                      onClick={() => handleJoin(league)}
                      disabled={joining === league._id}
                    >
                      Join
                    </button>
                  )}
                  <button
                    className="w-full border border-primary-500 text-primary-500 font-semibold py-2 rounded bg-transparent hover:bg-primary-500 hover:text-white transition"
                    onClick={() => handleInvite(league)}
                  >
                    Invite a Friend
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FindLeagueView; 