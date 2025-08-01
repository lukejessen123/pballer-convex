import React, { lazy, Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';

// Lazy-load LeagueWizard
const LeagueWizard = lazy(() => import('../../components/leagues/LeagueWizard/LeagueWizard'));

interface EditLeagueViewProps {
  leagueId: string;
  onNavigate?: (path: string) => void;
}

const EditLeagueView: React.FC<EditLeagueViewProps> = ({ leagueId, onNavigate }) => {
  const handleBack = () => {
    if (onNavigate) {
      onNavigate(`/leagues/${leagueId}`);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            leftIcon={<ArrowLeft size={16} />}
          >
            Back to League
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
            Edit League
          </h1>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Update your league settings
        </p>
      </div>

      <Suspense fallback={<div className="text-center text-gray-500 dark:text-gray-400">Loading League Editor...</div>}>
        <LeagueWizard leagueId={leagueId} onNavigate={onNavigate} />
      </Suspense>
    </div>
  );
};

export default EditLeagueView;