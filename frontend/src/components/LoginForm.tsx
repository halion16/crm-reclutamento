import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Chip,
  Stack
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Group as GroupIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

const LoginForm: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Demo users for easy testing
  const demoUsers = [
    {
      email: 'admin@crm.com',
      password: 'AdminPass123',
      role: 'Super Admin',
      icon: <AdminIcon color="error" />,
      color: 'error' as const,
      permissions: 'Accesso completo a tutto il sistema'
    },
    {
      email: 'hr@crm.com', 
      password: 'HrManager123!',
      role: 'HR Manager',
      icon: <GroupIcon color="warning" />,
      color: 'warning' as const,
      permissions: 'Gestione candidati, colloqui, report'
    },
    {
      email: 'recruiter@crm.com',
      password: 'Recruiter123!',
      role: 'Recruiter',
      icon: <PersonIcon color="info" />,
      color: 'info' as const,
      permissions: 'Gestione candidati e colloqui'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Email e password sono richiesti');
      return;
    }

    try {
      await login({ email, password, rememberMe });
    } catch (error: any) {
      setLocalError(error.message || 'Errore durante il login');
    }
  };

  const quickLogin = (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Card 
        sx={{ 
          width: '100%', 
          maxWidth: 500,
          boxShadow: 3,
          borderRadius: 2
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box textAlign="center" mb={3}>
            <SecurityIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              CRM Reclutamento
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Enterprise Security & Compliance
            </Typography>
            <Chip 
              label="Phase 5 - Security Ready"
              color="success"
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>

          {/* Error Display */}
          {(error || localError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || localError}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              variant="outlined"
              required
              autoComplete="email"
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              variant="outlined"
              required
              autoComplete="current-password"
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  color="primary"
                />
              }
              label="Ricordami"
              sx={{ mt: 2, mb: 2 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ 
                mt: 2, 
                mb: 3,
                height: 48,
                fontWeight: 'bold'
              }}
            >
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
            </Button>

            {isLoading && <LinearProgress sx={{ mb: 2 }} />}
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="textSecondary">
              Utenti Demo per Test
            </Typography>
          </Divider>

          {/* Demo Users */}
          <Stack spacing={2}>
            {demoUsers.map((user, index) => (
              <Card
                key={index}
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    transform: 'translateY(-1px)',
                    boxShadow: 1
                  }
                }}
                onClick={() => quickLogin(user.email, user.password)}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    {user.icon}
                    <Box flexGrow={1}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {user.role}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {user.email}
                      </Typography>
                      <Typography variant="caption" display="block" color="textSecondary">
                        {user.permissions}
                      </Typography>
                    </Box>
                    <Chip 
                      label="Test Login"
                      color={user.color}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>

          {/* Security Features */}
          <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="primary">
              🔒 Funzionalità di Sicurezza Attive
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              • JWT + Refresh Token Authentication
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              • Role-Based Access Control (RBAC)
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              • Audit Trail completo di tutte le azioni
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              • GDPR Compliance e Data Encryption
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              • Rate Limiting e Security Monitoring
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginForm;