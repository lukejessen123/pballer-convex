import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import NextMatchCard from '../components/Dashboard/NextMatchCard';
import StandingCard from '../components/Dashboard/StandingCard';
import AnnouncementCard from '../components/Dashboard/AnnouncementCard';
import MyEventsList from '../components/Dashboard/MyEventsList';
import FeedbackButton from '../components/ui/FeedbackButton';

interface Profile {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
}

interface League {
  _id: string;
  name: string;
  end_date?: string;
}

interface NextMatch {
  date: string;
  time: string;
  location: string;
  court: string;
  players: { id: string; name: string }[];
  leagueName: string;
  start_datetime_utc?: string;
  end_datetime_utc?: string;
}

interface Standing {
  rank: number;
  wins: number;
  losses: number;
  movement: string;
  totalPoints: number;
  winPercentage: number;
}

interface Announcement {
  _id: string;
  title: string;
  message: string;
  date: string;
}

interface HomeViewProps {
  profile: Profile | null;
  userLeagues: League[];
  selectedLeagueId: string | null;
  nextMatch: NextMatch | null;
  standing: Standing | null;
  announcements: Announcement[];
  isLoading: boolean;
  isDataLoading: boolean;
  isRefreshing: boolean;
  isSuperAdmin: boolean;
  announcementsLoading: boolean;
  feedbackModalOpen: boolean;
  feedbackSubject: string;
  showDuprField: boolean;
  onLeagueSelect: (leagueId: string) => void;
  onRefresh: () => void;
  onMarkAsRead: (announcementId: string) => Promise<void>;
  onDeleteNotification: (announcementId: string) => Promise<void>;
  onNavigate: (path: string) => void;
  onFeedbackModalOpen: (open: boolean) => void;
  onFeedbackSubject: (subject: string) => void;
  onShowDuprField: (show: boolean) => void;
}

const HomeView: React.FC<HomeViewProps> = ({
  profile,
  userLeagues,
  selectedLeagueId,
  nextMatch,
  standing,
  announcements,
  isLoading,
  isDataLoading,
  isRefreshing,
  isSuperAdmin,
  announcementsLoading,
  feedbackModalOpen,
  feedbackSubject,
  showDuprField,
  onLeagueSelect,
  onRefresh,
  onMarkAsRead,
  onDeleteNotification,
  onNavigate,
  onFeedbackModalOpen,
  onFeedbackSubject,
  onShowDuprField
}) => {
  return (
    <>
      <FeedbackButton
        openFromHome={feedbackModalOpen}
        setOpenFromHome={onFeedbackModalOpen}
        subject={feedbackSubject}
        showDuprField={showDuprField}
      />
      <div className="container mx-auto space-y-6 py-8 px-4 w-full">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
              Welcome, {isLoading ? '...' : profile?.first_name || 'Player'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here's your pickleball dashboard
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {userLeagues.length > 1 && (
              <div className="w-full sm:w-auto">
                <label htmlFor="league-select" className="sr-only">Select a league</label>
                <select
                  id="league-select"
                  className="w-full sm:w-auto rounded bg-gray-800 text-white border border-gray-700 px-3 py-2 min-w-0 max-w-full text-sm sm:text-base"
                  value={selectedLeagueId || ''}
                  onChange={(e) => onLeagueSelect(e.target.value)}
                >
                  {userLeagues.map((league) => (
                    <option key={league._id} value={league._id} className="break-words">
                      {league.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              className="inline-flex items-center gap-2 rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-60"
              onClick={onRefresh}
              disabled={isRefreshing || isLoading || isDataLoading}
              aria-label="Refresh dashboard"
            >
              {isRefreshing || isDataLoading ? (
                <span className="animate-spin"><RefreshCw size={18} /></span>
              ) : (
                <RefreshCw size={18} />
              )}
              Refresh
            </button>
          </div>
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
          {isLoading ? (
            <>
              <NextMatchCard isLoading={true} />
              <StandingCard isLoading={true} leagueId={null} title="Season Ranking" />
            </>
          ) : selectedLeagueId ? (
            <>
              <NextMatchCard
                match={nextMatch}
                isLoading={isLoading || isDataLoading}
                leagueId={selectedLeagueId || undefined}
                onCardClick={nextMatch && selectedLeagueId ? () => onNavigate(`/leagues/${selectedLeagueId}/game-days`) : undefined}
              />
              <StandingCard
                standing={standing}
                isLoading={isLoading || isDataLoading}
                title="Season Ranking"
                leagueId={selectedLeagueId}
              />
            </>
          ) : !isSuperAdmin && userLeagues.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] w-full">
              {/* SVG Paddle Illustration */}
              <svg
                width="120"
                height="120"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto mb-4"
              >
                <rect x="20" y="10" width="60" height="80" rx="30" fill="#F7C873" stroke="#333" strokeWidth="4" />
                <rect x="20" y="10" width="60" height="80" rx="30" fill="none" stroke="#333" strokeWidth="4" />
                <rect x="43" y="85" width="14" height="28" rx="7" fill="#333" stroke="#222" strokeWidth="2" />
                <line x1="43" y1="92" x2="57" y2="92" stroke="#666" strokeWidth="2" />
                <line x1="43" y1="99" x2="57" y2="99" stroke="#666" strokeWidth="2" />
                <line x1="43" y1="106" x2="57" y2="106" stroke="#666" strokeWidth="2" />
                <circle cx="80" cy="35" r="12" fill="#F7E36A" stroke="#333" strokeWidth="3" />
                <circle cx="80" cy="35" r="2" fill="#fff" />
                <circle cx="85" cy="40" r="1.5" fill="#fff" />
                <circle cx="75" cy="30" r="1.5" fill="#fff" />
              </svg>
              <h2 className="text-2xl font-bold text-white mb-6">Welcome to Pickleball League Manager</h2>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded"
                  onClick={() => {
                    onFeedbackSubject('Start My Own League');
                    onShowDuprField(false);
                    onFeedbackModalOpen(true);
                  }}
                >
                  Start My Own Ladder League
                </button>
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded"
                  onClick={() => {
                    onFeedbackSubject('Join a League');
                    onShowDuprField(true);
                    onFeedbackModalOpen(true);
                  }}
                >
                  Join a League
                </button>
              </div>
            </div>
          ) : userLeagues.length > 0 ? (
            <div className="md:col-span-2 text-white">Please select a league to view details.</div>
          ) : null}

          <div className="md:col-span-2 lg:col-span-1">
            {(announcementsLoading || isLoading || (announcements && announcements.length > 0)) && (
              <AnnouncementCard 
                announcements={announcements} 
                isLoading={announcementsLoading} 
                markAsRead={onMarkAsRead} 
                deleteNotification={onDeleteNotification} 
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeView;