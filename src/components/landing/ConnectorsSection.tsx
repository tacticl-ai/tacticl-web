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
            Your ecosystem, connected
          </Typography>
          <Typography
            sx={{
              textAlign: 'center',
              color: 'rgba(255,255,255,0.5)',
              mb: { xs: 4, md: 5 },
              maxWidth: 480,
              mx: 'auto',
            }}
          >
            Distribute your agents across devices or the cloud. Connect the tools and platforms
            you already use — you decide where and how your workflows run.
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
