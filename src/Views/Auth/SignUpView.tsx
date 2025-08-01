import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '../../components/ui/Card';
import { useAuth } from '../../components/Contexts/AuthContext';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';

interface SignUpViewProps {
  prefillEmail?: string;
  prefillFirstName?: string;
  prefillLastName?: string;
  emailLocked?: boolean;
  inviteToken?: string;
  leagueId?: string;
  onNavigate?: (path: string) => void;
}

const SignUpView: React.FC<SignUpViewProps> = (props) => {
  const [formData, setFormData] = useState({
    firstName: props.prefillFirstName || '',
    lastName: props.prefillLastName || '',
    email: props.prefillEmail || '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const [showCheckEmailMessage, setShowCheckEmailMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Convex mutations
  const registerProfile = useMutation(api.authFunctions.registerProfile);
  const acceptInvite = useMutation(api.playerFunctions.acceptInvite);

  useEffect(() => {
    // If props change (e.g., AcceptInviteView loads), update formData
    setFormData((prev) => ({
      ...prev,
      firstName: props.prefillFirstName || '',
      lastName: props.prefillLastName || '',
      email: props.prefillEmail || '',
    }));
  }, [props.prefillEmail, props.prefillFirstName, props.prefillLastName]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      // Sign up the user
      const { data, error } = await signUp(formData.email, formData.password);
      
      if (error) {
        // Check for duplicate email error codes
        if (error.code === 'user_already_exists' || error.code === 'email_exists') {
          setError('Email already in use. Please sign in.');
        } else {
          setError(error.message);
        }
        setIsLoading(false);
        return;
      }

      // Register profile and handle invite
      try {
        await registerProfile({
          userId: data.user._id,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
        });

        // Handle invite acceptance if present
        if (props.inviteToken && props.leagueId) {
          await acceptInvite({
            token: props.inviteToken,
            leagueId: props.leagueId as Id<"leagues">,
            playerId: data.user._id,
          });
        }

        setShowCheckEmailMessage(true);
      } catch (profileErr) {
        setError('Account created, but failed to link invite/profile. Please contact support.');
        console.error('Profile registration error:', profileErr);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (showCheckEmailMessage) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Check Your Email</CardTitle>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Please check your email (and spam folder) and verify your account to log in.
              </p>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button onClick={() => props.onNavigate?.('/signin')}>Back to Sign In</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Create an Account</CardTitle>
          </CardHeader>
          <CardBody>
            {error && (
              <div className="mb-4 rounded-md bg-error-50 p-4 text-sm text-error-600 dark:bg-error-900/30 dark:text-error-400">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    id="firstName"
                    type="text"
                    label="First Name"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    leftIcon={<User size={16} />}
                  />
                  <Input
                    id="lastName"
                    type="text"
                    label="Last Name"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                    leftIcon={<User size={16} />}
                  />
                </div>
                <Input
                  id="email"
                  type="email"
                  label="Email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  leftIcon={<Mail size={16} />}
                  readOnly={props.emailLocked}
                  disabled={props.emailLocked}
                />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  helperText="Must be at least 8 characters long"
                  leftIcon={<Lock size={16} />}
                  rightIcon={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                By signing up, you agree to our{' '}
                <button
                  type="button"
                  onClick={() => props.onNavigate?.('/terms')}
                  className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => props.onNavigate?.('/privacy')}
                  className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Privacy Policy
                </button>
                .
              </div>
              <Button
                type="submit"
                className="mt-6 w-full"
                isLoading={isLoading}
                leftIcon={<UserPlus size={16} />}
              >
                Sign Up
              </Button>
            </form>
          </CardBody>
          <CardFooter className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button
                onClick={() => props.onNavigate?.('/signin')}
                className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Sign in
              </button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SignUpView;