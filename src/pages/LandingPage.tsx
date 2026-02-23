import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import BoltIcon from '@mui/icons-material/Bolt';
import RouteIcon from '@mui/icons-material/AltRoute';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import ShareIcon from '@mui/icons-material/Share';
import DevicesIcon from '@mui/icons-material/Devices';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HubIcon from '@mui/icons-material/Hub';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TacticlLogo from '../components/TacticlLogo';
import PublicHeader from '../components/layout/PublicHeader';

const AUTH_BASE = 'https://tacticl-auth.web.app';
const REDIRECT = 'https://tacticl.web.app/';
const SIGNUP_URL = `${AUTH_BASE}/signup?redirect=${encodeURIComponent(REDIRECT)}`;

const features = [
  {
    icon: <BoltIcon sx={{ fontSize: 32 }} />,
    title: 'Sparks',
    description: 'Drop tasks in plain English. No code, no config — just say what you need done.',
  },
  {
    icon: <RouteIcon sx={{ fontSize: 32 }} />,
    title: 'Smart Routing',
    description: 'Tasks route to the optimal device automatically based on your preferences and capabilities.',
  },
  {
    icon: <AccountTreeIcon sx={{ fontSize: 32 }} />,
    title: 'Tactics',
    description: 'Complex tasks are decomposed into parallel subtasks that execute simultaneously.',
  },
  {
    icon: <FactCheckIcon sx={{ fontSize: 32 }} />,
    title: 'Checkpoints',
    description: 'Review agent progress at key milestones. Stay in control without micromanaging.',
  },
  {
    icon: <ShareIcon sx={{ fontSize: 32 }} />,
    title: 'Social Publishing',
    description: 'Publish results directly to your connected social accounts with one approval.',
  },
  {
    icon: <DevicesIcon sx={{ fontSize: 32 }} />,
    title: 'Multi-Device',
    description: 'MacBook, iPhone, iPad — all your devices work together as a unified AI workforce.',
  },
];

const steps = [
  {
    icon: <ChatBubbleOutlineIcon sx={{ fontSize: 40 }} />,
    title: 'Describe your task',
    description: 'Type what you need in plain English. No templates, no boilerplate.',
  },
  {
    icon: <HubIcon sx={{ fontSize: 40 }} />,
    title: 'AI routes to the best device',
    description: 'The cloud orchestrator classifies your Spark and sends it to the right machine.',
  },
  {
    icon: <CheckCircleOutlineIcon sx={{ fontSize: 40 }} />,
    title: 'Review results and approve',
    description: 'Agents work autonomously, then present results at checkpoints for your review.',
  },
];

/* ---------- CSS keyframes (injected once) ---------- */

const globalKeyframes = `
@keyframes gridFade {
  0%, 100% { opacity: 0.03; }
  50% { opacity: 0.07; }
}
@keyframes floatDot {
  0% { transform: translateY(0) scale(1); opacity: 0.4; }
  50% { transform: translateY(-20px) scale(1.2); opacity: 0.7; }
  100% { transform: translateY(0) scale(1); opacity: 0.4; }
}
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes dashFlow {
  from { stroke-dashoffset: 12; }
  to { stroke-dashoffset: 0; }
}
@media (prefers-reduced-motion: no-preference) {
  .animated-dash { animation: dashFlow 1s linear infinite; }
}
`;

/* ---------- Floating dots for hero ---------- */

const heroDots = Array.from({ length: 18 }, (_, i) => ({
  left: `${5 + ((i * 37) % 90)}%`,
  top: `${10 + ((i * 53) % 75)}%`,
  size: 2 + (i % 4),
  delay: (i * 0.7) % 5,
  duration: 4 + (i % 3),
  color: i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#8b5cf6' : '#ec4899',
}));

export default function LandingPage() {
  return (
    <Box sx={{ bgcolor: '#0D0D1A', minHeight: '100vh', color: '#fff', overflow: 'hidden' }}>
      {/* Inject keyframes */}
      <style>{globalKeyframes}</style>

      <PublicHeader />

      {/* ========== Hero Section ========== */}
      <Box
        component="section"
        sx={{
          position: 'relative',
          minHeight: { xs: '90vh', md: '85vh' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pt: { xs: 12, md: 8 },
          pb: { xs: 8, md: 10 },
        }}
      >
        {/* Animated grid background */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(108,99,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.06) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            '@media (prefers-reduced-motion: no-preference)': {
              animation: 'gridFade 6s ease-in-out infinite',
            },
          }}
        />

        {/* Radial glow */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '500px',
            background: 'radial-gradient(ellipse, rgba(108,99,255,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Floating dots */}
        {heroDots.map((dot, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              left: dot.left,
              top: dot.top,
              width: dot.size,
              height: dot.size,
              borderRadius: '50%',
              bgcolor: dot.color,
              opacity: 0.4,
              pointerEvents: 'none',
              '@media (prefers-reduced-motion: no-preference)': {
                animation: `floatDot ${dot.duration}s ease-in-out ${dot.delay}s infinite`,
              },
            }}
          />
        ))}

        {/* Hero content */}
        <Container
          maxWidth="md"
          sx={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            '@media (prefers-reduced-motion: no-preference)': {
              animation: 'fadeInUp 0.8s ease-out',
            },
          }}
        >
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
            <TacticlLogo size={100} />
          </Box>

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.25rem', sm: '3rem', md: '3.75rem' },
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              mb: 3,
              whiteSpace: 'pre-line',
              background: 'linear-gradient(135deg, #fff 30%, #9D97FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {'Your AI Agents,\nDistributed Everywhere'}
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255,255,255,0.65)',
              fontWeight: 400,
              fontSize: { xs: '1rem', sm: '1.15rem', md: '1.3rem' },
              maxWidth: 620,
              mx: 'auto',
              mb: 5,
              lineHeight: 1.6,
            }}
          >
            Drop a Spark. Route it to the right device. Let AI agents handle the rest.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              href={SIGNUP_URL}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6C63FF 0%, #8b5cf6 100%)',
                boxShadow: '0 4px 24px rgba(108,99,255,0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7C73FF 0%, #9b6cf6 100%)',
                  boxShadow: '0 6px 32px rgba(108,99,255,0.5)',
                },
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              disabled
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '12px',
                borderColor: 'rgba(108,99,255,0.5)',
                color: '#9D97FF',
                '&.Mui-disabled': {
                  borderColor: 'rgba(108,99,255,0.25)',
                  color: 'rgba(157,151,255,0.4)',
                },
              }}
            >
              Watch Demo — Coming Soon
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ========== Features Section ========== */}
      <Box component="section" id="features" sx={{ bgcolor: '#0F0F23', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
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
            Everything you need to orchestrate AI
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
            Six primitives that turn your devices into a distributed AI workforce.
          </Typography>

          <Grid container spacing={3}>
            {features.map((f, i) => (
              <Grid key={f.title} size={{ xs: 12, sm: 6, md: 4 }}>
                <Box
                  sx={{
                    p: 4,
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    bgcolor: 'rgba(255,255,255,0.02)',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '@media (prefers-reduced-motion: no-preference)': {
                      animation: `fadeInUp 0.6s ease-out ${0.1 * i}s both`,
                    },
                    '&:hover': {
                      border: '1px solid rgba(108,99,255,0.3)',
                      bgcolor: 'rgba(108,99,255,0.05)',
                      boxShadow: '0 0 30px rgba(108,99,255,0.1)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2.5,
                      background: `linear-gradient(135deg, ${
                        i % 3 === 0
                          ? 'rgba(6,182,212,0.15), rgba(6,182,212,0.05)'
                          : i % 3 === 1
                            ? 'rgba(139,92,246,0.15), rgba(139,92,246,0.05)'
                            : 'rgba(236,72,153,0.15), rgba(236,72,153,0.05)'
                      })`,
                      color: i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#8b5cf6' : '#ec4899',
                    }}
                  >
                    {f.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '1.1rem' }}>
                    {f.title}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {f.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ========== How It Works Section ========== */}
      <Box component="section" id="how-it-works" sx={{ bgcolor: '#0D0D1A', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="md">
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
            How it works
          </Typography>
          <Typography
            sx={{
              textAlign: 'center',
              color: 'rgba(255,255,255,0.5)',
              mb: { xs: 6, md: 8 },
              maxWidth: 480,
              mx: 'auto',
            }}
          >
            Three steps from idea to execution.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'center', md: 'flex-start' },
              gap: { xs: 2, md: 0 },
            }}
          >
            {steps.map((step, i) => (
              <Box key={step.title} sx={{ display: 'contents' }}>
                {/* Step card */}
                <Box
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    px: { xs: 2, md: 3 },
                    '@media (prefers-reduced-motion: no-preference)': {
                      animation: `fadeInUp 0.6s ease-out ${0.2 * i}s both`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      background:
                        i === 0
                          ? 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))'
                          : i === 1
                            ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))'
                            : 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.05))',
                      color: i === 0 ? '#06b6d4' : i === 1 ? '#8b5cf6' : '#ec4899',
                      border: `1px solid ${
                        i === 0
                          ? 'rgba(6,182,212,0.2)'
                          : i === 1
                            ? 'rgba(139,92,246,0.2)'
                            : 'rgba(236,72,153,0.2)'
                      }`,
                    }}
                  >
                    {step.icon}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'rgba(255,255,255,0.35)',
                      mb: 1,
                    }}
                  >
                    Step {i + 1}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '1.05rem' }}>
                    {step.title}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                    {step.description}
                  </Typography>
                </Box>

                {/* Connector between steps (desktop only) */}
                {i < steps.length - 1 && (
                  <Box
                    sx={{
                      display: { xs: 'none', md: 'flex' },
                      alignItems: 'center',
                      pt: 4,
                    }}
                  >
                    <svg width="60" height="20" viewBox="0 0 60 20">
                      <line
                        x1="0"
                        y1="10"
                        x2="48"
                        y2="10"
                        stroke="rgba(108,99,255,0.3)"
                        strokeWidth="2"
                        strokeDasharray="6 6"
                        className="animated-dash"
                      />
                      <polygon points="48,5 58,10 48,15" fill="rgba(108,99,255,0.4)" />
                    </svg>
                  </Box>
                )}

                {/* Connector between steps (mobile only) */}
                {i < steps.length - 1 && (
                  <Box
                    sx={{
                      display: { xs: 'flex', md: 'none' },
                      justifyContent: 'center',
                      py: 1,
                    }}
                  >
                    <svg width="20" height="40" viewBox="0 0 20 40">
                      <line
                        x1="10"
                        y1="0"
                        x2="10"
                        y2="28"
                        stroke="rgba(108,99,255,0.3)"
                        strokeWidth="2"
                        strokeDasharray="6 6"
                        className="animated-dash"
                      />
                      <polygon points="5,28 10,38 15,28" fill="rgba(108,99,255,0.4)" />
                    </svg>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ========== CTA Section ========== */}
      <Box
        component="section"
        sx={{
          bgcolor: '#0F0F23',
          py: { xs: 8, md: 12 },
          position: 'relative',
        }}
      >
        {/* Gradient glow behind CTA */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '300px',
            background: 'radial-gradient(ellipse, rgba(108,99,255,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="sm" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              mb: 2,
              letterSpacing: '-0.02em',
            }}
          >
            Ready to deploy your AI agents?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 4, maxWidth: 420, mx: 'auto' }}>
            Start with a single Spark and scale to a fleet of autonomous agents across all your devices.
          </Typography>
          <Button
            variant="contained"
            size="large"
            href={SIGNUP_URL}
            sx={{
              px: 5,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6C63FF 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 24px rgba(108,99,255,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7C73FF 0%, #9b6cf6 100%)',
                boxShadow: '0 6px 32px rgba(108,99,255,0.5)',
              },
            }}
          >
            Sign Up Free
          </Button>
        </Container>
      </Box>

      {/* ========== Footer ========== */}
      <Box
        component="footer"
        sx={{
          bgcolor: '#0D0D1A',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          py: 4,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
          &copy; 2026 Tacticl. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
