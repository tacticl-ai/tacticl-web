// src/components/sparks/SummaryBar.tsx
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import type { Spark } from '../../api/types';

interface SummaryBarProps {
  sparks: Spark[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const statusConfigs = [
  { key: 'EXECUTING', label: 'Executing', color: '#6C63FF', glow: true },
  { key: 'CHECKPOINT', label: 'Checkpoint', color: '#FBBF24', glow: true },
  { key: 'COMPLETED', label: 'Completed', color: '#34D399', glow: false },
  { key: 'FAILED', label: 'Failed', color: '#F87171', glow: false },
] as const;

export default function SummaryBar({ sparks, activeFilter, onFilterChange }: SummaryBarProps) {
  const counts = statusConfigs.map((cfg) => ({
    ...cfg,
    count: sparks.filter((s) => {
      if (cfg.key === 'EXECUTING') return s.status === 'EXECUTING' || s.status === 'ROUTING';
      return s.status === cfg.key;
    }).length,
  }));

  return (
    <Box sx={{ display: 'flex', gap: 1.25, mb: 2.5, flexWrap: 'wrap' }}>
      {counts.map((item) => {
        const isActive = activeFilter === item.key;
        return (
          <ButtonBase
            key={item.key}
            onClick={() => onFilterChange(isActive ? 'ALL' : item.key)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1.25,
              bgcolor: isActive ? `${item.color}15` : 'background.paper',
              border: '1px solid',
              borderColor: isActive ? `${item.color}40` : 'divider',
              borderRadius: '10px',
              minWidth: 120,
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'rgba(255,255,255,0.12)', bgcolor: isActive ? `${item.color}15` : 'action.hover' },
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: item.color,
                boxShadow: item.glow ? `0 0 8px ${item.color}` : 'none',
                ...(item.glow && {
                  animation: 'summaryPulse 2s ease-in-out infinite',
                  '@keyframes summaryPulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.4 },
                  },
                }),
              }}
            />
            <Box sx={{ textAlign: 'left' }}>
              <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 18, fontWeight: 600, lineHeight: 1, letterSpacing: -0.5, color: 'text.primary' }}>
                {item.count}
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 450 }}>
                {item.label}
              </Typography>
            </Box>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
