import { useCallback } from 'react';
import toast from 'react-hot-toast';

interface ErrorInfo {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: string;
}

interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  sendToService?: boolean;
  toastMessage?: string;
  level?: 'error' | 'warning' | 'info';
}

export const useErrorHandler = () => {
  const logError = useCallback((error: Error, info?: ErrorInfo) => {
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      info: info || {},
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('componentErrors') || '[]');
      existingErrors.push(errorReport);
      // Keep only last 20 errors
      if (existingErrors.length > 20) {
        existingErrors.splice(0, existingErrors.length - 20);
      }
      localStorage.setItem('componentErrors', JSON.stringify(existingErrors));
    } catch (e) {
      console.warn('Failed to store component error in localStorage:', e);
    }

    return errorReport;
  }, []);

  const handleError = useCallback((
    error: Error | string,
    options: ErrorHandlerOptions = {},
    info?: ErrorInfo
  ) => {
    const {
      showToast = true,
      logToConsole = true,
      sendToService = false,
      toastMessage,
      level = 'error'
    } = options;

    const errorObj = typeof error === 'string' ? new Error(error) : error;

    // Log to console
    if (logToConsole) {
      console.error('Error handled by useErrorHandler:', errorObj, info);
    }

    // Log structured error
    const errorReport = logError(errorObj, info);

    // Show toast notification
    if (showToast) {
      const message = toastMessage || errorObj.message || 'Si è verificato un errore';
      
      switch (level) {
        case 'error':
          toast.error(message);
          break;
        case 'warning':
          toast('⚠️ ' + message, { icon: '⚠️' });
          break;
        case 'info':
          toast(message, { icon: 'ℹ️' });
          break;
      }
    }

    // Send to external service (simulate)
    if (sendToService) {
      // In a real app, send to error tracking service like Sentry
      console.info('Would send to error service:', errorReport);
    }

    return errorReport;
  }, [logError]);

  const handleAsyncError = useCallback(async (
    asyncFn: () => Promise<any>,
    options: ErrorHandlerOptions = {},
    info?: ErrorInfo
  ) => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error, options, info);
      throw error; // Re-throw to allow caller to handle if needed
    }
  }, [handleError]);

  const handleApiError = useCallback((
    error: any,
    context?: string
  ) => {
    let message = 'Errore di connessione al server';
    let level: 'error' | 'warning' | 'info' = 'error';

    if (error?.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          message = data?.message || 'Richiesta non valida';
          level = 'warning';
          break;
        case 401:
          message = 'Sessione scaduta. Effettua nuovamente il login';
          level = 'warning';
          break;
        case 403:
          message = 'Non hai i permessi per questa operazione';
          level = 'warning';
          break;
        case 404:
          message = 'Risorsa non trovata';
          level = 'warning';
          break;
        case 429:
          message = 'Troppe richieste. Riprova più tardi';
          level = 'warning';
          break;
        case 500:
          message = 'Errore interno del server';
          break;
        default:
          message = data?.message || `Errore ${status}`;
      }
    } else if (error?.request) {
      // Network error
      message = 'Impossibile raggiungere il server';
    } else {
      // Other error
      message = error?.message || 'Errore sconosciuto';
    }

    return handleError(new Error(message), { level }, {
      component: context,
      action: 'api_call'
    });
  }, [handleError]);

  const clearErrorLogs = useCallback(() => {
    try {
      localStorage.removeItem('componentErrors');
      localStorage.removeItem('errorReports');
      toast.success('Log degli errori cancellati');
    } catch (e) {
      console.warn('Failed to clear error logs:', e);
    }
  }, []);

  const getErrorLogs = useCallback(() => {
    try {
      const componentErrors = JSON.parse(localStorage.getItem('componentErrors') || '[]');
      const boundaryErrors = JSON.parse(localStorage.getItem('errorReports') || '[]');
      
      return {
        componentErrors,
        boundaryErrors,
        total: componentErrors.length + boundaryErrors.length
      };
    } catch (e) {
      console.warn('Failed to get error logs:', e);
      return { componentErrors: [], boundaryErrors: [], total: 0 };
    }
  }, []);

  return {
    handleError,
    handleAsyncError,
    handleApiError,
    clearErrorLogs,
    getErrorLogs
  };
};

export default useErrorHandler;