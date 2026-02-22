import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import ShareIcon from '@mui/icons-material/Share';
import TopBar from '../components/layout/TopBar';

export default function SocialPage() {
  return (
    <>
      <TopBar title="Social" />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
        }}
      >
        <ShareIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          Social Integrations
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, textAlign: 'center', mb: 3 }}>
          Manage your social media integrations. Connect Twitter, LinkedIn, and Instagram to automate posting.
        </Typography>
        <Card sx={{ maxWidth: 480, width: '100%' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Social media features from the existing tacticl-mobile app will be available here. This includes post scheduling, content drafting, and multi-platform publishing.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
