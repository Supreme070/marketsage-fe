/**
 * Authentication Usage Examples
 * =============================
 * 
 * Examples of how to use the new API-based authentication system
 * in various scenarios within the MarketSage frontend
 */

import type React from 'react';
import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useApiClient } from '../hooks/use-api-client';
import { serverApiClient } from '../api-client-server';
import { syncApiClientToken, hasRole, isAdmin } from '../auth-utils';
import logout from '../logout-handler';

// Example 1: Client-side component with authentication
export function AuthenticatedComponent() {
  const { data: session, status } = useSession();
  const { client, isAuthenticated, isLoading } = useApiClient();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Sync token with API client when session changes
    syncApiClientToken(session);
  }, [session]);

  useEffect(() => {
    // Fetch user data when authenticated
    if (isAuthenticated) {
      client.getProfile().then(response => {
        if (response.success) {
          setUserData(response.data);
        }
      });
    }
  }, [isAuthenticated, client]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h2>Please log in</h2>
        <button onClick={() => signIn()}>Sign In</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Welcome, {session?.user?.name}</h2>
      <p>Role: {session?.user?.role}</p>
      {userData && (
        <div>
          <h3>Profile Data from API:</h3>
          <pre>{JSON.stringify(userData, null, 2)}</pre>
        </div>
      )}
      <button onClick={() => logout()}>Sign Out</button>
    </div>
  );
}

// Example 2: Role-based access control
export function AdminOnlyComponent() {
  const { data: session } = useSession();

  if (!isAdmin(session)) {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>This content is only visible to administrators.</p>
    </div>
  );
}

// Example 3: Custom login form
export function CustomLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials');
      } else {
        // Redirect to dashboard or desired page
        window.location.href = '/dashboard';
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}

// Example 4: Registration form
export function RegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v2/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Optionally auto-login the user
        await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div>
        <h2>Registration Successful!</h2>
        <p>Your account has been created successfully.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>
      <div>
        <label htmlFor="company">Company (optional):</label>
        <input
          type="text"
          id="company"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
        />
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
}

// Example 5: Server-side authentication example
export async function getServerSideProps(context: any) {
  try {
    // Use server API client for server-side requests
    const response = await serverApiClient.getUsers({ page: 1, limit: 10 });
    
    if (response.success) {
      return {
        props: {
          users: response.data,
        },
      };
    } else {
      return {
        props: {
          users: [],
          error: response.error?.message || 'Failed to fetch users',
        },
      };
    }
  } catch (error) {
    console.error('Server-side API error:', error);
    return {
      props: {
        users: [],
        error: 'Server error',
      },
    };
  }
}

// Example 6: Protected API route example
export async function protectedApiRoute(req: any, res: any) {
  try {
    // Verify authentication
    const response = await serverApiClient.verifyToken();
    
    if (!response.success) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Continue with protected logic
    const data = await serverApiClient.getUsers();
    
    return res.json(data);
  } catch (error) {
    console.error('Protected API route error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Example 7: Custom hook for user data
export function useUserProfile() {
  const { client, isAuthenticated } = useApiClient();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      client.getProfile()
        .then(response => {
          if (response.success) {
            setProfile(response.data);
            setError(null);
          } else {
            setError(response.error?.message || 'Failed to load profile');
          }
        })
        .catch(err => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isAuthenticated, client]);

  return { profile, loading, error };
}

export default {
  AuthenticatedComponent,
  AdminOnlyComponent,
  CustomLoginForm,
  RegistrationForm,
  useUserProfile,
};