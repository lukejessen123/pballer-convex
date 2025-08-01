import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  useLeaguesByCreator, 
  usePendingJoinRequests, 
  useUpdateJoinRequestStatus, 
  useCreateAnnouncement,
  JoinRequest 
} from '../../services/adminService';
import { Id } from '../../../convex/_generated/dataModel';

const LeagueJoinRequests: React.FC = () => {
  const { user, profileId } = useAuth();
  const [processing, setProcessing] = useState<string | null>(null);
  const [decisionModal, setDecisionModal] = useState<{
    request: JoinRequest;
    approve: boolean;
  } | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Convex hooks
  const leagues = useLeaguesByCreator(profileId as Id<"profiles">);
  const leagueIds = leagues?.map(league => league._id) || [];
  const requests = usePendingJoinRequests(leagueIds);
  const updateJoinRequestStatus = useUpdateJoinRequestStatus();
  const createAnnouncement = useCreateAnnouncement();

  const handleDecision = async (request: JoinRequest, approve: boolean, message?: string) => {
    if (!profileId) {
      toast.error('User profile not found');
      return;
    }

    setProcessing(request._id);
    setSubmittingDecision(true);
    
    try {
      const newStatus = approve ? 'joined' : 'rejected';
      const joinedAt = approve ? new Date().toISOString() : undefined;
      
      // Update the join request status
      await updateJoinRequestStatus({
        requestId: request._id,
        status: newStatus,
        joinedAt,
      });

      toast.success(approve ? 'Player approved!' : 'Request rejected.');

      // Create announcement to notify the player
      const defaultMsg = approve
        ? `Your request to join the league "${request.league?.name}" has been approved!`
        : `Your request to join the league "${request.league?.name}" was not approved.`;
      
      let fullMsg = defaultMsg;
      if (message && message.trim()) {
        fullMsg = `${defaultMsg}\n\n${message.trim()}`;
      }

      await createAnnouncement({
        title: approve ? 'Join Request Approved' : 'Join Request Rejected',
        message: fullMsg,
        leagueId: request.league_id,
        createdBy: profileId as Id<"profiles">,
        targetRole: 'player',
        isGlobal: false,
        pinned: false,
        targetUserId: request.player_id,
      });

    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Failed to update request');
    } finally {
      setProcessing(null);
      setSubmittingDecision(false);
      setDecisionModal(null);
      setCustomMessage('');
    }
  };

  // Helper function to format timestamp
  const formatInvitedAt = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString();
  };

  // Show loading state while fetching data
  if (leagues === undefined || requests === undefined) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Pending League Join Requests</h2>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Pending League Join Requests</h2>
      
      {/* Modal for custom message */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
              {decisionModal.approve ? 'Approve' : 'Reject'} Join Request
            </h3>
            <p className="mb-2 text-gray-700 dark:text-gray-300">
              {decisionModal.approve
                ? `Send a message to the player letting them know they've been approved to join "${decisionModal.request.league?.name}".`
                : `Send a message to the player letting them know their request to join "${decisionModal.request.league?.name}" was not approved.`}
            </p>
            <textarea
              className="w-full rounded border border-gray-300 dark:border-gray-700 px-3 py-2 mb-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              rows={4}
              placeholder={decisionModal.approve
                ? `Your request to join the league "${decisionModal.request.league?.name}" has been approved!`
                : `Your request to join the league "${decisionModal.request.league?.name}" was not approved.`}
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              maxLength={500}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-white"
                onClick={() => {
                  setDecisionModal(null);
                  setCustomMessage('');
                }}
                disabled={submittingDecision}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded ${decisionModal.approve ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                onClick={() => handleDecision(decisionModal.request, decisionModal.approve, customMessage)}
                disabled={submittingDecision}
              >
                {submittingDecision ? 'Sending...' : decisionModal.approve ? 'Approve & Send' : 'Reject & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {requests.length === 0 ? (
        <div className="text-center text-gray-500">No pending join requests.</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">Player</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">DUPR</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">League</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">Requested At</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {requests.map(req => (
              <tr key={req._id}>
                <td className="px-4 py-2 text-white">{req.player?.first_name} {req.player?.last_name}</td>
                <td className="px-4 py-2 text-white">{req.player?.email}</td>
                <td className="px-4 py-2 text-white">{typeof req.player?.dup_rating === 'number' ? req.player.dup_rating.toFixed(1) : '-'}</td>
                <td className="px-4 py-2 text-white">{req.league?.name}</td>
                <td className="px-4 py-2 text-white">{formatInvitedAt(req.invited_at)}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded disabled:opacity-60"
                    onClick={() => setDecisionModal({ request: req, approve: true })}
                    disabled={processing === req._id}
                  >
                    Approve
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded disabled:opacity-60"
                    onClick={() => setDecisionModal({ request: req, approve: false })}
                    disabled={processing === req._id}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LeagueJoinRequests; 