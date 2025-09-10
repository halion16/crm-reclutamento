import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const App: React.FC = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h1" color="primary">
        🔧 Test App Minima
      </Typography>
      <Typography variant="h4" sx={{ mt: 2 }}>
        ✅ Se vedi questo, React e Material-UI funzionano
      </Typography>
      <Button variant="contained" sx={{ mt: 2 }}>
        Test Button
      </Button>
      <Typography variant="body1" sx={{ mt: 2 }}>
        URL: http://localhost:5178
      </Typography>
    </Box>
  );
};

export default App;