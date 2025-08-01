import React from 'react';

interface LeagueOverviewTabProps {
  leagueId: string;
  onNavigate?: (path: string) => void;
}

const LeagueOverviewTab: React.FC<LeagueOverviewTabProps> = ({ leagueId, onNavigate }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-white">League Overview</h2>
      <p className="text-white">League overview content for league {leagueId}</p>
    </div>
  );
};

export default LeagueOverviewTab; 