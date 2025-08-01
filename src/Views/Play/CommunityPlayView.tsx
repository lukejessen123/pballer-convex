import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import Modal from '../../components/ui/Modal';

interface GameFormat {
  title: string;
  description: string;
  path: string;
}

interface CommunityPlayViewProps {
  onNavigate?: (path: string) => void;
  onOpenModal?: () => void;
  onCloseModal?: () => void;
  isModalOpen?: boolean;
}

const gameFormats: GameFormat[] = [
  {
    title: 'King of the Court',
    description: 'AKA "Up and Down the River"...each round the winners move up a court, losers move down, and you "split" or "stay" to form new teams.',
    path: '/play/create/king-of-the-court',
  },
  {
    title: 'Social Play',
    description: 'Standard Match Play - Just show up and have fun.',
    path: '/play/create/social',
  },
  {
    title: 'Round Robin: Set Partners',
    description: 'Play with the same partner for every round. You score as a team. You can have a minimum of 4 and maximum of 16 teams.',
    path: '/play/create/round-robin-set',
  },
  {
    title: 'Round Robin: Rotating Partners',
    description: 'Play with a different partner each round. You score as an individual. You can have a minimum of 4 and maximum of 20 Individual players join.',
    path: '/play/create/round-robin-rotating',
  },
];

const CommunityPlayView: React.FC<CommunityPlayViewProps> = ({ 
  onNavigate, 
  onOpenModal, 
  onCloseModal, 
  isModalOpen = false 
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => {
    setModalOpen(true);
    onOpenModal?.();
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    onCloseModal?.();
  };

  const handleGameFormatClick = (format: GameFormat) => {
    handleOpenModal();
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white">Create a Match</h1>
        <p className="text-lg text-gray-400">Join an existing game or create a new one.</p>
      </div>

      {/* Browse Games search bar */}
      <div className="mb-12 flex justify-center">
        <input
          type="text"
          placeholder="Browse Games..."
          className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 outline-none transition"
          onFocus={handleOpenModal}
          readOnly
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Choose Your Game Format</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gameFormats.map((format) => (
            <button
              key={format.title}
              onClick={() => handleGameFormatClick(format)}
              className="block p-6 rounded-lg bg-gray-800 hover:bg-gray-700 text-left transition-colors duration-200"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-teal-400">{format.title}</h3>
                <ChevronRight className="h-6 w-6 text-gray-500" />
              </div>
              <p className="mt-2 text-gray-400">{format.description}</p>
            </button>
          ))}
        </div>
        <Modal isOpen={modalOpen || isModalOpen} onClose={handleCloseModal} title="Feature Coming Soon!">
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4 text-primary-600 dark:text-primary-400">Your next favorite feature is in the kitchen… cooking.</h2>
            <p className="text-lg text-gray-500">Check back shortly—we're prepping something awesome!</p>
            <button
              className="mt-6 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
              onClick={handleCloseModal}
            >
              Close
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default CommunityPlayView; 