import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import SparkStatusBadge from './SparkStatusBadge';
import type { Spark } from '../../api/types';

interface SparkCardProps {
  spark: Spark;
}

export default function SparkCard({ spark }: SparkCardProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardActionArea onClick={() => navigate(`/sparks/${spark.id}`)}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 1,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1, mr: 1 }}>
              {spark.title}
            </Typography>
            <SparkStatusBadge status={spark.status} />
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {spark.description}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {spark.type && (
              <Chip
                label={spark.type}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            {spark.priority !== 'NORMAL' && (
              <Chip
                label={spark.priority}
                size="small"
                color={spark.priority === 'URGENT' ? 'error' : spark.priority === 'HIGH' ? 'warning' : 'default'}
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              {formatDistanceToNow(new Date(spark.createdAt), { addSuffix: true })}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
