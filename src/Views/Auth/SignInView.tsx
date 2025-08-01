import React, { useState } from 'react';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../../components/ui/Card';
import { useAuth } from '../../components/Contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface SignInViewProps {
  onNavigate?: (path: string, state?: any) => void;
  location?: {
    search: string;
    state?: any;
  };
}

const SignInView: React.FC<SignInViewProps> = ({ onNavigate, location }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Parse URL parameters
  const params = new URLSearchParams(location?.search || '');
  const redirect = params.get('redirect');
  const from = location?.state?.from?.pathname || redirect || '/';
  const inviteToken = params.get('inviteToken');
  const leagueId = params.get('leagueId');

  const isMobile = /Mobi|Android/i.test(window.navigator.userAgent);

  // Convex queries for user permissions
  const userProfile = useQuery(api.authFunctions.getUserProfile, 
    email ? { email } : 'skip'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log('[SignInView] Starting authentication for mobile:', isMobile);
      
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error('[SignInView] Authentication error:', error);
        setError(error.message);
        setIsLoading(false);
        return;
      }
      
      console.log('[SignInView] Authentication successful');
      
      // Add a small delay for mobile to ensure auth state is properly set
      if (isMobile) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Custom redirect logic for league deep links
      const leagueViewMatch = from.match(/^\/leagues\/(.+)\/view$/);
      if (leagueViewMatch) {
        const leagueIdFromUrl = leagueViewMatch[1];
        
        // For now, we'll use a simple redirect since we don't have the complex permission checking
        // In a real implementation, you would check user permissions here
        if (onNavigate) {
          onNavigate(`/leagues/${leagueIdFromUrl}`, { replace: true });
        }
      } else {
        // Handle invite token if present
        if (inviteToken && leagueId) {
          if (onNavigate) {
            onNavigate(`/leagues/${leagueId}`, { replace: true });
          }
        } else {
          if (onNavigate) {
            onNavigate(from, { replace: true });
          }
        }
      }
    } catch (err) {
      console.error('[SignInView] Sign in error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Sign In</CardTitle>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your credentials to access your account
            </p>
          </CardHeader>
          <CardBody>
            {error && (
              <div className="mb-4 rounded-md bg-error-50 p-4 text-sm text-error-600 dark:bg-error-900/30 dark:text-error-400">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input
                  id="email"
                  type="email"
                  label="Email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  leftIcon={<Mail size={16} />}
                />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  leftIcon={<Lock size={16} />}
                  rightIcon={
                    <button
                      type="button"
                      tabIndex={-1}
                      className="focus:outline-none"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => onNavigate?.('/forgot-password')}
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="mt-6 w-full"
                isLoading={isLoading}
                leftIcon={<LogIn size={16} />}
              >
                Sign In
              </Button>
            </form>
          </CardBody>
          <CardFooter className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={() => onNavigate?.('/signup')}
                className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Sign up
              </button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SignInView;