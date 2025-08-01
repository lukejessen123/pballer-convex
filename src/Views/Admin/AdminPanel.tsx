import React, { useEffect, useState, useContext } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '../../components/Contexts/AuthContext';
import LeagueJoinRequests from '../../components/admin/LeagueJoinRequests';
import { AnnouncementContext } from '../../components/Layout/Header';

const ROLE_OPTIONS = [
  'player',
  'club_admin',
  'league_creator',
  'super_admin',
];

const AdminPanel: React.FC = () => {
  const { user, isSuperAdmin, isLeagueCreator, loading } = useAuth();
  console.log('AuthContext:', { user, isSuperAdmin, isLeagueCreator });
  const [tab, setTab] = useState<'users' | 'leagues' | 'announcements' | 'joinRequests'>('users');
  const [userSearch, setUserSearch] = useState('');
  const [userSuccess, setUserSuccess] = useState<string | null>(null);
  const [creatorFilter, setCreatorFilter] = useState<string>('');
  
  // Modal state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  const [announcementSuccess, setAnnouncementSuccess] = useState<string | null>(null);
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAnnouncementId, setEditAnnouncementId] = useState<Id<"announcements"> | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  // Add new state for league, role, and global targeting
  const [announcementLeagueId, setAnnouncementLeagueId] = useState<Id<"leagues"> | null>(null);
  const [announcementTargetRole, setAnnouncementTargetRole] = useState<string | null>(null);
  const [announcementIsGlobal, setAnnouncementIsGlobal] = useState(false);
  // For edit modal
  const [editLeagueId, setEditLeagueId] = useState<Id<"leagues"> | null>(null);
  const [editTargetRole, setEditTargetRole] = useState<string | null>(null);
  const [editIsGlobal, setEditIsGlobal] = useState(false);
  // Add state for pinning and expiration
  const [announcementPinned, setAnnouncementPinned] = useState(false);
  const [announcementExpiresAt, setAnnouncementExpiresAt] = useState<string>('');
  const [editPinned, setEditPinned] = useState(false);
  const [editExpiresAt, setEditExpiresAt] = useState<string>('');

  const { refreshAnnouncements } = useContext(AnnouncementContext);

  // Convex queries and mutations
  const users = useQuery(api.adminFunctions.getAllUsers);
  const leagues = useQuery(api.adminFunctions.getLeaguesForAdmin, 
    user ? { userId: user._id } : 'skip'
  );
  const announcements = useQuery(api.adminFunctions.getAnnouncementsForAdmin,
    user ? { userId: user._id } : 'skip'
  );
  const pendingJoinCount = useQuery(api.adminFunctions.getPendingJoinCount,
    user ? { userId: user._id } : 'skip'
  );

  // Mutations
  const updateUserRole = useMutation(api.adminFunctions.updateUserRole);
  const updateUserActive = useMutation(api.adminFunctions.updateUserActive);
  const deleteUser = useMutation(api.adminFunctions.deleteUser);
  const createAnnouncement = useMutation(api.adminFunctions.createAnnouncement);
  const updateAnnouncement = useMutation(api.adminFunctions.updateAnnouncement);
  const deleteAnnouncement = useMutation(api.adminFunctions.deleteAnnouncement);

  // Ensure default league is set for league_creators with only one league when modal opens
  useEffect(() => {
    if (
      showAnnouncementModal &&
      isLeagueCreator &&
      !isSuperAdmin &&
      leagues &&
      leagues.length === 1 &&
      !announcementLeagueId
    ) {
      setAnnouncementLeagueId(leagues[0]._id);
    }
  }, [showAnnouncementModal, isLeagueCreator, isSuperAdmin, leagues, announcementLeagueId]);

  // Add or update this useEffect to always set a default league when the modal opens and leagues are available
  useEffect(() => {
    if (
      showAnnouncementModal &&
      !announcementIsGlobal &&
      leagues &&
      leagues.length > 0 &&
      !announcementLeagueId
    ) {
      setAnnouncementLeagueId(leagues[0]._id);
    }
  }, [showAnnouncementModal, announcementIsGlobal, leagues, announcementLeagueId]);

  // --- User Actions ---
  const handleRoleChange = async (userId: Id<"profiles">, newRole: string) => {
    try {
      await updateUserRole({ userId, role: newRole });
      setUserSuccess('Role updated!');
      setTimeout(() => setUserSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleActivate = async (userId: Id<"profiles">, active: boolean) => {
    if (!active) {
      if (!window.confirm('Are you sure you want to inactivate this user?')) return;
    }
    
    try {
      await updateUserActive({ userId, active });
      setUserSuccess(active ? 'User activated!' : 'User inactivated!');
      setTimeout(() => setUserSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleDeleteUser = async (userId: Id<"profiles">) => {
    if (!window.confirm('Are you sure you want to delete this user? This action is permanent and will remove their authentication and profile data.')) return;
    
    try {
      await deleteUser({ userId });
      setUserSuccess('User deleted successfully!');
      setTimeout(() => setUserSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // --- League Actions (stub) ---
  const handleDeleteLeague = async (leagueId: Id<"leagues">) => {
    if (!window.confirm('Are you sure you want to delete this league?')) return;
    // TODO: Implement real delete logic
    console.log('Delete league:', leagueId);
  };

  // --- Create Announcement Logic ---
  const handleCreateAnnouncement = () => {
    setAnnouncementTitle('');
    setAnnouncementMessage('');
    setAnnouncementError(null);
    setAnnouncementSuccess(null);
    if (isLeagueCreator && !isSuperAdmin && leagues && leagues.length === 1) {
      setAnnouncementLeagueId(leagues[0]._id);
    } else {
      setAnnouncementLeagueId(null);
    }
    setAnnouncementTargetRole(null);
    setAnnouncementIsGlobal(false);
    setAnnouncementPinned(false);
    setAnnouncementExpiresAt('');
    setShowAnnouncementModal(true);
  };

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnouncementError(null);
    setAnnouncementSuccess(null);
    setAnnouncementSubmitting(true);
    
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      setAnnouncementError('Title and message are required.');
      setAnnouncementSubmitting(false);
      return;
    }
    
    if (!isSuperAdmin && isLeagueCreator && !announcementLeagueId) {
      setAnnouncementError('You must select a league for this announcement.');
      setAnnouncementSubmitting(false);
      return;
    }

    try {
      await createAnnouncement({
        title: announcementTitle,
        message: announcementMessage,
        leagueId: announcementLeagueId || undefined,
        targetRole: announcementTargetRole || undefined,
        isGlobal: isSuperAdmin ? (announcementIsGlobal || announcementLeagueId === null) : false,
        pinned: announcementPinned,
        expiresAt: announcementExpiresAt ? new Date(announcementExpiresAt).toISOString() : undefined,
      });
      
      setAnnouncementSuccess('Announcement created!');
      setShowAnnouncementModal(false);
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      if (refreshAnnouncements) refreshAnnouncements();
    } catch (error) {
      setAnnouncementError('Failed to create announcement');
      console.error('Error creating announcement:', error);
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  // --- Filtered Users ---
  const filteredUsers = users?.filter(u =>
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(userSearch.toLowerCase())
  ) || [];

  // --- Edit Announcement Logic ---
  const handleEditAnnouncement = (a: any) => {
    setEditAnnouncementId(a._id);
    setEditTitle(a.title);
    setEditMessage(a.message);
    setEditLeagueId(a.league_id || null);
    setEditTargetRole(a.target_role || null);
    setEditIsGlobal(a.is_global || false);
    setEditPinned(a.pinned || false);
    setEditExpiresAt(a.expires_at ? a.expires_at.slice(0, 16) : ''); // for datetime-local input
    setEditError(null);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSubmitting(true);
    
    if (!editTitle.trim() || !editMessage.trim()) {
      setEditError('Title and message are required.');
      setEditSubmitting(false);
      return;
    }

    try {
      await updateAnnouncement({
        announcementId: editAnnouncementId!,
        title: editTitle,
        message: editMessage,
        leagueId: editIsGlobal ? undefined : (editLeagueId || undefined),
        targetRole: editTargetRole || undefined,
        isGlobal: editIsGlobal,
        pinned: editPinned,
        expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : undefined,
      });
      
      setShowEditModal(false);
      setEditAnnouncementId(null);
      setEditTitle('');
      setEditMessage('');
      if (refreshAnnouncements) refreshAnnouncements();
    } catch (error) {
      setEditError('Failed to update announcement');
      console.error('Error updating announcement:', error);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: Id<"announcements">) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    
    try {
      await deleteAnnouncement({ announcementId: id });
      if (refreshAnnouncements) refreshAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  // --- Conditional rendering after all hooks ---
  if (loading || (isSuperAdmin === null && isLeagueCreator === null)) {
    return <div className="p-8 text-white">Loading...</div>;
  }
  if (!isSuperAdmin && !isLeagueCreator) {
    return <div className="p-8 text-red-500">Access denied. Super Admins or League Creators only.</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Admin Panel</h1>
      <div className="flex gap-4 mb-6">
        {isSuperAdmin && (
          <>
            <button className={`px-4 py-2 rounded ${tab === 'users' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-200'}`} onClick={() => setTab('users')}>Users</button>
            <button className={`px-4 py-2 rounded ${tab === 'leagues' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-200'}`} onClick={() => setTab('leagues')}>Leagues</button>
            <button className={`relative px-4 py-2 rounded ${tab === 'joinRequests' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-200'}`} onClick={() => setTab('joinRequests')}>
              Join Requests
              {pendingJoinCount && pendingJoinCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5 font-bold shadow">{pendingJoinCount}</span>
              )}
            </button>
          </>
        )}
        {(isSuperAdmin || isLeagueCreator) && (
          <button className={`px-4 py-2 rounded ${tab === 'announcements' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-200'}`} onClick={() => setTab('announcements')}>Announcements</button>
        )}
      </div>
      {/* --- Success/Error Messages --- */}
      {userSuccess && <div className="text-green-500 mb-2">{userSuccess}</div>}
      {/* --- Users Tab --- */}
      {isSuperAdmin && tab === 'users' && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="rounded bg-gray-800 text-white border border-gray-700 px-3 py-2 w-80"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-900 rounded-lg">
              <thead>
                <tr className="text-gray-300">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Active</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!users ? (
                  <tr><td colSpan={5} className="text-center py-4 text-white">Loading...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-4 text-white">No users found.</td></tr>
                ) : filteredUsers.map(u => (
                  <tr key={u._id} className="border-b border-gray-800">
                    <td className="px-4 py-2 text-white">{u.first_name} {u.last_name}</td>
                    <td className="px-4 py-2 text-white">{u.email}</td>
                    <td className="px-4 py-2">
                      <select
                        className="rounded bg-gray-800 text-white border border-gray-700 px-2 py-1"
                        value={u.role || 'player'}
                        onChange={e => handleRoleChange(u._id, e.target.value)}
                        disabled={u._id === user?._id}
                      >
                        {ROLE_OPTIONS.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className={`px-2 py-1 rounded ${u.active ? 'bg-green-600' : 'bg-gray-600'} text-white`}
                        onClick={() => handleActivate(u._id, !u.active)}
                        disabled={u._id === user?._id}
                      >
                        {u.active ? 'Inactivate' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className="px-2 py-1 rounded bg-red-600 text-white"
                        onClick={() => handleDeleteUser(u._id)}
                        disabled={u._id === user?._id}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* --- Leagues Tab --- */}
      {isSuperAdmin && tab === 'leagues' && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter by creator name or email..."
              value={creatorFilter}
              onChange={e => setCreatorFilter(e.target.value)}
              className="rounded bg-gray-800 text-white border border-gray-700 px-3 py-2 w-80"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-900 rounded-lg">
              <thead>
                <tr className="text-gray-300">
                  <th className="px-4 py-2">League Name</th>
                  <th className="px-4 py-2">Start Date</th>
                  <th className="px-4 py-2">Creator</th>
                  <th className="px-4 py-2">Creator Email</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!leagues ? (
                  <tr><td colSpan={5} className="text-center py-4 text-white">Loading...</td></tr>
                ) : leagues.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-4 text-white">No leagues found.</td></tr>
                ) : leagues
                  .filter(l =>
                    !creatorFilter ||
                    ((l.creator?.first_name + ' ' + l.creator?.last_name).toLowerCase().includes(creatorFilter.toLowerCase())) ||
                    (l.creator?.email || '').toLowerCase().includes(creatorFilter.toLowerCase())
                  )
                  .map(league => (
                  <tr key={league._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="px-4 py-2 text-white font-semibold">{league.name}</td>
                    <td className="px-4 py-2 text-white">{league.start_date || '-'}</td>
                    <td className="px-4 py-2 text-white">{league.creator?.first_name} {league.creator?.last_name}</td>
                    <td className="px-4 py-2 text-white">{league.creator?.email}</td>
                    <td className="px-4 py-2">
                      {(league.created_by === user?._id || isSuperAdmin) && (
                        <button
                          className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                          onClick={() => handleDeleteLeague(league._id)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* --- Announcements Tab --- */}
      {(isSuperAdmin || isLeagueCreator) && tab === 'announcements' && (
        <div>
          <div className="mb-4">
            <button
              className="px-4 py-2 rounded bg-teal-600 text-white"
              onClick={handleCreateAnnouncement}
              disabled={!(isSuperAdmin || isLeagueCreator)}
            >
              + Create Announcement
            </button>
          </div>
          {/* Modal for creating announcement */}
          {showAnnouncementModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
                <h2 className="text-xl font-bold mb-4">Create Announcement</h2>
                <form onSubmit={handleAnnouncementSubmit}>
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      value={announcementTitle}
                      onChange={e => setAnnouncementTitle(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-1">Message</label>
                    <textarea
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      value={announcementMessage}
                      onChange={e => setAnnouncementMessage(e.target.value)}
                      rows={4}
                      maxLength={1000}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-1">Target League</label>
                    <select
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      value={announcementLeagueId || ''}
                      onChange={e => {
                        const value = e.target.value;
                        setAnnouncementLeagueId(value ? (value as Id<"leagues">) : null);
                        if (isSuperAdmin) {
                          if (value === '') {
                            setAnnouncementIsGlobal(true);
                          } else {
                            setAnnouncementIsGlobal(false);
                          }
                        }
                      }}
                    >
                      {isSuperAdmin && <option value="">All Leagues</option>}
                      {leagues?.map((l: any) => (
                        <option key={l._id} value={l._id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-1">Target Role</label>
                    <select
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      value={announcementTargetRole || ''}
                      onChange={e => setAnnouncementTargetRole(e.target.value || null)}
                    >
                      <option value="">All Roles</option>
                      {ROLE_OPTIONS.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  {isSuperAdmin && (
                    <div className="mb-3 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isGlobal"
                        checked={announcementIsGlobal}
                        onChange={e => {
                          setAnnouncementIsGlobal(e.target.checked);
                          if (e.target.checked) {
                            setAnnouncementLeagueId(null);
                          } else if (!announcementLeagueId && leagues && leagues.length > 0) {
                            setAnnouncementLeagueId(leagues[0]._id);
                          }
                        }}
                      />
                      <label htmlFor="isGlobal" className="text-gray-700">Global Announcement (all users)</label>
                    </div>
                  )}
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="pinned"
                      checked={announcementPinned}
                      onChange={e => setAnnouncementPinned(e.target.checked)}
                    />
                    <label htmlFor="pinned" className="text-gray-700">Pin this announcement</label>
                  </div>
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-1">Expiration Date (optional)</label>
                    <input
                      type="datetime-local"
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      value={announcementExpiresAt}
                      onChange={e => setAnnouncementExpiresAt(e.target.value)}
                    />
                  </div>
                  {announcementError && <div className="text-red-500 mb-2">{announcementError}</div>}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-gray-300 text-gray-800"
                      onClick={() => setShowAnnouncementModal(false)}
                      disabled={announcementSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-teal-600 text-white"
                      disabled={announcementSubmitting}
                    >
                      {announcementSubmitting ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-900 rounded-lg">
              <thead>
                <tr className="text-gray-300">
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Message</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Pinned</th>
                  <th className="px-4 py-2">Expires</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!announcements ? (
                  <tr><td colSpan={6} className="text-center py-4 text-white">Loading...</td></tr>
                ) : announcements.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4 text-white">No announcements found.</td></tr>
                ) : (
                  isSuperAdmin
                    ? announcements.map(a => (
                        <tr key={a._id} className="border-b border-gray-800">
                          <td className="px-4 py-2 text-white">{a.title}</td>
                          <td className="px-4 py-2 text-white">{a.message}</td>
                          <td className="px-4 py-2 text-white">{a._creationTime ? new Date(a._creationTime).toLocaleString() : '-'}</td>
                          <td className="px-4 py-2 text-white">{a.pinned ? '📌' : ''}</td>
                          <td className="px-4 py-2 text-white">{a.expires_at ? new Date(a.expires_at).toLocaleString() : '-'}</td>
                          <td className="px-4 py-2">
                            <button
                              className="px-2 py-1 rounded bg-blue-600 text-white mr-2"
                              onClick={() => handleEditAnnouncement(a)}
                              disabled={!isSuperAdmin}
                            >Edit</button>
                            <button
                              className="px-2 py-1 rounded bg-red-600 text-white"
                              onClick={() => handleDeleteAnnouncement(a._id)}
                              disabled={!isSuperAdmin}
                            >Delete</button>
                          </td>
                        </tr>
                      ))
                    : announcements.map(a => (
                        <tr key={a._id} className="border-b border-gray-800">
                          <td className="px-4 py-2 text-white">{a.title}</td>
                          <td className="px-4 py-2 text-white">{a.message}</td>
                          <td className="px-4 py-2 text-white">{a._creationTime ? new Date(a._creationTime).toLocaleString() : '-'}</td>
                          <td className="px-4 py-2 text-white">{a.pinned ? '📌' : ''}</td>
                          <td className="px-4 py-2 text-white">{a.expires_at ? new Date(a.expires_at).toLocaleString() : '-'}</td>
                          <td className="px-4 py-2">
                            <button
                              className="px-2 py-1 rounded bg-blue-600 text-white mr-2"
                              onClick={() => handleEditAnnouncement(a)}
                              disabled={false}
                            >Edit</button>
                            <button
                              className="px-2 py-1 rounded bg-red-600 text-white"
                              onClick={() => handleDeleteAnnouncement(a._id)}
                              disabled={false}
                            >Delete</button>
                          </td>
                        </tr>
                      ))
                )}
              </tbody>
            </table>
          </div>
          {/* Edit Announcement Modal */}
          {showEditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
                <h2 className="text-xl font-bold mb-4">Edit Announcement</h2>
                <form onSubmit={handleEditSubmit}>
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-1">Message</label>
                    <textarea
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      value={editMessage}
                      onChange={e => setEditMessage(e.target.value)}
                      rows={4}
                      maxLength={1000}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-1">Target League</label>
                    <select
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      value={editLeagueId || ''}
                      onChange={e => setEditLeagueId(e.target.value ? (e.target.value as Id<"leagues">) : null)}
                      disabled={editIsGlobal}
                    >
                      <option value="">All Leagues</option>
                      {leagues?.map((l: any) => (
                        <option key={l._id} value={l._id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-1">Target Role</label>
                    <select
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      value={editTargetRole || ''}
                      onChange={e => setEditTargetRole(e.target.value || null)}
                    >
                      <option value="">All Roles</option>
                      {ROLE_OPTIONS.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editIsGlobal"
                      checked={editIsGlobal}
                      onChange={e => setEditIsGlobal(e.target.checked)}
                    />
                    <label htmlFor="editIsGlobal" className="text-gray-700">Global Announcement (all users)</label>
                  </div>
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editPinned"
                      checked={editPinned}
                      onChange={e => setEditPinned(e.target.checked)}
                    />
                    <label htmlFor="editPinned" className="text-gray-700">Pin this announcement</label>
                  </div>
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-1">Expiration Date (optional)</label>
                    <input
                      type="datetime-local"
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      value={editExpiresAt}
                      onChange={e => setEditExpiresAt(e.target.value)}
                    />
                  </div>
                  {editError && <div className="text-red-500 mb-2">{editError}</div>}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-gray-300 text-gray-800"
                      onClick={() => setShowEditModal(false)}
                      disabled={editSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-blue-600 text-white"
                      disabled={editSubmitting}
                    >
                      {editSubmitting ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
      {isSuperAdmin && tab === 'joinRequests' && (
        <LeagueJoinRequests />
      )}
    </div>
  );
};

export default AdminPanel; 