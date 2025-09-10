import React from 'react';
import { Box, CircularProgress, Alert, Chip, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';
import LoginForm from './LoginForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermission?: {
    resource: string;
    action: string;
  };
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredPermission,
  fallback
}) => {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="textSecondary">
          Verificando autenticazione...
        </Typography>
        <Chip label="Security Check in Progress" color="info" />
      </Box>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Check role requirements
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return fallback || (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
        gap={3}
        p={4}
      >
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>
            Accesso Negato
          </Typography>
          <Typography variant="body2" paragraph>
            Non hai i permessi necessari per accedere a questa sezione.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Il tuo ruolo:</strong> {user?.role}
          </Typography>
          <Typography variant="body2">
            <strong>Ruoli richiesti:</strong> {requiredRoles.join(', ')}
          </Typography>
        </Alert>
        
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip 
            label={`Ruolo Attuale: ${user?.role}`}
            color="default"
            size="small"
          />
          {requiredRoles.map(role => (
            <Chip
              key={role}
              label={`Richiesto: ${role}`}
              color="error"
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
      </Box>
    );
  }

  // Check permission requirements
  if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
    return fallback || (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
        gap={3}
        p={4}
      >
        <Alert severity="warning" sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>
            Permessi Insufficienti
          </Typography>
          <Typography variant="body2" paragraph>
            Non hai il permesso specifico richiesto per questa funzionalità.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Il tuo ruolo:</strong> {user?.role}
          </Typography>
          <Typography variant="body2">
            <strong>Permesso richiesto:</strong> {requiredPermission.resource}:{requiredPermission.action}
          </Typography>
        </Alert>

        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip 
            label={`Ruolo: ${user?.role}`}
            color="default"
            size="small"
          />
          <Chip
            label={`Richiesto: ${requiredPermission.resource}:${requiredPermission.action}`}
            color="warning"
            size="small"
            variant="outlined"
          />
        </Box>
      </Box>
    );
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
};

export default ProtectedRoute;