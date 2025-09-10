import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI, APIError } from '../services/authAPI';
import type { 
  AuthState, 
  AuthContextType, 
  LoginRequest, 
  User
} from '../types/auth';
import { UserRole } from '../types/auth';

// Auth Actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string; permissions: string[] } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to check existing auth
  error: null,
  token: null,
  permissions: []
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        permissions: action.payload.permissions,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false
      };
    
    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        token: action.payload
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      const token = authAPI.getToken();
      
      if (!token || !authAPI.isTokenValid()) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        const { user, permissions } = await authAPI.getCurrentUser();
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { user, token, permissions }
        });
      } catch (error) {
        console.warn('Failed to restore authentication:', error);
        authAPI.clearAuthData();
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkExistingAuth();
  }, []);

  // Auto token refresh
  useEffect(() => {
    if (!state.isAuthenticated || !state.token) return;

    const scheduleTokenRefresh = () => {
      try {
        const payload = JSON.parse(atob(state.token!.split('.')[1]));
        const expiresAt = payload.exp * 1000;
        const now = Date.now();
        const refreshTime = expiresAt - now - 60000; // Refresh 1 minute before expiry

        if (refreshTime > 0) {
          const timeoutId = setTimeout(async () => {
            try {
              const { accessToken } = await authAPI.refreshToken();
              dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: accessToken });
            } catch (error) {
              console.warn('Token refresh failed:', error);
              // Force logout if refresh fails
              logout();
            }
          }, refreshTime);

          return () => clearTimeout(timeoutId);
        }
      } catch (error) {
        console.warn('Failed to schedule token refresh:', error);
      }
    };

    return scheduleTokenRefresh();
  }, [state.token]);

  // Login function
  const login = async (credentials: LoginRequest): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await authAPI.login(credentials);
      
      const { user, permissions } = await authAPI.getCurrentUser();
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          user, 
          token: response.accessToken,
          permissions 
        }
      });
    } catch (error) {
      const message = error instanceof APIError ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.warn('Logout API failed:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<void> => {
    try {
      const { accessToken } = await authAPI.refreshToken();
      dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: accessToken });
    } catch (error) {
      console.warn('Manual token refresh failed:', error);
      logout();
      throw error;
    }
  };

  // Permission checking
  const hasPermission = (resource: string, action: string): boolean => {
    if (!state.isAuthenticated || !state.user) return false;
    
    // Super admin has all permissions
    if (state.user.role === UserRole.SUPER_ADMIN) return true;
    
    // Check specific permission
    const permission = `${resource}:${action}`;
    return state.permissions.includes(permission) || state.permissions.includes('*:*');
  };

  // Role checking
  const hasRole = (roles: UserRole[]): boolean => {
    if (!state.isAuthenticated || !state.user) return false;
    return roles.includes(state.user.role);
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    hasPermission,
    hasRole
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};