import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PublicHeader from '../components/layout/PublicHeader';
import PricingSection from '../components/pricing/PricingSection';

export default function PricingPage() {
  return (
    <Box sx={{ bgcolor: '#0D0D1A', minHeight: '100vh', color: '#fff' }}>
      <PublicHeader />
      <Box sx={{ pt: 12 }} />
      <PricingSection />
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
