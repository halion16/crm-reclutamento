import type { LoginRequest, LoginResponse, User } from '../types/auth';

const API_BASE_URL = 'http://localhost:3004/api';

// Utility per gestione errori API  
export class APIError extends Error {
  public status?: number;
  public code?: string;
  
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

// Utility per chiamate API autenticate
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      throw new APIError(errorMessage, response.status, errorData.code);
    } catch (e) {
      throw new APIError(errorMessage, response.status);
    }
  }

  return response.json();
};

// Auth API Services
export const authAPI = {
  // Login utente
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new APIError(data.message || 'Login failed', response.status, data.code);
      }

      // Salva token nel localStorage se login successful
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error during login');
    }
  },

  // Logout utente
  async logout(): Promise<void> {
    try {
      // Only try logout API if we have a valid token
      if (this.getToken() && this.isTokenValid()) {
        await makeAuthenticatedRequest(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
        });
      }
    } catch (error) {
      console.warn('Logout API failed:', error);
      // Continue with local logout even if API fails
    } finally {
      // Always clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  // Get current user profile
  async getCurrentUser(): Promise<{ user: User; permissions: string[] }> {
    return makeAuthenticatedRequest(`${API_BASE_URL}/auth/me`);
  },

  // Refresh access token
  async refreshToken(): Promise<{ accessToken: string; expiresIn: number }> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new APIError('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new APIError(data.message || 'Token refresh failed', response.status, data.code);
      }

      // Update access token
      localStorage.setItem('accessToken', data.accessToken);
      
      return data;
    } catch (error) {
      // Clear tokens if refresh fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error during token refresh');
    }
  },

  // Get user sessions
  async getSessions(): Promise<any[]> {
    const data = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/sessions`);
    return data.sessions || [];
  },

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    const data = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.user;
  },

  // Get audit logs (admin only)
  async getAuditLogs(limit: number = 100): Promise<any[]> {
    const data = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/audit?limit=${limit}`);
    return data.auditLogs || [];
  },

  // Check if token is valid
  isTokenValid(): boolean {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch {
      return false;
    }
  },

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  // Clear all auth data
  clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

