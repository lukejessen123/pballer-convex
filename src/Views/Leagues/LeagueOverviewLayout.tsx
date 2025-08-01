import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

const LeagueOverviewLayout: React.FC = () => {
  const { id } = useParams();
  const { user, profileId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [pendingJoinCount, setPendingJoinCount] = useState(0);

  useEffect(() => {
    if (!user || !profileId) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    const fetchAdminStatus = async () => {
      if (!profileId || !id) return;

      // Check super admin
      const { data: superAdminData } = await supabase
        .from('super_admins')
        .select('id')
        .eq('id', profileId)
        .single();
      setIsSuperAdmin(!!superAdminData);

      // Check league admin
      const { data: leagueData } = await supabase
        .from('leagues')
        .select('club_id, created_by')
        .eq('id', id)
        .single();

      if (leagueData?.club_id) {
        const { data: clubData } = await supabase
          .from('clubs')
          .select('created_by, admins')
          .eq('id', leagueData.club_id)
          .single();
        setIsAdmin(
          clubData?.created_by === profileId ||
          (clubData?.admins || []).includes(profileId)
        );
      } else {
        setIsAdmin(leagueData?.created_by === profileId);
      }
    };
    fetchAdminStatus();

    // Fetch pending join requests count for this league
    const fetchPendingJoinCount = async () => {
      if (!id) return;
      const { count } = await supabase
        .from('league_players')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('league_id', id);
      setPendingJoinCount(count || 0);
    };
    fetchPendingJoinCount();
  }, [user, profileId, id, navigate, location.pathname]);

  // Show tabs for all users, with Game Days between Overview and Rankings
  const tabs = [
    { label: 'Overview', to: '' },
    { label: 'Game Days', to: 'game-days' },
    ...(isAdmin || isSuperAdmin ? [
      { label: 'Players', to: 'players' },
    ] : []),
    { label: 'Rankings', to: 'rankings' },
    // Show Join Requests only for super admin, after Rankings
    ...(isSuperAdmin ? [
      { label: (
        <span>
          Join Requests
          {pendingJoinCount > 0 && (
            <span className="ml-2 inline-block bg-red-600 text-white text-xs rounded-full px-2 py-0.5 font-bold align-top">{pendingJoinCount}</span>
          )}
        </span>
      ), to: 'join-requests' }
    ] : []),
  ];

  return (
    <div className="container mx-auto py-8">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 mb-6">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to === '' ? `/leagues/${id}` : `/leagues/${id}/${tab.to}`}
            end={tab.to === ''}
            className={({ isActive }) =>
              `px-4 py-2 font-medium transition-colors ${
                isActive
                  ? 'border-b-2 border-primary-500 text-primary-500'
                  : 'text-gray-400 hover:text-primary-400'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      {/* Tab Content */}
      <Outlet />
    </div>
  );
};

export default LeagueOverviewLayout; 