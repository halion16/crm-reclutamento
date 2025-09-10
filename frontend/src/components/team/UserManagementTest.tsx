import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const UserManagementTest: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        👥 Test Team Management
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            ✅ Se vedi questo messaggio, il componente si sta caricando correttamente.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Componente di test per debug Team Management
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserManagementTest;