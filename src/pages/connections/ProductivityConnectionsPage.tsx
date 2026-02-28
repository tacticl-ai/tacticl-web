import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BuildIcon from '@mui/icons-material/Build';
import TopBar from '../../components/layout/TopBar';

export default function ProductivityConnectionsPage() {
  const navigate = useNavigate();

  return (
    <>
      <TopBar
        title="Productivity Connections"
        actions={
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            size="small"
            onClick={() => navigate('/connections')}
          >
            All Connections
          </Button>
        }
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 10,
          gap: 2,
        }}
      >
        <BuildIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.4 }} />
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Coming Soon
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, textAlign: 'center' }}>
          Productivity integrations like Slack, Notion, and Google Drive are on the way.
          Stay tuned for updates.
        </Typography>
      </Box>
    </>
  );
}
