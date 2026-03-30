// src/components/sparks/RoleProgressBar.tsx
import Box from '@mui/material/Box';
import type { PdlcRole, RoleResultSummary } from '../../api/types';

interface RoleProgressBarProps {
  activatedRoles: PdlcRole[];
  roleResults: Record<string, RoleResultSummary>;
  currentRole: PdlcRole | null;
}

function segmentColor(
  role: PdlcRole,
  roleResults: Record<string, RoleResultSummary>,
  currentRole: PdlcRole | null,
): string {
  const result = roleResults[role];
  if (result) {
    if (result.status === 'COMPLETED') return '#4CAF50';
    if (result.status === 'FAILED' || result.status === 'REJECTED') return '#CF6679';
    if (result.status === 'SKIPPED') return '#555';
  }
  if (role === currentRole) return '#6C63FF';
  return '#333';
}

function isSkipped(role: PdlcRole, roleResults: Record<string, RoleResultSummary>): boolean {
  return roleResults[role]?.status === 'SKIPPED';
}

function isActive(role: PdlcRole, currentRole: PdlcRole | null): boolean {
  return role === currentRole;
}

export default function RoleProgressBar({ activatedRoles, roleResults, currentRole }: RoleProgressBarProps) {
  return (
    <Box sx={{ display: 'flex', gap: '2px', width: '100%' }}>
      {activatedRoles.map((role) => (
        <Box
          key={role}
          sx={{
            flex: 1,
            height: 4,
            borderRadius: '1px',
            bgcolor: segmentColor(role, roleResults, currentRole),
            ...(isActive(role, currentRole) && {
              boxShadow: '0 0 6px rgba(108, 99, 255, 0.6)',
            }),
            ...(isSkipped(role, roleResults) && {
              backgroundImage:
                'repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)',
            }),
            transition: 'background-color 0.3s ease',
          }}
        />
      ))}
    </Box>
  );
}
