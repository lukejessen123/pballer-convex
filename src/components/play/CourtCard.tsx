import React from 'react';
import { Id } from '../../../convex/_generated/dataModel';

interface CourtCardProps {
  courtNumber: number;
  displayName: string;
  playersCount: number;
  players: Array<{
    id: string;
    first_name: string;
    last_name: string;
    dup_rating?: number;
  }>;
  onCourtClick?: (courtNumber: number) => void;
  isActive?: boolean;
}

export const CourtCard: React.FC<CourtCardProps> = ({
  courtNumber,
  displayName,
  playersCount,
  players,
  onCourtClick,
  isActive = false
}) => {
  return (
    <div 
      className={`p-4 border rounded-lg shadow-sm cursor-pointer transition-all ${
        isActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      onClick={() => onCourtClick?.(courtNumber)}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">{displayName}</h3>
          <p className="text-sm text-gray-600">Court {courtNumber}</p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {players.length}/{playersCount} Players
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        {players.map((player, index) => (
          <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {index + 1}
              </div>
              <span className="text-sm font-medium text-gray-900">
                {player.first_name} {player.last_name}
              </span>
            </div>
            {player.dup_rating && (
              <span className="text-xs text-gray-500">
                DUPR: {player.dup_rating}
              </span>
            )}
          </div>
        ))}
        
        {players.length < playersCount && (
          <div className="flex items-center justify-center p-2 border-2 border-dashed border-gray-300 rounded text-gray-500 text-sm">
            {playersCount - players.length} slot{playersCount - players.length !== 1 ? 's' : ''} available
          </div>
        )}
      </div>
    </div>
  );
}; 