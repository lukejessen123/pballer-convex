import React, { useState, useEffect } from 'react';
import { Id } from '../../../convex/_generated/dataModel';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  dup_rating?: number;
}

interface SubstituteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (substituteName: string, regularPlayerId: Id<"profiles">) => void;
  courtNumber: number;
  slotNumber: number;
  currentPlayer?: Player;
  availableSubstitutes: Player[];
  isLoading?: boolean;
}

export const SubstituteModal: React.FC<SubstituteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  courtNumber,
  slotNumber,
  currentPlayer,
  availableSubstitutes,
  isLoading = false
}) => {
  const [substituteName, setSubstituteName] = useState('');
  const [selectedSubstituteId, setSelectedSubstituteId] = useState<string>('');
  const [isCustomSubstitute, setIsCustomSubstitute] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSubstituteName('');
      setSelectedSubstituteId('');
      setIsCustomSubstitute(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (isCustomSubstitute && substituteName.trim()) {
      onConfirm(substituteName.trim(), currentPlayer?.id as Id<"profiles">);
    } else if (!isCustomSubstitute && selectedSubstituteId) {
      const selectedSubstitute = availableSubstitutes.find(sub => sub.id === selectedSubstituteId);
      if (selectedSubstitute) {
        onConfirm(`${selectedSubstitute.first_name} ${selectedSubstitute.last_name}`, currentPlayer?.id as Id<"profiles">);
      }
    }
  };

  const canConfirm = () => {
    if (isCustomSubstitute) {
      return substituteName.trim().length > 0;
    }
    return selectedSubstituteId.length > 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Add Substitute
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Court {courtNumber}, Slot {slotNumber}
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {currentPlayer && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Replacing:</p>
              <p className="font-medium text-gray-900">
                {currentPlayer.first_name} {currentPlayer.last_name}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="existing-substitute"
                checked={!isCustomSubstitute}
                onChange={() => setIsCustomSubstitute(false)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="existing-substitute" className="text-sm font-medium text-gray-700">
                Select from available substitutes
              </label>
            </div>

            {!isCustomSubstitute && (
              <div className="ml-6">
                <select
                  value={selectedSubstituteId}
                  onChange={(e) => setSelectedSubstituteId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                >
                  <option value="">Select a substitute...</option>
                  {availableSubstitutes.map((substitute) => (
                    <option key={substitute.id} value={substitute.id}>
                      {substitute.first_name} {substitute.last_name}
                      {substitute.dup_rating && ` (DUPR: ${substitute.dup_rating})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="custom-substitute"
                checked={isCustomSubstitute}
                onChange={() => setIsCustomSubstitute(true)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="custom-substitute" className="text-sm font-medium text-gray-700">
                Add custom substitute
              </label>
            </div>

            {isCustomSubstitute && (
              <div className="ml-6">
                <input
                  type="text"
                  value={substituteName}
                  onChange={(e) => setSubstituteName(e.target.value)}
                  placeholder="Enter substitute name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={!canConfirm() || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding...' : 'Add Substitute'}
          </button>
        </div>
      </div>
    </div>
  );
}; 