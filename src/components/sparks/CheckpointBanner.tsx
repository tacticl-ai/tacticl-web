import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReplayIcon from '@mui/icons-material/Replay';
import CancelIcon from '@mui/icons-material/Cancel';
import { useResolveCheckpoint } from '../../hooks/usePipeline';
import { ApiError } from '../../api/client';
import type { Checkpoint, CheckpointDecision } from '../../api/types';

interface CheckpointBannerProps {
  sparkId: string;
  checkpoint: Checkpoint;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#CF6679',
  high: '#FF9800',
  medium: '#FFD54F',
  low: '#03DAC6',
  info: '#B39DDB',
};

function severityColor(severity: string): string {
  return SEVERITY_COLORS[severity.toLowerCase()] ?? '#888';
}

export default function CheckpointBanner({ sparkId, checkpoint }: CheckpointBannerProps) {
  const [feedback, setFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resolveCheckpoint = useResolveCheckpoint(sparkId);

  const handleDecision = (decision: CheckpointDecision) => {
    setErrorMessage(null);
    resolveCheckpoint.mutate(
      {
        checkpointId: checkpoint.id,
        data: {
          decision,
          feedback: feedback.trim() || null,
        },
      },
      {
        onError: (error: unknown) => {
          if (error instanceof ApiError) {
            if (error.status === 409) {
              setErrorMessage('Checkpoint already resolved');
            } else if (error.status === 403) {
              setErrorMessage('Not authorized');
            } else {
              setErrorMessage(error.message || 'An error occurred');
            }
          } else {
            setErrorMessage('An unexpected error occurred');
          }
        },
      },
    );
  };

  return (
    <Card
      sx={{
        borderLeft: '3px solid #FF9800',
        bgcolor: 'rgba(255, 152, 0, 0.04)',
      }}
    >
      <CardContent>
        {/* Title */}
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: '#FF9800', mb: 0.5 }}
        >
          {checkpoint.title}
        </Typography>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {checkpoint.description}
        </Typography>

        {/* Findings list */}
        {checkpoint.findings.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            {checkpoint.findings.map((finding, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  mb: 0.75,
                  pl: 0.5,
                }}
              >
                <Chip
                  label={finding.severity}
                  size="small"
                  sx={{
                    bgcolor: `${severityColor(finding.severity)}20`,
                    color: severityColor(finding.severity),
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    height: 20,
                    mt: '2px',
                    flexShrink: 0,
                  }}
                />
                <Box>
                  <Typography variant="body2">{finding.description}</Typography>
                  {finding.suggestedAction && (
                    <Typography variant="caption" color="text.secondary">
                      {finding.suggestedAction}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Feedback field */}
        <TextField
          size="small"
          fullWidth
          placeholder="Optional feedback or instructions..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          multiline
          rows={3}
          sx={{
            mb: 1.5,
            '& .MuiInputBase-root': {
              bgcolor: 'rgba(0, 0, 0, 0.2)',
            },
          }}
        />

        {/* Error alert */}
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        {/* Action buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleDecision('APPROVED')}
            disabled={resolveCheckpoint.isPending}
            sx={{
              bgcolor: '#4CAF50',
              '&:hover': { bgcolor: '#388E3C' },
            }}
          >
            Approve
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ReplayIcon />}
            onClick={() => handleDecision('REWORK')}
            disabled={resolveCheckpoint.isPending}
            sx={{
              color: '#FF9800',
              borderColor: '#FF9800',
              '&:hover': {
                borderColor: '#FF9800',
                bgcolor: 'rgba(255, 152, 0, 0.08)',
              },
            }}
          >
            Rework
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CancelIcon />}
            onClick={() => handleDecision('CANCEL')}
            disabled={resolveCheckpoint.isPending}
            sx={{
              color: '#CF6679',
              borderColor: '#CF6679',
              '&:hover': {
                borderColor: '#CF6679',
                bgcolor: 'rgba(207, 102, 121, 0.08)',
              },
            }}
          >
            Reject
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
