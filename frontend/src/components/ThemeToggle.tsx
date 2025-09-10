import React from 'react';
import {
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Box
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'switch';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon' }) => {
  const { darkMode, toggleDarkMode } = useTheme();

  if (variant === 'switch') {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <LightModeIcon fontSize="small" />
        <FormControlLabel
          control={
            <Switch
              checked={darkMode}
              onChange={toggleDarkMode}
              size="small"
            />
          }
          label=""
          sx={{ margin: 0 }}
        />
        <DarkModeIcon fontSize="small" />
      </Box>
    );
  }

  return (
    <Tooltip title={darkMode ? 'Attiva tema chiaro' : 'Attiva tema scuro'}>
      <IconButton
        onClick={toggleDarkMode}
        color="inherit"
        size="small"
      >
        {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;