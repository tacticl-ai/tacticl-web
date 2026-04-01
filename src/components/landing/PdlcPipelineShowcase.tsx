import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ScienceIcon from '@mui/icons-material/Science';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import BrushIcon from '@mui/icons-material/Brush';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CodeIcon from '@mui/icons-material/Code';
import RateReviewIcon from '@mui/icons-material/RateReview';
import BugReportIcon from '@mui/icons-material/BugReport';
import ShieldIcon from '@mui/icons-material/Shield';
import DescriptionIcon from '@mui/icons-material/Description';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import InsightsIcon from '@mui/icons-material/Insights';

interface PdlcRole {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  phase: string;
}

const PHASE_COLORS: Record<string, { main: string; bg: string; border: string }> = {
  Discovery: { main: '#06b6d4', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.25)' },
  Design: { main: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)' },
  Build: { main: '#6C63FF', bg: 'rgba(108,99,255,0.12)', border: 'rgba(108,99,255,0.25)' },
  Quality: { main: '#ec4899', bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.25)' },
  Ship: { main: '#03DAC6', bg: 'rgba(3,218,198,0.12)', border: 'rgba(3,218,198,0.25)' },
};

const PDLC_ROLES: PdlcRole[] = [
  { id: 'pm', title: 'PM', description: 'Defines requirements and success criteria', icon: <ManageAccountsIcon sx={{ fontSize: 28 }} />, phase: 'Discovery' },
  { id: 'researcher', title: 'Researcher', description: 'Gathers context, prior art, and constraints', icon: <ScienceIcon sx={{ fontSize: 28 }} />, phase: 'Discovery' },
  { id: 'architect', title: 'Architect', description: 'Designs the technical structure', icon: <ArchitectureIcon sx={{ fontSize: 28 }} />, phase: 'Design' },
  { id: 'designer', title: 'Designer', description: 'Creates UX/UI specifications', icon: <BrushIcon sx={{ fontSize: 28 }} />, phase: 'Design' },
  { id: 'planner', title: 'Planner', description: 'Breaks work into executable steps', icon: <AssignmentIcon sx={{ fontSize: 28 }} />, phase: 'Build' },
  { id: 'implementer', title: 'Implementer', description: 'Writes the code', icon: <CodeIcon sx={{ fontSize: 28 }} />, phase: 'Build' },
  { id: 'reviewer', title: 'Reviewer', description: 'Reviews for quality and correctness', icon: <RateReviewIcon sx={{ fontSize: 28 }} />, phase: 'Quality' },
  { id: 'tester', title: 'Tester', description: 'Validates functionality and edge cases', icon: <BugReportIcon sx={{ fontSize: 28 }} />, phase: 'Quality' },
  { id: 'security', title: 'Security', description: 'Audits for vulnerabilities', icon: <ShieldIcon sx={{ fontSize: 28 }} />, phase: 'Quality' },
  { id: 'writer', title: 'Tech Writer', description: 'Produces documentation', icon: <DescriptionIcon sx={{ fontSize: 28 }} />, phase: 'Ship' },
  { id: 'devops', title: 'DevOps', description: 'Handles deployment and infrastructure', icon: <RocketLaunchIcon sx={{ fontSize: 28 }} />, phase: 'Ship' },
  { id: 'retro', title: 'Retro Analyst', description: 'Reviews execution and captures lessons', icon: <InsightsIcon sx={{ fontSize: 28 }} />, phase: 'Ship' },
];

function PipelineFlow({ isVisible }: { isVisible: boolean }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: { xs: 1, md: 0 },
        mb: { xs: 6, md: 8 },
      }}
    >
      {PDLC_ROLES.map((role, i) => {
        const colors = PHASE_COLORS[role.phase];
        const isNewPhase = i === 0 || PDLC_ROLES[i - 1].phase !== role.phase;
        return (
          <Box key={role.id} sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Connector dash (not before first node) */}
            {i > 0 && (
              <Box
                sx={{
                  display: { xs: 'none', md: 'block' },
                  width: isNewPhase ? 32 : 20,
                  height: 2,
                  background: isNewPhase
                    ? `linear-gradient(90deg, ${PHASE_COLORS[PDLC_ROLES[i - 1].phase].main}40, ${colors.main}40)`
                    : `${colors.main}30`,
                  position: 'relative',
                  '&::after': isNewPhase ? {
                    content: '""',
                    position: 'absolute',
                    right: -1,
                    top: -3,
                    width: 0,
                    height: 0,
                    borderLeft: `6px solid ${colors.main}40`,
                    borderTop: '4px solid transparent',
                    borderBottom: '4px solid transparent',
                  } : {},
                }}
              />
            )}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.5s ease-out',
                transitionDelay: `${i * 80}ms`,
              }}
            >
              {/* Phase label (show on first role of each phase) */}
              {isNewPhase && (
                <Typography
                  sx={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: colors.main,
                    mb: 0.5,
                    display: { xs: 'none', md: 'block' },
                  }}
                >
                  {role.phase}
                </Typography>
              )}
              {!isNewPhase && (
                <Box sx={{ height: '18.4px', display: { xs: 'none', md: 'block' } }} />
              )}
              {/* Node */}
              <Box
                sx={{
                  width: { xs: 48, md: 56 },
                  height: { xs: 48, md: 56 },
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.main,
                  position: 'relative',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: `0 0 24px ${colors.main}30`,
                    border: `1px solid ${colors.main}`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {role.icon}
              </Box>
              <Typography
                sx={{
                  fontSize: { xs: '0.6rem', md: '0.7rem' },
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)',
                  textAlign: 'center',
                  maxWidth: 64,
                }}
              >
                {role.title}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function RoleCards({ isVisible }: { isVisible: boolean }) {
  return (
    <Grid container spacing={2}>
      {PDLC_ROLES.map((role, i) => {
        const colors = PHASE_COLORS[role.phase];
        return (
          <Grid key={role.id} size={{ xs: 6, sm: 4, md: 3 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.06)',
                bgcolor: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(12px)',
                height: '100%',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.4s ease-out',
                transitionDelay: `${i * 60}ms`,
                '&:hover': {
                  border: `1px solid ${colors.border}`,
                  bgcolor: colors.bg,
                  boxShadow: `0 0 20px ${colors.main}15`,
                },
              }}
            >
              <Box sx={{ color: colors.main, mb: 1.5 }}>{role.icon}</Box>
              <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 0.5 }}>
                {role.title}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                {role.description}
              </Typography>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
}

interface PdlcPipelineShowcaseProps {
  scrollReveal: { ref: React.RefObject<HTMLDivElement | null>; isVisible: boolean };
}

export default function PdlcPipelineShowcase({ scrollReveal }: PdlcPipelineShowcaseProps) {
  return (
    <Box
      component="section"
      id="meet-your-team"
      ref={scrollReveal.ref}
      sx={{ bgcolor: '#0F0F23', py: { xs: 8, md: 12 } }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            opacity: scrollReveal.isVisible ? 1 : 0,
            transform: scrollReveal.isVisible ? 'translateY(0)' : 'translateY(40px)',
            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
          }}
        >
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              mb: 2,
              letterSpacing: '-0.02em',
            }}
          >
            A whole team of experts, on demand
          </Typography>
          <Typography
            sx={{
              textAlign: 'center',
              color: 'rgba(255,255,255,0.5)',
              mb: { xs: 5, md: 8 },
              maxWidth: 620,
              mx: 'auto',
            }}
          >
            Behind every Spark is a pipeline of specialized AI experts — the same roles
            found in world-class product teams, running in minutes instead of months.
          </Typography>
        </Box>

        <PipelineFlow isVisible={scrollReveal.isVisible} />
        <RoleCards isVisible={scrollReveal.isVisible} />
      </Container>
    </Box>
  );
}
