import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import ShareIcon from '@mui/icons-material/Share';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import CodeIcon from '@mui/icons-material/Code';
import BuildIcon from '@mui/icons-material/Build';
import TopBar from '../../components/layout/TopBar';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { useConnections } from '../../hooks/useConnections';
import {
  type ConnectionCategory,
  categoryLabels,
  categoryDescriptions,
  getPlatformsByCategory,
  getConnectionForPlatform,
} from '../../config/platformConfig';
import type { Connection } from '../../api/types';

const categoryIcons: Record<ConnectionCategory, React.ReactElement> = {
  social: <ShareIcon />,
  media: <PhotoLibraryIcon />,
  developer: <CodeIcon />,
  productivity: <BuildIcon />,
};

const categoryAccentColors: Record<ConnectionCategory, string> = {
  social: '#6C63FF',
  media: '#FF6B6B',
  developer: '#03DAC6',
  productivity: '#FF9800',
};

const categories: ConnectionCategory[] = ['social', 'media', 'developer', 'productivity'];

export default function ConnectionsOverviewPage() {
  const { data: connections, isLoading, isError, refetch } = useConnections();
  const navigate = useNavigate();
  const displayConnections = connections ?? [];

  if (isLoading) {
    return (
      <>
        <TopBar title="Connections" />
        <LoadingState message="Loading connections..." />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <TopBar title="Connections" />
        <ErrorState message="Failed to load connections." onRetry={refetch} />
      </>
    );
  }

  return (
    <>
      <TopBar title="Connections" />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Connect your accounts to let Tacticl act on your behalf across platforms.
      </Typography>

      <Grid container spacing={3}>
        {categories.map((category) => {
          const categoryPlatforms = getPlatformsByCategory(category);
          const connectedPlatforms = categoryPlatforms.filter((p) =>
            getConnectionForPlatform(displayConnections as Connection[], p.key),
          );
          const connectedCount = connectedPlatforms.length;
          const totalCount = categoryPlatforms.length;
          const accentColor = categoryAccentColors[category];
          const isComingSoon = category === 'productivity';

          return (
            <Grid key={category} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
                  border: 1,
                  borderColor: 'divider',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${accentColor}20`,
                    borderColor: accentColor,
                  },
                  ...(isComingSoon && { opacity: 0.6 }),
                }}
              >
                {/* Accent stripe */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    bgcolor: accentColor,
                  }}
                />
                <CardActionArea
                  onClick={() => navigate(`/connections/${category}`)}
                  disabled={isComingSoon}
                  sx={{ height: '100%', p: 0 }}
                >
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          bgcolor: `${accentColor}20`,
                          color: accentColor,
                          width: 44,
                          height: 44,
                        }}
                      >
                        {categoryIcons[category]}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                          {categoryLabels[category]}
                        </Typography>
                        {isComingSoon && (
                          <Chip label="Coming Soon" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                        )}
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                      {categoryDescriptions[category]}
                    </Typography>

                    {!isComingSoon && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <AvatarGroup
                          max={5}
                          sx={{
                            '& .MuiAvatar-root': {
                              width: 28,
                              height: 28,
                              fontSize: 12,
                              border: '2px solid',
                              borderColor: 'background.paper',
                            },
                          }}
                        >
                          {categoryPlatforms.map((p) => {
                            const connected = !!getConnectionForPlatform(
                              displayConnections as Connection[],
                              p.key,
                            );
                            return (
                              <Avatar
                                key={p.key}
                                sx={{
                                  bgcolor: p.color,
                                  opacity: connected ? 1 : 0.3,
                                  '& .MuiSvgIcon-root': { color: '#fff', fontSize: 14 },
                                }}
                              >
                                {p.icon}
                              </Avatar>
                            );
                          })}
                        </AvatarGroup>
                        <Chip
                          label={`${connectedCount} / ${totalCount}`}
                          size="small"
                          color={connectedCount > 0 ? 'success' : 'default'}
                          variant={connectedCount > 0 ? 'filled' : 'outlined'}
                        />
                      </Box>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}
