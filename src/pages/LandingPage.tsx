import { useCallback, useEffect, useRef, useState } from 'react';
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

const AUTH_BASE = 'https://auth.tacticl.ai';
const REDIRECT = 'https://tacticl.ai/';
const SIGNUP_URL = `${AUTH_BASE}/signup?redirect=${encodeURIComponent(REDIRECT)}`;

/* ---------- Hooks ---------- */

function useParallax() {
  const scrollY = useRef(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const helixRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    if (prefersReduced || isMobile) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          scrollY.current = y;
          if (gridRef.current) gridRef.current.style.transform = `translate3d(0, ${y * 0.1}px, 0)`;
          if (helixRef.current) helixRef.current.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
          if (dotsRef.current) dotsRef.current.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { gridRef, helixRef, dotsRef };
}

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

function useTilt3D(maxTilt = 5) {
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x * maxTilt}deg) rotateX(${-y * maxTilt}deg) translateY(-2px)`;
    },
    [maxTilt],
  );

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateY(0)';
  }, []);

  return { onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave };
}

/* ---------- Data ---------- */

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

/* ---------- CSS keyframes ---------- */

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
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes dashFlow {
  from { stroke-dashoffset: 12; }
  to { stroke-dashoffset: 0; }
}
@keyframes nodePulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}
@keyframes helixFlow {
  from { stroke-dashoffset: 20; }
  to { stroke-dashoffset: 0; }
}
@media (prefers-reduced-motion: no-preference) {
  .animated-dash { animation: dashFlow 1s linear infinite; }
  .helix-line { animation: helixFlow 2s linear infinite; }
  .helix-node { animation: nodePulse 3s ease-in-out infinite; }
}
`;

/* ---------- DNA Helix SVG ---------- */

const HELIX_NODES = Array.from({ length: 20 }, (_, i) => {
  const t = (i / 20) * Math.PI * 3;
  const strand = i % 2;
  const x = 50 + (i / 20) * 1100;
  const y = 350 + Math.sin(t + strand * Math.PI) * 180;
  const colors = ['#06b6d4', '#8b5cf6', '#ec4899'];
  return { x, y, color: colors[i % 3], delay: i * 0.15, strand };
});

// Connect nearby nodes across strands
const HELIX_CONNECTIONS: { x1: number; y1: number; x2: number; y2: number; delay: number }[] = [];
for (let i = 0; i < HELIX_NODES.length; i++) {
  for (let j = i + 1; j < HELIX_NODES.length; j++) {
    const a = HELIX_NODES[i];
    const b = HELIX_NODES[j];
    if (a.strand === b.strand) continue;
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    if (dist < 200) {
      HELIX_CONNECTIONS.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, delay: i * 0.1 });
    }
  }
}

function DNAHelixBackground() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none' }}
    >
      {HELIX_CONNECTIONS.map((c, i) => (
        <line
          key={`c${i}`}
          x1={c.x1}
          y1={c.y1}
          x2={c.x2}
          y2={c.y2}
          stroke="rgba(108,99,255,0.08)"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="helix-line"
          style={{ animationDelay: `${c.delay}s` }}
        />
      ))}
      {HELIX_NODES.map((n, i) => (
        <circle
          key={`n${i}`}
          cx={n.x}
          cy={n.y}
          r={2.5}
          fill={n.color}
          className="helix-node"
          style={{ animationDelay: `${n.delay}s` }}
        />
      ))}
    </svg>
  );
}

/* ---------- Floating dots ---------- */

const heroDots = Array.from({ length: 18 }, (_, i) => ({
  left: `${5 + ((i * 37) % 90)}%`,
  top: `${10 + ((i * 53) % 75)}%`,
  size: 2 + (i % 4),
  delay: (i * 0.7) % 5,
  duration: 4 + (i % 3),
  color: i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#8b5cf6' : '#ec4899',
}));

/* ---------- Component ---------- */

export default function LandingPage() {
  const { gridRef, helixRef, dotsRef } = useParallax();
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const featuresReveal = useScrollReveal();
  const howItWorksReveal = useScrollReveal();
  const ctaReveal = useScrollReveal();
  const tilt = useTilt3D(5);

  const handleHeroMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    if (orb1Ref.current) {
      orb1Ref.current.style.transform = `translate3d(${x * 40}px, ${y * 30}px, 0)`;
    }
    if (orb2Ref.current) {
      orb2Ref.current.style.transform = `translate3d(${x * -25}px, ${y * -20}px, 0)`;
    }
  }, []);

  return (
    <Box sx={{ bgcolor: '#0D0D1A', minHeight: '100vh', color: '#fff', overflow: 'hidden' }}>
      <style>{globalKeyframes}</style>

      <PublicHeader />

      {/* ========== Hero Section ========== */}
      <Box
        component="section"
        onMouseMove={handleHeroMouseMove}
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
        {/* Parallax layer: Animated grid */}
        <Box
          ref={gridRef}
          sx={{
            position: 'absolute',
            inset: 0,
            willChange: 'transform',
            backgroundImage:
              'linear-gradient(rgba(108,99,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.06) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            '@media (prefers-reduced-motion: no-preference)': {
              animation: 'gridFade 6s ease-in-out infinite',
            },
          }}
        />

        {/* Parallax layer: DNA Helix */}
        <Box
          ref={helixRef}
          sx={{ position: 'absolute', inset: 0, willChange: 'transform', pointerEvents: 'none' }}
        >
          <DNAHelixBackground />
        </Box>

        {/* Mouse-responsive gradient orbs */}
        <Box
          ref={orb1Ref}
          sx={{
            position: 'absolute',
            top: '10%',
            left: '20%',
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
            transition: 'transform 0.3s ease-out',
          }}
        />
        <Box
          ref={orb2Ref}
          sx={{
            position: 'absolute',
            bottom: '10%',
            right: '15%',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
            transition: 'transform 0.3s ease-out',
          }}
        />

        {/* Parallax layer: Floating dots */}
        <Box
          ref={dotsRef}
          sx={{ position: 'absolute', inset: 0, willChange: 'transform', pointerEvents: 'none' }}
        >
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
                '@media (prefers-reduced-motion: no-preference)': {
                  animation: `floatDot ${dot.duration}s ease-in-out ${dot.delay}s infinite`,
                },
              }}
            />
          ))}
        </Box>

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
      <Box
        component="section"
        id="features"
        ref={featuresReveal.ref}
        sx={{ bgcolor: '#0F0F23', py: { xs: 8, md: 12 } }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              opacity: featuresReveal.isVisible ? 1 : 0,
              transform: featuresReveal.isVisible ? 'translateY(0)' : 'translateY(40px)',
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
          </Box>

          <Grid container spacing={3}>
            {features.map((f, i) => (
              <Grid key={f.title} size={{ xs: 12, sm: 6, md: 4 }}>
                <Box
                  {...tilt}
                  sx={{
                    p: 4,
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    bgcolor: 'rgba(255,255,255,0.02)',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    opacity: featuresReveal.isVisible ? 1 : 0,
                    transform: featuresReveal.isVisible ? undefined : 'translateY(40px)',
                    transitionDelay: featuresReveal.isVisible ? `${i * 100}ms` : '0ms',
                    '&:hover': {
                      border: '1px solid rgba(108,99,255,0.3)',
                      bgcolor: 'rgba(108,99,255,0.05)',
                      boxShadow: '0 0 30px rgba(108,99,255,0.1)',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 'inherit',
                      background:
                        'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 45%, transparent 50%)',
                      pointerEvents: 'none',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    },
                    '@media (hover: hover)': {
                      '&:hover::after': { opacity: 1 },
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
      <Box
        component="section"
        id="how-it-works"
        ref={howItWorksReveal.ref}
        sx={{ bgcolor: '#0D0D1A', py: { xs: 8, md: 12 } }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              opacity: howItWorksReveal.isVisible ? 1 : 0,
              transform: howItWorksReveal.isVisible ? 'translateY(0)' : 'translateY(40px)',
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
          </Box>

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
                <Box
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    px: { xs: 2, md: 3 },
                    opacity: howItWorksReveal.isVisible ? 1 : 0,
                    transform: howItWorksReveal.isVisible ? 'translateY(0)' : 'translateY(40px)',
                    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                    transitionDelay: howItWorksReveal.isVisible ? `${i * 200}ms` : '0ms',
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

                {/* Connector (desktop) */}
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

                {/* Connector (mobile) */}
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
        ref={ctaReveal.ref}
        sx={{
          bgcolor: '#0F0F23',
          py: { xs: 8, md: 12 },
          position: 'relative',
        }}
      >
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

        <Container
          maxWidth="sm"
          sx={{
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
            opacity: ctaReveal.isVisible ? 1 : 0,
            transform: ctaReveal.isVisible ? 'translateY(0)' : 'translateY(40px)',
            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
          }}
        >
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
