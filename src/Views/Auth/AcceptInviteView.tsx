import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import SignUpView from './SignUpView';
import { useAuth } from '../../components/Contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Mail } from 'lucide-react';

interface AcceptInviteViewProps {
  token?: string;
  onNavigate?: (path: string) => void;
}

const AcceptInviteView: React.FC<AcceptInviteViewProps> = ({ token, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Convex queries and mutations
  const invite = useQuery(api.playerFunctions.getInviteByToken, 
    token ? { token } : 'skip'
  );
  
  const acceptInvite = useMutation(api.playerFunctions.acceptInvite);

  // Handle invite data loading
  useEffect(() => {
    if (!token) {
      setError('No invite token provided.');
      setLoading(false);
      return;
    }

    if (invite === undefined) {
      // Still loading
      return;
    }

    if (invite === null) {
      setError('Invalid or expired invite token.');
      setLoading(false);
      return;
    }

    // Check if invite is expired
    if (invite.invite_expires_at && new Date(invite.invite_expires_at) < new Date()) {
      setError('This invite has expired.');
      setLoading(false);
      return;
    }

    setLoading(false);
  }, [token, invite]);

  // Handle invite acceptance for authenticated users
  useEffect(() => {
    const handleAcceptInvite = async () => {
      if (!user || !invite || accepting || !token) return;
      
      setAccepting(true);
      try {
        await acceptInvite({ 
          token,
          leagueId: invite.league_id,
          playerId: user._id
        });

        // Success! Redirect to the league
        if (onNavigate) {
          onNavigate(`/leagues/${invite.league_id}`);
        }
      } catch (err) {
        console.error('Error accepting invite:', err);
        setError('Failed to accept invite. Please try again.');
        setAccepting(false);
      }
    };

    if (user && invite && !loading) {
      handleAcceptInvite();
    }
  }, [user, invite, token, accepting, loading, acceptInvite, onNavigate]);

  if (loading || authLoading) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-error-600">Invalid Invite</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
          </CardBody>
          <CardFooter className="flex justify-center">
            <Button onClick={() => onNavigate?.('/')}>
              Go Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-error-600">Invite Not Found</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              The invite you're looking for doesn't exist or has been removed.
            </p>
          </CardBody>
          <CardFooter className="flex justify-center">
            <Button onClick={() => onNavigate?.('/')}>
              Go Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If user is authenticated, show accepting message
  if (user && !accepting) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Accepting your invite...</p>
        </div>
      </div>
    );
  }

  // For unauthenticated users, show sign up/sign in options
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle>You're Invited!</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You've been invited to join a league
            </p>
          </CardHeader>
          <CardBody>
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                To accept this invite, you'll need to create an account or sign in.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                className="w-full"
                variant="outline"
                leftIcon={<Mail size={16} />}
                onClick={() => onNavigate?.(`/signin?inviteToken=${token}&leagueId=${invite.league_id}`)}
              >
                I already have an account
              </Button>
              <div className="text-center text-sm text-gray-500">or</div>
            </div>
          </CardBody>
        </Card>

        <SignUpView
          prefillEmail={undefined}
          prefillFirstName={undefined}
          prefillLastName={undefined}
          emailLocked={false}
          inviteToken={token}
          leagueId={invite.league_id}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
};

export default AcceptInviteView; 