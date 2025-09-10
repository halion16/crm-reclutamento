import React from 'react';
import {
  Box,
  Avatar,
  Typography,
  Chip,
  Fade
} from '@mui/material';
import { keyframes } from '@mui/system';
import type { TypingIndicator } from '../../services/chatWebSocketService';
import type { ChatParticipant } from '../../services/chatApi';

interface TypingIndicatorsProps {
  typingUsers: TypingIndicator[];
  participants: ChatParticipant[];
  maxDisplay?: number;
}

// Animation for typing dots
const typingDots = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
`;

const TypingDot: React.FC<{ delay: number }> = ({ delay }) => (
  <Box
    sx={{
      width: 4,
      height: 4,
      backgroundColor: 'text.secondary',
      borderRadius: '50%',
      animation: `${typingDots} 1.4s ease-in-out ${delay}s infinite`,
      display: 'inline-block',
      margin: '0 1px'
    }}
  />
);

const TypingIndicators: React.FC<TypingIndicatorsProps> = ({
  typingUsers,
  participants,
  maxDisplay = 3
}) => {
  if (typingUsers.length === 0) return null;

  const getParticipantInfo = (userId: string) => {
    return participants.find(p => p.userId === userId);
  };

  const getTypingMessage = (count: number, firstUserName?: string) => {
    if (count === 1) {
      return `${firstUserName || 'Qualcuno'} sta scrivendo`;
    } else if (count === 2) {
      return 'Due persone stanno scrivendo';
    } else {
      return `${count} persone stanno scrivendo`;
    }
  };

  const displayUsers = typingUsers.slice(0, maxDisplay);
  const remainingCount = Math.max(0, typingUsers.length - maxDisplay);
  const firstUser = getParticipantInfo(displayUsers[0]?.userId);

  return (
    <Fade in={true} timeout={300}>
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        py={1}
        px={2}
        sx={{
          backgroundColor: 'action.hover',
          borderRadius: 2,
          margin: '8px 0'
        }}
      >
        {/* User Avatars */}
        <Box display="flex" alignItems="center" gap={0.5}>
          {displayUsers.map((typingUser, index) => {
            const participant = getParticipantInfo(typingUser.userId);
            return (
              <Avatar
                key={typingUser.userId}
                src={participant?.userAvatar}
                sx={{
                  width: 24,
                  height: 24,
                  fontSize: '0.7rem',
                  marginLeft: index > 0 ? -0.5 : 0,
                  border: '2px solid',
                  borderColor: 'background.paper',
                  zIndex: displayUsers.length - index
                }}
              >
                {participant?.userName?.charAt(0).toUpperCase()}
              </Avatar>
            );
          })}
          
          {remainingCount > 0 && (
            <Chip
              label={`+${remainingCount}`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.6rem',
                marginLeft: 0.5
              }}
            />
          )}
        </Box>

        {/* Typing Message */}
        <Box display="flex" alignItems="center" gap={1} flex={1}>
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ fontStyle: 'italic' }}
          >
            {getTypingMessage(typingUsers.length, firstUser?.userName)}
          </Typography>
          
          {/* Animated Dots */}
          <Box display="flex" alignItems="center" gap={0.25}>
            <TypingDot delay={0} />
            <TypingDot delay={0.2} />
            <TypingDot delay={0.4} />
          </Box>
        </Box>
      </Box>
    </Fade>
  );
};

export default TypingIndicators;