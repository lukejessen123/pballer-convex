import React, { useState } from 'react';
import { Id } from '../../../convex/_generated/dataModel';

interface PlayButtonProps {
  leagueId: Id<"leagues">;
  gameDayId: Id<"game_days">;
  courtNumber: number;
  isActive: boolean;
  onStartPlay: () => void;
  onStopPlay: () => void;
  onPausePlay: () => void;
  onResumePlay: () => void;
  isPaused?: boolean;
  disabled?: boolean;
}

export const PlayButton: React.FC<PlayButtonProps> = ({
  leagueId,
  gameDayId,
  courtNumber,
  isActive,
  onStartPlay,
  onStopPlay,
  onPausePlay,
  onResumePlay,
  isPaused = false,
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: () => void) => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    try {
      await action();
    } catch (error) {
      console.error('Play action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      );
    }

    if (!isActive) {
      return (
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          <span>Start Play</span>
        </div>
      );
    }

    if (isPaused) {
      return (
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          <span>Resume</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span>Pause</span>
      </div>
    );
  };

  const getButtonColor = () => {
    if (disabled) return 'bg-gray-400 cursor-not-allowed';
    if (isLoading) return 'bg-blue-500 cursor-wait';
    if (!isActive) return 'bg-green-600 hover:bg-green-700';
    if (isPaused) return 'bg-yellow-600 hover:bg-yellow-700';
    return 'bg-red-600 hover:bg-red-700';
  };

  const handleClick = () => {
    if (!isActive) {
      handleAction(onStartPlay);
    } else if (isPaused) {
      handleAction(onResumePlay);
    } else {
      handleAction(onPausePlay);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`w-full px-4 py-3 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${getButtonColor()}`}
      >
        {getButtonContent()}
      </button>

      {isActive && (
        <button
          onClick={() => handleAction(onStopPlay)}
          disabled={disabled || isLoading}
          className="w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Stop Play
        </button>
      )}

      <div className="text-xs text-gray-500 text-center">
        Court {courtNumber}
      </div>
    </div>
  );
}; 