import React, { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Email as EmailIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Psychology as AIIcon,
  AccountTree as WorkflowIcon,
  AccountCircle,
  Logout,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Chat as ChatIcon,
  Groups as GroupsIcon,
  BarChart as ReportsIcon,
  Sms as SmsIcon
} from '@mui/icons-material';
import { Toaster } from 'react-hot-toast';

// Components
import Dashboard from './components/Dashboard';
import CandidatesList from './components/CandidatesList';
import InterviewsList from './components/InterviewsList';
import CommunicationsList from './components/CommunicationsList';
import NotificationCenter from './components/notifications/NotificationCenter';
import AIDashboard from './components/ai/AIDashboard';
import SimpleKanbanBoard from './components/workflow/SimpleKanbanBoard';
import Chat from './components/chat/Chat';
import UserManagementSimple from './components/team/UserManagementSimple';
import ReportBuilder from './components/reports/ReportBuilder';
import SMSCostDashboard from './components/communication/SMSCostDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import LoginForm from './components/LoginForm';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorBoundaryTest from './components/ErrorBoundaryTest';
import { useNotifications } from './hooks/useNotifications';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserRole, RESOURCES, ACTIONS } from './types/auth';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

type ActiveView = 'dashboard' | 'candidates' | 'interviews' | 'communications' | 'chat' | 'ai' | 'workflow' | 'team-management' | 'reports' | 'smart-sms' | 'notifications' | 'error-test';

interface MenuItem {
  id: ActiveView;
  label: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { id: 'candidates', label: 'Candidati', icon: <PeopleIcon /> },
  { id: 'interviews', label: 'Colloqui', icon: <AssignmentIcon /> },
  { id: 'communications', label: 'Comunicazioni', icon: <EmailIcon /> },
  { id: 'chat', label: 'Chat', icon: <ChatIcon /> },
  { id: 'smart-sms', label: 'Smart SMS', icon: <SmsIcon /> },
  { id: 'notifications', label: 'Notifications', icon: <NotificationsIcon /> },
  { id: 'ai', label: 'AI Dashboard', icon: <AIIcon /> },
  { id: 'workflow', label: 'Workflow', icon: <WorkflowIcon /> },
  { id: 'reports', label: 'Reports', icon: <ReportsIcon /> },
  { id: 'team-management', label: 'Team Management', icon: <GroupsIcon /> },
  // Development only
  ...(import.meta.env.DEV ? [{ id: 'error-test' as ActiveView, label: '🧪 Error Test', icon: <SecurityIcon /> }] : [])
];

const DRAWER_WIDTH = 240;

// Main App Component (inside AuthProvider)
const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Auth context
  const { user, logout, hasPermission, hasRole, isAuthenticated, isLoading } = useAuth();
  
  // Hook per gestione notifiche
  const { permission, isSubscribed } = useNotifications();

  // Filter menu items based on user permissions
  const getFilteredMenuItems = () => {
    if (!user) {
      // Return only dashboard if not authenticated
      return [menuItems[0]]; // Dashboard
    }
    
    return menuItems.filter(item => {
      switch (item.id) {
        case 'dashboard':
          return true; // Everyone can see dashboard
        case 'candidates':
          return hasPermission(RESOURCES.CANDIDATES, ACTIONS.READ);
        case 'interviews':
          return hasPermission(RESOURCES.INTERVIEWS, ACTIONS.READ);
        case 'communications':
          return hasPermission(RESOURCES.COMMUNICATIONS, ACTIONS.READ);
        case 'chat':
          return hasPermission(RESOURCES.COMMUNICATIONS, ACTIONS.READ);
        case 'smart-sms':
          return hasPermission(RESOURCES.COMMUNICATIONS, ACTIONS.READ);
        case 'notifications':
          return true; // Everyone can see notifications
        case 'ai':
          return hasPermission(RESOURCES.AI_FEATURES, ACTIONS.READ);
        case 'workflow':
          return hasPermission(RESOURCES.WORKFLOW, ACTIONS.READ);
        case 'reports':
          return hasPermission(RESOURCES.ANALYTICS, ACTIONS.READ);
        case 'team-management':
          return hasPermission('users', 'read');
        default:
          return false;
      }
    });
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'error';
      case UserRole.ADMIN:
        return 'warning';
      case UserRole.HR_MANAGER:
        return 'info';
      case UserRole.RECRUITER:
        return 'success';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN) {
      return <AdminIcon fontSize="small" />;
    }
    return <AccountCircle fontSize="small" />;
  };

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <Typography variant="h4">🔄 Caricamento...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <ErrorBoundary level="section" componentName="Dashboard">
            <Dashboard />
          </ErrorBoundary>
        );
      case 'candidates':
        return (
          <ErrorBoundary level="section" componentName="CandidatesList">
            <ProtectedRoute requiredPermission={{ resource: RESOURCES.CANDIDATES, action: ACTIONS.READ }}>
              <CandidatesList refreshTrigger={0} />
            </ProtectedRoute>
          </ErrorBoundary>
        );
      case 'interviews':
        return (
          <ErrorBoundary level="section" componentName="InterviewsList">
            <ProtectedRoute requiredPermission={{ resource: RESOURCES.INTERVIEWS, action: ACTIONS.READ }}>
              <InterviewsList refreshTrigger={0} />
            </ProtectedRoute>
          </ErrorBoundary>
        );
      case 'communications':
        return (
          <ErrorBoundary level="section" componentName="CommunicationsList">
            <ProtectedRoute requiredPermission={{ resource: RESOURCES.COMMUNICATIONS, action: ACTIONS.READ }}>
              <CommunicationsList />
            </ProtectedRoute>
          </ErrorBoundary>
        );
      case 'ai':
        return (
          <ErrorBoundary level="section" componentName="AIDashboard">
            <ProtectedRoute requiredPermission={{ resource: RESOURCES.AI_FEATURES, action: ACTIONS.READ }}>
              <AIDashboard />
            </ProtectedRoute>
          </ErrorBoundary>
        );
      case 'workflow':
        return (
          <ErrorBoundary level="section" componentName="WorkflowKanban">
            <ProtectedRoute requiredPermission={{ resource: RESOURCES.WORKFLOW, action: ACTIONS.READ }}>
              <SimpleKanbanBoard />
            </ProtectedRoute>
          </ErrorBoundary>
        );
      case 'chat':
        return (
          <ErrorBoundary level="section" componentName="Chat">
            <ProtectedRoute requiredPermission={{ resource: RESOURCES.COMMUNICATIONS, action: ACTIONS.READ }}>
              <Chat />
            </ProtectedRoute>
          </ErrorBoundary>
        );
      case 'team-management':
        return (
          <ErrorBoundary level="section" componentName="UserManagement">
            <ProtectedRoute requiredPermission={{ resource: 'users', action: 'read' }}>
              <UserManagementSimple />
            </ProtectedRoute>
          </ErrorBoundary>
        );
      case 'reports':
        return (
          <ErrorBoundary level="section" componentName="ReportBuilder">
            <ProtectedRoute requiredPermission={{ resource: RESOURCES.ANALYTICS, action: ACTIONS.READ }}>
              <ReportBuilder />
            </ProtectedRoute>
          </ErrorBoundary>
        );
      case 'smart-sms':
        return (
          <ErrorBoundary level="section" componentName="SMSCostDashboard">
            <ProtectedRoute requiredPermission={{ resource: RESOURCES.COMMUNICATIONS, action: ACTIONS.READ }}>
              <SMSCostDashboard />
            </ProtectedRoute>
          </ErrorBoundary>
        );
      case 'notifications':
        return (
          <ErrorBoundary level="section" componentName="NotificationCenter">
            <NotificationCenter open={true} onClose={() => setActiveView('dashboard')} />
          </ErrorBoundary>
        );
      case 'error-test':
        return (
          <ErrorBoundary level="section" componentName="ErrorBoundaryTest">
            <ErrorBoundaryTest />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary level="section" componentName="Dashboard">
            <Dashboard />
          </ErrorBoundary>
        );
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {/* App Bar */}
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : 0}px)` },
            ml: { sm: `${drawerOpen ? DRAWER_WIDTH : 0}px` },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setDrawerOpen(!drawerOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              CRM Reclutamento
            </Typography>
            <IconButton 
              color="inherit"
              onClick={() => setNotificationDialogOpen(true)}
              title="Centro Notifiche"
            >
              <Badge 
                badgeContent={isSubscribed ? 0 : '!'} 
                color={permission.permission === 'granted' ? 'success' : 'error'}
                variant={isSubscribed ? 'standard' : 'dot'}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            {/* User Profile Icon in Toolbar */}
            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
              sx={{ ml: 1 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {getRoleIcon(user?.role as UserRole)}
              </Avatar>
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Drawer */}
        <Drawer
          variant="persistent"
          anchor="left"
          open={drawerOpen}
          sx={{
            width: drawerOpen ? DRAWER_WIDTH : 0,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {getFilteredMenuItems().map((item) => (
                <ListItem
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: activeView === item.id ? 'action.selected' : 'inherit',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItem>
              ))}
            </List>
            
            {/* User Profile Section at Bottom */}
            <Divider sx={{ mt: 2 }} />
            <Box sx={{ p: 2 }}>
              <Box 
                display="flex" 
                alignItems="center" 
                gap={1}
                sx={{ 
                  cursor: 'pointer',
                  p: 1,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
                onClick={handleUserMenuOpen}
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {getRoleIcon(user?.role as UserRole)}
                </Avatar>
                <Box flexGrow={1}>
                  <Typography variant="body2" fontWeight="bold">
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Chip 
                    label={user?.role} 
                    color={getRoleColor(user?.role as UserRole)}
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { sm: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : 0}px)` },
          }}
        >
          <Toolbar />
          {renderContent()}
        </Box>
      </Box>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 200,
            mt: 1
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {user?.email}
          </Typography>
          <Box mt={1}>
            <Chip 
              label={user?.role} 
              color={getRoleColor(user?.role as UserRole)}
              size="small"
              icon={getRoleIcon(user?.role as UserRole)}
            />
          </Box>
        </Box>
        
        <MenuItem onClick={handleLogout}>
          <Logout fontSize="small" sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Notification Center Dialog */}
      <Dialog
        open={notificationDialogOpen}
        onClose={() => setNotificationDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '600px'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6">Centro Notifiche</Typography>
          <IconButton 
            onClick={() => setNotificationDialogOpen(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <NotificationCenter 
            open={notificationDialogOpen}
            onClose={() => setNotificationDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
}

// Main App Component with AuthProvider
const App: React.FC = () => {
  return (
    <ErrorBoundary 
      level="global" 
      componentName="Application"
      onError={(error, errorInfo) => {
        console.error('Global error caught:', error, errorInfo);
        // Additional error reporting logic here
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
