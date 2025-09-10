import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Alert
} from '@mui/material';
import {
  BugReport as BugIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import ErrorBoundary from './ErrorBoundary';
import { useErrorHandler } from '../hooks/useErrorHandler';

// Component che simula un errore
const BuggyComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Componente simulato con errore!');
  }
  
  return (
    <Alert severity="success">
      ✅ Componente funzionante correttamente
    </Alert>
  );
};

// Component che usa useErrorHandler
const ComponentWithErrorHandler: React.FC = () => {
  const { handleError, handleAsyncError, handleApiError, getErrorLogs, clearErrorLogs } = useErrorHandler();
  const [logs, setLogs] = useState<any>(null);

  const simulateError = () => {
    handleError(new Error('Errore simulato via hook'), {
      showToast: true,
      level: 'error'
    }, {
      component: 'ErrorBoundaryTest',
      action: 'simulate_error'
    });
  };

  const simulateAsyncError = async () => {
    try {
      await handleAsyncError(async () => {
        throw new Error('Errore async simulato');
      }, {
        showToast: true,
        level: 'warning'
      }, {
        component: 'ErrorBoundaryTest',
        action: 'simulate_async_error'
      });
    } catch (e) {
      console.log('Errore gestito:', e);
    }
  };

  const simulateApiError = () => {
    const mockApiError = {
      response: {
        status: 500,
        data: { message: 'Errore interno del server simulato' }
      }
    };
    
    handleApiError(mockApiError, 'ErrorBoundaryTest');
  };

  const showErrorLogs = () => {
    const errorLogs = getErrorLogs();
    setLogs(errorLogs);
  };

  const clearLogs = () => {
    clearErrorLogs();
    setLogs(null);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Test Error Handler Hook
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Questi pulsanti testano il sistema di gestione errori programmatico
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              startIcon={<ErrorIcon />}
              onClick={simulateError}
            >
              Errore Normale
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              color="warning"
              fullWidth
              startIcon={<WarningIcon />}
              onClick={simulateAsyncError}
            >
              Errore Async
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="outlined"
              color="info"
              fullWidth
              startIcon={<BugIcon />}
              onClick={simulateApiError}
            >
              Errore API
            </Button>
          </Grid>
        </Grid>

        <Box mt={2}>
          <Button onClick={showErrorLogs} variant="text" size="small">
            Mostra Log Errori
          </Button>
          <Button onClick={clearLogs} variant="text" size="small" sx={{ ml: 1 }}>
            Cancella Log
          </Button>
        </Box>

        {logs && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Log Errori (Totale: {logs.total})
            </Typography>
            <Box
              component="pre"
              sx={{
                fontSize: '0.75rem',
                backgroundColor: 'grey.100',
                p: 1,
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: 200
              }}
            >
              {JSON.stringify(logs, null, 2)}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const ErrorBoundaryTest: React.FC = () => {
  const [throwError, setThrowError] = useState(false);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        🧪 Test Error Boundaries & Error Handling
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Questa pagina dimostra il sistema di gestione errori implementato nell'applicazione.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Error Boundary
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Questo componente è wrappato in un Error Boundary di livello "section"
              </Typography>
              
              <ErrorBoundary level="section" componentName="BuggyTestComponent">
                <BuggyComponent shouldThrow={throwError} />
              </ErrorBoundary>
            </CardContent>
            
            <CardActions>
              <Button
                variant={throwError ? "contained" : "outlined"}
                color={throwError ? "error" : "primary"}
                startIcon={<BugIcon />}
                onClick={() => setThrowError(!throwError)}
              >
                {throwError ? 'Risolvi Errore' : 'Simula Errore'}
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <ComponentWithErrorHandler />
        </Grid>

        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Come funziona:</strong>
              <br />
              • <strong>Error Boundary:</strong> Cattura errori React durante il rendering e mostra UI di fallback
              <br />
              • <strong>Error Handler Hook:</strong> Gestisce errori programmatici con toast, logging e reporting
              <br />
              • <strong>Livelli:</strong> Global (intera app), Section (sezioni), Component (singoli componenti)
              <br />
              • <strong>Logging:</strong> Errori salvati in localStorage per debugging
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ErrorBoundaryTest;