import React, { useState } from 'react';

interface EventJoinButtonProps {
  eventId: string;
  joined: boolean;
  onJoin?: () => Promise<void>;
  disabled?: boolean;
}

const EventJoinButton: React.FC<EventJoinButtonProps> = ({ 
  eventId, 
  joined, 
  onJoin,
  disabled = false 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!onJoin) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await onJoin();
    } catch (err: any) {
      setError(err.message || 'Failed to join event');
    } finally {
      setLoading(false);
    }
  };

  if (joined) {
    return (
      <button 
        className="px-4 py-2 rounded bg-gray-400 text-white cursor-not-allowed" 
        disabled
      >
        Joined
      </button>
    );
  }

  return (
    <div>
      <button
        className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
        onClick={handleJoin}
        disabled={loading || disabled}
      >
        {loading ? 'Joining...' : 'Join Game'}
      </button>
      {error && <div className="text-red-500 mt-1">{error}</div>}
    </div>
  );
};

export default EventJoinButton; 