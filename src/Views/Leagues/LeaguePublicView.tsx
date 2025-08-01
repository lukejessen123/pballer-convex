import React, { useState } from 'react';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

interface League {
  _id: string;
  name: string;
  description?: string;
  location?: string;
  access_mode?: string;
  created_by?: string;
}

interface LeaguePublicViewProps {
  league: League | null;
  isLoading: boolean;
  status: string | null;
  onJoin: () => Promise<void>;
  onRequestToJoin: () => Promise<void>;
  onNavigate?: (path: string) => void;
}

const LeaguePublicView: React.FC<LeaguePublicViewProps> = ({ 
  league, 
  isLoading, 
  status, 
  onJoin, 
  onRequestToJoin,
  onNavigate 
}) => {
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await onJoin();
    } finally {
      setJoining(false);
    }
  };

  const handleRequestToJoin = async () => {
    setJoining(true);
    try {
      await onRequestToJoin();
    } finally {
      setJoining(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }
  if (!league) {
    return <div className="text-center text-gray-500">League not found.</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-lg">
      <div className="bg-gray-800 rounded-xl shadow-md p-5 mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">{league.name}</h2>
        {league.description && (
          <p className="text-gray-400 text-base mb-2">{league.description}</p>
        )}
        {league.location && (
          <p className="text-gray-400 text-sm mb-2">{league.location}</p>
        )}
        <div className="flex flex-col gap-2 mt-4">
          {status === 'joined' ? (
            <span className="w-full text-green-600 font-semibold">Joined</span>
          ) : status === 'pending' ? (
            <span className="w-full text-yellow-600 font-semibold">Request Pending</span>
          ) : league.access_mode === 'invitation' ? (
            <Button
              className="w-full"
              onClick={handleRequestToJoin}
              isLoading={joining}
            >
              Request to Join
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={handleJoin}
              isLoading={joining}
            >
              Join
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaguePublicView; 