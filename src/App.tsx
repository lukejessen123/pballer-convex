import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import AuthLayout from './components/Layout/AuthLayout';
import { AuthProvider } from './components/Contexts/AuthContext';
import { ThemeProvider } from './components/Contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import GameDayScoringView from './Views/GameDayScoringView';
import AcceptInviteView from './Views/Auth/AcceptInviteView';
import LeagueJoinRequests from './components/admin/LeagueJoinRequests';

// Lazy load views for better performance
const HomeView = React.lazy(() => import('./Views/HomeView'));
const SignInView = React.lazy(() => import('./Views/Auth/SignInView'));
const SignUpView = React.lazy(() => import('./Views/Auth/SignUpView'));
const EditLeagueView = React.lazy(() => import('./Views/Leagues/EditLeagueView'));
const LeagueOverviewLayout = React.lazy(() => import('./Views/Leagues/LeagueOverviewLayout'));
const LeagueOverviewTab = React.lazy(() => import('./Views/Leagues/LeagueOverviewTab'));
const LeaguePlayersTab = React.lazy(() => import('./Views/Leagues/LeaguePlayersTab'));
const LeagueGameDaysTab = React.lazy(() => import('./Views/Leagues/LeagueGameDaysTab'));
const LeagueRankingsTab = React.lazy(() => import('./Views/Leagues/LeagueRankingsTab'));
const LeagueWeeklyPerformanceTab = React.lazy(() => import('./Views/Leagues/LeagueWeeklyPerformanceTab'));
const LeagueNextWeekTab = React.lazy(() => import('./Views/Leagues/LeagueNextWeekTab'));
const CreateLeagueView = React.lazy(() => import('./Views/Leagues/CreateLeagueView')); 
const ForgotPasswordView = React.lazy(() => import('./Views/Auth/ForgotPasswordView'));
const ResetPasswordView = React.lazy(() => import('./Views/Auth/ResetPasswordView'));
const MyLeaguesView = React.lazy(() => import('./Views/Leagues/MyLeaguesView'));
const StandingsView = React.lazy(() => import('./Views/Standings/StandingsView'));
const PlayersView = React.lazy(() => import('./Views/Players/PlayersView'));
const ProfileView = React.lazy(() => import('./Views/Profile/ProfileView'));
const PlayView = React.lazy(() => import('./Views/Play/PlayView'));
const ClubsView = React.lazy(() => import('./Views/Clubs/ClubsView'));
const CreateClubView = React.lazy(() => import('./Views/Clubs/CreateClubView'));
const ViewClubView = React.lazy(() => import('./Views/Clubs/ViewClubView'));
const EditClubView = React.lazy(() => import('./Views/Clubs/EditClubView'));
const GameDayControlView = React.lazy(() => import('./Views/Admin/GameDayControlView'));
const CourtSchedulerView = React.lazy(() => import('./Views/CourtSchedulerView'));
const AdminPanel = React.lazy(() => import('./Views/Admin/AdminPanel'));
const CommunityPlayView = React.lazy(() => import('./Views/Play/CommunityPlayView'));
const CreateRoundRobinSetView = React.lazy(() => import('./Views/Play/Create/CreateRoundRobinSetView'));
const ViewEvent = React.lazy(() => import('./Views/Play/ViewEvent'));
const FindLeagueView = React.lazy(() => import('./Views/Leagues/FindLeagueView'));
const LeaguePublicView = React.lazy(() => import('./Views/Leagues/LeaguePublicView'));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" />
        <React.Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="signin" element={<SignInView />} />
              <Route path="signup" element={<SignUpView />} />
              <Route path="forgot-password" element={<ForgotPasswordView />} />
              <Route path="reset-password" element={<ResetPasswordView />} />
              <Route path="accept-invite/:token" element={<AcceptInviteView />} />
              <Route path="leagues/:id/view" element={<LeaguePublicView />} />
              
              {/* Protected Routes */}
              <Route element={<AuthLayout />}>
                <Route index element={<HomeView />} />
                <Route path="leagues" element={<MyLeaguesView />} />
                <Route path="leagues/create" element={<CreateLeagueView />} />
                <Route path="leagues/:id" element={<LeagueOverviewLayout />}>
                  <Route index element={<LeagueOverviewTab />} />
                  <Route path="players" element={<LeaguePlayersTab />} />
                  <Route path="game-days" element={<LeagueGameDaysTab />} />
                  <Route path="rankings" element={<LeagueRankingsTab />} />
                  <Route path="weekly" element={<LeagueWeeklyPerformanceTab />} />
                  <Route path="next-week" element={<LeagueNextWeekTab />} />
                  <Route path="join-requests" element={<LeagueJoinRequests />} />
                  <Route path="*" element={<Navigate to="." />} />
                </Route>
                <Route path="leagues/:id/edit" element={<EditLeagueView />} />
                <Route path="clubs" element={<ClubsView />} />
                <Route path="clubs/:id" element={<ViewClubView />} />
                <Route path="clubs/:id/edit" element={<EditClubView />} />
                <Route path="clubs/create" element={<CreateClubView />} />
                <Route path="players" element={<PlayersView />} />
                <Route path="profile" element={<ProfileView />} />
                <Route path="standings" element={<StandingsView />} />
                <Route path="play" element={<CommunityPlayView />} />
                <Route path="play/create/round-robin-set" element={<CreateRoundRobinSetView />} />
                <Route path="play/event/:id" element={<ViewEvent />} />
                <Route path="admin/game-day" element={<GameDayControlView />} />
                <Route path="leagues/:leagueId/game-day/:gameDayId/scheduler" element={<CourtSchedulerView />} />
                <Route path="leagues/:leagueId/game-day/:gameDayId/scoring" element={<GameDayScoringView />} />
                <Route path="admin" element={<AdminPanel />} />
                <Route path="leagues/find" element={<FindLeagueView />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </React.Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
