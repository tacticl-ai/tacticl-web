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
