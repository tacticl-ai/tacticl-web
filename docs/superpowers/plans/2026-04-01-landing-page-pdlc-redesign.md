# Landing Page PDLC Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Tacticl landing page to position the product as a personal AI staffing company, showcasing the PDLC pipeline, three execution tiers, and connectors.

**Architecture:** Replace the existing LandingPage content sections (features grid, how-it-works, pricing) with six new sections: Hero, Journey, Meet Your Team (PDLC pipeline viz + role cards), Scale To Fit (3 tiers), Connectors, and CTA. Move pricing link from anchor scroll to `/pricing` route. Keep all existing animation hooks and background visuals.

**Tech Stack:** React 19, MUI 7, TypeScript, existing animation hooks (useParallax, useScrollReveal, useTilt3D)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/pages/LandingPage.tsx` | Replace features/how-it-works/pricing sections with new Journey, MeetYourTeam, ScaleToFit, Connectors sections |
| Modify | `src/components/layout/PublicHeader.tsx` | Update nav links (Pricing → `/pricing`, rename sections) |
| Create | `src/components/landing/PdlcPipelineShowcase.tsx` | Animated pipeline flow diagram + role cards |
| Create | `src/components/landing/ScaleToFitSection.tsx` | Three-tier glassmorphism cards |
| Create | `src/components/landing/ConnectorsSection.tsx` | Connector icon grid |

---

## Task 1: Update PublicHeader nav links

**Files:**
- Modify: `src/components/layout/PublicHeader.tsx:20-24`

- [ ] **Step 1: Update NAV_LINKS array**

Change the nav links from anchor scrolls to match new section IDs and route:

```typescript
const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'The Team', href: '#meet-your-team' },
  { label: 'Pricing', href: '/pricing' },
];
```

- [ ] **Step 2: Verify dev server renders updated header**

Run: `npm run dev`
Expected: Header shows "How it works", "The Team", "Pricing" links. Pricing navigates to `/pricing` page.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/PublicHeader.tsx
git commit -m "feat(landing): update PublicHeader nav for PDLC redesign"
```

---

## Task 2: Create PdlcPipelineShowcase component

**Files:**
- Create: `src/components/landing/PdlcPipelineShowcase.tsx`

This is the most visually complex component — the animated pipeline flow and role cards.

- [ ] **Step 1: Create the landing directory**

```bash
mkdir -p src/components/landing
```

- [ ] **Step 2: Define role data and phase groupings**

Create `src/components/landing/PdlcPipelineShowcase.tsx` with the role data:

```typescript
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

const PHASES = ['Discovery', 'Design', 'Build', 'Quality', 'Ship'];
```

- [ ] **Step 3: Build the pipeline flow visualization**

Add the pipeline SVG — horizontal row of nodes with animated dash connectors, grouped by phase with phase labels above. Nodes glow with phase color. On desktop, horizontal scroll-aware flow. On mobile, wrap into 2 rows.

```typescript
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
```

- [ ] **Step 4: Build role cards grid**

```typescript
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
```

- [ ] **Step 5: Compose the exported PdlcPipelineShowcase component**

```typescript
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
            A full product team, on demand
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
            Behind every Spark is a pipeline of specialized AI roles — the same structure
            used by world-class product teams, running in minutes instead of months.
          </Typography>
        </Box>

        <PipelineFlow isVisible={scrollReveal.isVisible} />
        <RoleCards isVisible={scrollReveal.isVisible} />
      </Container>
    </Box>
  );
}
```

- [ ] **Step 6: Verify component renders in isolation (import in LandingPage temporarily)**

Run: `npm run dev`
Expected: Section renders with pipeline nodes animating in left-to-right on scroll, role cards below.

- [ ] **Step 7: Commit**

```bash
git add src/components/landing/PdlcPipelineShowcase.tsx
git commit -m "feat(landing): add PdlcPipelineShowcase with pipeline flow and role cards"
```

---

## Task 3: Create ScaleToFitSection component

**Files:**
- Create: `src/components/landing/ScaleToFitSection.tsx`

- [ ] **Step 1: Build the three-tier glassmorphism cards**

```typescript
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import BoltIcon from '@mui/icons-material/Bolt';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HubIcon from '@mui/icons-material/Hub';

interface Tier {
  title: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
}

const tiers: Tier[] = [
  {
    title: 'Simple',
    tagline: 'Quick tasks. One agent.',
    description: 'Automate a social post, summarize a document, generate content — done in seconds.',
    icon: <BoltIcon sx={{ fontSize: 36 }} />,
    color: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.15)',
  },
  {
    title: 'Playbook',
    tagline: 'Your workflows. Your way.',
    description: 'Build custom playbooks with the roles and stages you need — chain together research, content, analysis, or any combination. Reuse them across projects.',
    icon: <AccountTreeIcon sx={{ fontSize: 36 }} />,
    color: '#8b5cf6',
    glowColor: 'rgba(139,92,246,0.15)',
  },
  {
    title: 'Full PDLC',
    tagline: 'Full product development. The entire team.',
    description: '12 AI roles execute a complete product development lifecycle — from requirements through deployment and retrospective.',
    icon: <HubIcon sx={{ fontSize: 36 }} />,
    color: '#6C63FF',
    glowColor: 'rgba(108,99,255,0.15)',
  },
];

interface ScaleToFitSectionProps {
  scrollReveal: { ref: React.RefObject<HTMLDivElement | null>; isVisible: boolean };
}

export default function ScaleToFitSection({ scrollReveal }: ScaleToFitSectionProps) {
  return (
    <Box
      component="section"
      id="scale"
      ref={scrollReveal.ref}
      sx={{ bgcolor: '#0D0D1A', py: { xs: 8, md: 12 } }}
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
            One platform. Every scale.
          </Typography>
          <Typography
            sx={{
              textAlign: 'center',
              color: 'rgba(255,255,255,0.5)',
              mb: { xs: 5, md: 8 },
              maxWidth: 560,
              mx: 'auto',
            }}
          >
            Whether it's a quick automation or a full product build, Tacticl matches the
            right level of firepower to your task.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {tiers.map((tier, i) => (
            <Grid key={tier.title} size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  p: 4,
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  bgcolor: 'rgba(255,255,255,0.03)',
                  backdropFilter: 'blur(16px)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: scrollReveal.isVisible ? 1 : 0,
                  transform: scrollReveal.isVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'all 0.5s ease-out',
                  transitionDelay: `${i * 150}ms`,
                  '&:hover': {
                    border: `1px solid ${tier.color}40`,
                    boxShadow: `0 0 40px ${tier.glowColor}, inset 0 0 40px ${tier.glowColor}`,
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    background: `linear-gradient(135deg, ${tier.glowColor}, transparent)`,
                    border: `1px solid ${tier.color}25`,
                    color: tier.color,
                  }}
                >
                  {tier.icon}
                </Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: tier.color,
                    mb: 1,
                  }}
                >
                  {tier.title}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, fontSize: '1.1rem' }}>
                  {tier.tagline}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {tier.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
```

- [ ] **Step 2: Verify component renders**

Run: `npm run dev`
Expected: Three glassmorphism cards with glow-on-hover, staggered scroll reveal.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/ScaleToFitSection.tsx
git commit -m "feat(landing): add ScaleToFitSection with glassmorphism tier cards"
```

---

## Task 4: Create ConnectorsSection component

**Files:**
- Create: `src/components/landing/ConnectorsSection.tsx`

- [ ] **Step 1: Build the connector icon grid**

```typescript
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ShareIcon from '@mui/icons-material/Share';
import GitHubIcon from '@mui/icons-material/GitHub';
import DevicesIcon from '@mui/icons-material/Devices';
import ApiIcon from '@mui/icons-material/Api';

const connectors = [
  { label: 'Social', icon: <ShareIcon sx={{ fontSize: 28 }} />, color: '#ec4899' },
  { label: 'GitHub', icon: <GitHubIcon sx={{ fontSize: 28 }} />, color: '#fff' },
  { label: 'Devices', icon: <DevicesIcon sx={{ fontSize: 28 }} />, color: '#06b6d4' },
  { label: 'APIs', icon: <ApiIcon sx={{ fontSize: 28 }} />, color: '#8b5cf6' },
];

interface ConnectorsSectionProps {
  scrollReveal: { ref: React.RefObject<HTMLDivElement | null>; isVisible: boolean };
}

export default function ConnectorsSection({ scrollReveal }: ConnectorsSectionProps) {
  return (
    <Box
      component="section"
      ref={scrollReveal.ref}
      sx={{ bgcolor: '#0F0F23', py: { xs: 6, md: 8 } }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            opacity: scrollReveal.isVisible ? 1 : 0,
            transform: scrollReveal.isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
          }}
        >
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              fontSize: { xs: '1.5rem', md: '1.75rem' },
              mb: 1.5,
              letterSpacing: '-0.02em',
            }}
          >
            Connect your world
          </Typography>
          <Typography
            sx={{
              textAlign: 'center',
              color: 'rgba(255,255,255,0.5)',
              mb: { xs: 4, md: 5 },
              maxWidth: 420,
              mx: 'auto',
            }}
          >
            Tacticl agents work with the tools and platforms you already use.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: { xs: 3, md: 6 },
            flexWrap: 'wrap',
          }}
        >
          {connectors.map((c, i) => (
            <Box
              key={c.label}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                opacity: scrollReveal.isVisible ? 1 : 0,
                transform: scrollReveal.isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.4s ease-out',
                transitionDelay: `${i * 100}ms`,
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.08)',
                  bgcolor: 'rgba(255,255,255,0.03)',
                  color: c.color,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    border: `1px solid ${c.color}40`,
                    boxShadow: `0 0 20px ${c.color}20`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {c.icon}
              </Box>
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                {c.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/ConnectorsSection.tsx
git commit -m "feat(landing): add ConnectorsSection with icon grid"
```

---

## Task 5: Rewrite LandingPage with new sections

**Files:**
- Modify: `src/pages/LandingPage.tsx`

- [ ] **Step 1: Update imports**

Remove unused feature/step icons and PricingSection import. Add imports for new components:

```typescript
import PdlcPipelineShowcase from '../components/landing/PdlcPipelineShowcase';
import ScaleToFitSection from '../components/landing/ScaleToFitSection';
import ConnectorsSection from '../components/landing/ConnectorsSection';
```

Remove these unused imports:
- `BoltIcon`, `RouteIcon`, `AccountTreeIcon`, `FactCheckIcon`, `ShareIcon`, `DevicesIcon` (feature icons)
- `ChatBubbleOutlineIcon`, `HubIcon`, `CheckCircleOutlineIcon` (step icons)
- `PricingSection`

- [ ] **Step 2: Replace features and steps data arrays**

Remove the `features` array (lines 104-135) and update the `steps` array with the new journey steps:

```typescript
const steps = [
  {
    icon: <ChatBubbleOutlineIcon sx={{ fontSize: 40 }} />,
    title: 'Describe your idea',
    description: 'Tell Tacticl what you want to build in plain English. A mobile app, a marketing campaign, an API integration — anything.',
  },
  {
    icon: <HubIcon sx={{ fontSize: 40 }} />,
    title: 'Your team assembles',
    description: 'Tacticl spins up the right AI specialists for the job — from a single agent for quick tasks to a full 12-role development team for complex products.',
  },
  {
    icon: <CheckCircleOutlineIcon sx={{ fontSize: 40 }} />,
    title: 'Review, steer, and ship',
    description: 'Your team works autonomously but checks in at key milestones. Approve, redirect, or skip roles — you\'re the CEO of your own AI staffing company.',
  },
];
```

Keep `ChatBubbleOutlineIcon`, `HubIcon`, `CheckCircleOutlineIcon` imports for the steps.

- [ ] **Step 3: Update Hero section copy**

Replace the hero headline and subtitle:

```typescript
{'One Person. Any Idea.\nA Full Team to Build It.'}
```

Replace subtitle:

```typescript
Tacticl gives you an AI-powered development team on demand. Describe what you want
to build — from a social post to a full product — and your team assembles, executes,
and delivers.
```

Replace the disabled "Watch Demo" button with a "See How It Works" scroll link:

```typescript
<Button
  variant="outlined"
  size="large"
  href="#how-it-works"
  sx={{
    px: 4,
    py: 1.5,
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '12px',
    borderColor: 'rgba(108,99,255,0.5)',
    color: '#9D97FF',
    '&:hover': {
      borderColor: 'rgba(108,99,255,0.8)',
      bgcolor: 'rgba(108,99,255,0.08)',
    },
  }}
>
  See How It Works
</Button>
```

- [ ] **Step 4: Update the How It Works section copy**

Change section header from "How it works" to keep it the same (matches nav link). Update subtitle:

```typescript
Three steps from idea to reality.
```

- [ ] **Step 5: Remove Features section entirely**

Delete the entire Features section (the `<Box component="section" id="features" ...>` block). The "features" concept is replaced by the PDLC showcase + Scale To Fit sections.

- [ ] **Step 6: Remove PricingSection and wire in new sections**

Remove `<PricingSection id="pricing" />` and add the three new component sections between How It Works and CTA. Also remove the `featuresReveal` scroll reveal hook since the features section is gone. Add new scroll reveals for the new sections:

```typescript
// In the component, replace featuresReveal with:
const teamReveal = useScrollReveal();
const scaleReveal = useScrollReveal();
const connectorsReveal = useScrollReveal();
```

Render order after How It Works:
```tsx
<PdlcPipelineShowcase scrollReveal={teamReveal} />
<ScaleToFitSection scrollReveal={scaleReveal} />
<ConnectorsSection scrollReveal={connectorsReveal} />
```

- [ ] **Step 7: Update CTA section copy**

```typescript
// Headline
What will you build?

// Subtitle
Your AI team is ready. Describe your first idea and watch it come to life.

// Button text
Get Started Free
```

- [ ] **Step 8: Verify full page renders correctly**

Run: `npm run dev`
Expected: Landing page shows Hero → How It Works → Meet Your Team (pipeline + cards) → Scale To Fit (3 tiers) → Connectors → CTA → Footer. No pricing section. All scroll reveals work. All animations fire.

- [ ] **Step 9: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat(landing): rewrite landing page with PDLC pipeline, tiers, and connectors"
```

---

## Task 6: Final cleanup and type-check

**Files:**
- Verify: all modified/created files

- [ ] **Step 1: Run TypeScript type-check**

Run: `npm run build`
Expected: Clean build, no type errors.

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: No lint errors in new/modified files.

- [ ] **Step 3: Fix any issues found**

Address any type errors or lint warnings.

- [ ] **Step 4: Visual QA in browser**

Run: `npm run dev`
Check:
- Hero text renders correctly
- "See How It Works" scrolls to How It Works section
- How It Works steps show with connectors
- Pipeline nodes animate in with stagger
- Role cards show all 12 roles
- Scale To Fit cards have glassmorphism effect and hover glow
- Connectors show 4 icons in a row
- CTA section renders
- Header "Pricing" link navigates to `/pricing`
- Mobile responsive — all sections stack vertically

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(landing): address type-check and lint issues from redesign"
```
