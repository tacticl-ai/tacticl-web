import { useState } from 'react';
import Box from '@mui/material/Box';
import type { PipelineRun, PdlcRole } from '../../../api/types';
import PdlcRoleStrip from './PdlcRoleStrip';
import ActiveRolePanel from './ActiveRolePanel';
import EventTimeline from '../EventTimeline';
import ArtifactTabs from './ArtifactTabs';

interface PdlcPipelineViewProps {
  sparkId: string;
  pipelineRun: PipelineRun;
}

export default function PdlcPipelineView({ sparkId, pipelineRun }: PdlcPipelineViewProps) {
  const [selectedRole, setSelectedRole] = useState<PdlcRole | null>(null);

  const handleRoleClick = (role: PdlcRole) => {
    setSelectedRole(role);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 1. Role strip (full width) */}
      <PdlcRoleStrip
        activatedRoles={pipelineRun.activatedRoles}
        roleResults={pipelineRun.roleResults}
        currentRole={pipelineRun.currentRole}
        skippedRequiredRoles={pipelineRun.skippedRequiredRoles}
        onRoleClick={handleRoleClick}
      />

      {/* CheckpointBanner slot -- added in Task 20 */}

      {/* 3. Two-column layout: ActiveRolePanel | EventTimeline */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {pipelineRun.currentRole && (
          <Box sx={{ flex: 1.2, minWidth: 0 }}>
            <ActiveRolePanel
              sparkId={sparkId}
              currentRole={pipelineRun.currentRole}
              roleResult={pipelineRun.roleResults[pipelineRun.currentRole]}
            />
          </Box>
        )}
        <Box sx={{ flex: 0.8, minWidth: 0 }}>
          <EventTimeline sparkId={sparkId} />
        </Box>
      </Box>

      {/* 4. PdlcPipelineControls placeholder */}
      {/* PdlcPipelineControls slot -- future task */}

      {/* 5. Artifact tabs (full width) */}
      <ArtifactTabs
        sparkId={sparkId}
        activatedRoles={pipelineRun.activatedRoles}
        roleResults={pipelineRun.roleResults}
      />
    </Box>
  );
}
