import { useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { useSparkProgressStore } from '../../../hooks/useSparkProgress';
import type { PdlcRole, RoleResultSummary } from '../../../api/types';

interface ActiveRolePanelProps {
  sparkId: string;
  currentRole: PdlcRole;
  roleResult: RoleResultSummary | undefined;
}

const ROLE_NAMES: Record<PdlcRole, string> = {
  PO: 'Product Owner',
  RESEARCHER: 'Researcher',
  ARCHITECT: 'Architect',
  DESIGNER: 'Designer',
  PLANNER: 'Planner',
  IMPLEMENTER: 'Implementer',
  REVIEWER: 'Reviewer',
  TESTER: 'Tester',
  SECURITY_ANALYST: 'Security Analyst',
  TECHNICAL_WRITER: 'Technical Writer',
  DEVOPS: 'DevOps',
  RETRO_ANALYST: 'Retro Analyst',
};

export default function ActiveRolePanel({
  sparkId,
  currentRole,
  roleResult,
}: ActiveRolePanelProps) {
  const messages = useSparkProgressStore((s) => s.getProgress(sparkId));
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <Box>
      {/* Role name + model badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {ROLE_NAMES[currentRole]}
        </Typography>
        {roleResult?.model && (
          <Chip
            label={roleResult.model}
            size="small"
            sx={{
              bgcolor: 'rgba(108, 99, 255, 0.15)',
              color: '#B39DDB',
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
        )}
      </Box>

      {/* Live progress log */}
      <Box
        sx={{
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          fontSize: '0.75rem',
          bgcolor: '#1a1a2e',
          borderRadius: '8px',
          p: 1.5,
          maxHeight: 200,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
        }}
      >
        {messages.length === 0 && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontFamily: "'SF Mono', 'Fira Code', monospace",
            }}
          >
            Waiting for progress...
          </Typography>
        )}
        {messages.map((msg, i) => (
          <Box key={msg.id} sx={{ display: 'flex', mb: 0.25 }}>
            <Typography
              component="span"
              sx={{
                color:
                  msg.type === 'failed'
                    ? '#CF6679'
                    : msg.type === 'completed'
                      ? '#4CAF50'
                      : msg.type === 'checkpoint'
                        ? '#FF9800'
                        : 'text.secondary',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {msg.message}
              {/* Blinking cursor on the latest line */}
              {i === messages.length - 1 && (
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: '6px',
                    height: '1em',
                    bgcolor: '#6C63FF',
                    ml: 0.25,
                    verticalAlign: 'text-bottom',
                    animation: 'blink-cursor 1s step-end infinite',
                    '@keyframes blink-cursor': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0 },
                    },
                  }}
                />
              )}
            </Typography>
          </Box>
        ))}
        <div ref={logEndRef} />
      </Box>
    </Box>
  );
}
