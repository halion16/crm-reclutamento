import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onMenuItemClick: (id: string) => void;
  user: any;
  menuItems: any[];
  sidebarOpen: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeView,
  onMenuItemClick,
  user,
  menuItems,
  sidebarOpen
}) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {sidebarOpen && (
        <Sidebar
          activeView={activeView}
          onMenuItemClick={onMenuItemClick}
          user={user}
          menuItems={menuItems}
        />
      )}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: sidebarOpen ? '280px' : 0,
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
          backgroundColor: '#ffffff',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;