import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Alert,
  Collapse,
  IconButton,
  Divider
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BugReport as BugReportIcon,
  Home as HomeIcon
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'global' | 'section' | 'component';
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console and external service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Send to external error tracking service (e.g., Sentry)
    this.logErrorToService(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Simulate error logging to external service
    const errorReport = {
      timestamp: new Date().toISOString(),
      component: this.props.componentName || 'Unknown',
      level: this.props.level || 'component',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In a real app, send this to your error tracking service
    console.warn('Error report:', errorReport);
    
    // Store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('errorReports') || '[]');
      existingErrors.push(errorReport);
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      localStorage.setItem('errorReports', JSON.stringify(existingErrors));
    } catch (e) {
      console.warn('Failed to store error report in localStorage:', e);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  private renderGlobalError = () => {
    const { error, errorInfo, showDetails } = this.state;

    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        p={3}
        bgcolor="background.default"
      >
        <Card sx={{ maxWidth: 600, width: '100%' }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h4" gutterBottom color="error">
              Ops! Qualcosa è andato storto
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Si è verificato un errore imprevisto nell'applicazione. 
              Il nostro team è stato notificato automaticamente.
            </Typography>
            
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2">
                {error?.message || 'Errore sconosciuto'}
              </Typography>
            </Alert>

            <Box mt={2}>
              <Button
                variant="outlined"
                startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={this.toggleDetails}
                size="small"
              >
                {showDetails ? 'Nascondi dettagli' : 'Mostra dettagli tecnici'}
              </Button>
            </Box>

            <Collapse in={showDetails}>
              <Box mt={2} textAlign="left">
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Stack Trace:
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    fontSize: '0.75rem',
                    backgroundColor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: 200
                  }}
                >
                  {error?.stack}
                </Box>
                
                {errorInfo && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Component Stack:
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        fontSize: '0.75rem',
                        backgroundColor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        maxHeight: 200
                      }}
                    >
                      {errorInfo.componentStack}
                    </Box>
                  </>
                )}
              </Box>
            </Collapse>
          </CardContent>
          
          <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleRetry}
              sx={{ mr: 1 }}
            >
              Riprova
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={this.handleGoHome}
            >
              Torna alla Home
            </Button>
          </CardActions>
        </Card>
      </Box>
    );
  };

  private renderSectionError = () => {
    const { error } = this.state;
    const { componentName } = this.props;

    return (
      <Box p={2}>
        <Alert 
          severity="error" 
          action={
            <Box>
              <IconButton
                color="inherit"
                size="small"
                onClick={this.toggleDetails}
                sx={{ mr: 1 }}
              >
                <BugReportIcon />
              </IconButton>
              <IconButton
                color="inherit"
                size="small"
                onClick={this.handleRetry}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          }
        >
          <Typography variant="subtitle2">
            Errore in {componentName || 'questa sezione'}
          </Typography>
          <Typography variant="body2">
            {error?.message || 'Si è verificato un errore imprevisto'}
          </Typography>
        </Alert>
      </Box>
    );
  };

  private renderComponentError = () => {
    const { componentName } = this.props;

    return (
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="center" 
        p={2}
        border={1}
        borderColor="error.main"
        borderRadius={1}
        bgcolor="error.light"
        color="error.contrastText"
      >
        <ErrorIcon sx={{ mr: 1 }} />
        <Typography variant="body2">
          Errore nel componente {componentName || 'sconosciuto'}
        </Typography>
        <IconButton
          size="small"
          onClick={this.handleRetry}
          sx={{ ml: 1, color: 'inherit' }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>
    );
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render based on error boundary level
      switch (this.props.level) {
        case 'global':
          return this.renderGlobalError();
        case 'section':
          return this.renderSectionError();
        case 'component':
        default:
          return this.renderComponentError();
      }
    }

    return this.props.children;
  }
}

export default ErrorBoundary;