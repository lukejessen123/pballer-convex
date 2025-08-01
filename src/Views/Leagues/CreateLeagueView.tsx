import React, { lazy, Suspense } from 'react';

// Lazy-load LeagueWizard for faster app performance
const LeagueWizard = lazy(() => import('../../components/leagues/LeagueWizard/LeagueWizard'));

interface CreateLeagueViewProps {
  onNavigate?: (path: string) => void;
}

const CreateLeagueView: React.FC<CreateLeagueViewProps> = ({ onNavigate }) => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
          Create New League
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Set up your league settings and get ready to play
        </p>
      </div>

      <Suspense fallback={<div className="text-center text-gray-500 dark:text-gray-400">Loading League Wizard...</div>}>
        <LeagueWizard onNavigate={onNavigate} />
      </Suspense>
    </div>
  );
};

export default CreateLeagueView;
