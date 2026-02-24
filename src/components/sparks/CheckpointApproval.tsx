import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { format } from 'date-fns';
import { useDecideCheckpoint } from '../../hooks/useCheckpoints';
import type { Checkpoint } from '../../api/types';

interface CheckpointApprovalProps {
  checkpoint: Checkpoint;
  onDecided?: () => void;
}

export default function CheckpointApproval({ checkpoint, onDecided }: CheckpointApprovalProps) {
  const [feedback, setFeedback] = useState('');
  const decideCheckpoint = useDecideCheckpoint();

  const handleDecide = (decision: 'APPROVED' | 'REJECTED') => {
    decideCheckpoint.mutate(
      {
        id: checkpoint.id,
        data: { decision, ...(feedback.trim() ? { feedback: feedback.trim() } : {}) },
      },
      { onSuccess: () => onDecided?.() },
    );
  };

  if (checkpoint.userDecision) {
    return (
      <Card
        sx={{
          borderLeft: '3px solid',
          borderLeftColor: checkpoint.userDecision === 'APPROVED' ? 'success.main' : 'error.main',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip
              label={checkpoint.userDecision}
              size="small"
              color={checkpoint.userDecision === 'APPROVED' ? 'success' : 'error'}
            />
            {checkpoint.decidedAt && (
              <Typography variant="caption" color="text.secondary">
                {format(new Date(checkpoint.decidedAt), 'MMM d, HH:mm:ss')}
              </Typography>
            )}
          </Box>
          <Typography variant="subtitle2">{checkpoint.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {checkpoint.description}
          </Typography>
          {checkpoint.userFeedback && (
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
              Feedback: {checkpoint.userFeedback}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        borderLeft: '3px solid',
        borderLeftColor: 'warning.main',
      }}
    >
      <CardContent>
        <Chip
          label="Requires Approval"
          size="small"
          sx={{
            mb: 1.5,
            bgcolor: 'rgba(255, 152, 0, 0.12)',
            color: 'warning.main',
            fontWeight: 600,
          }}
        />

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          {checkpoint.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {checkpoint.description}
        </Typography>

        {checkpoint.findings.length > 0 && (
          <List dense disablePadding sx={{ mb: 1.5 }}>
            {checkpoint.findings.map((f, i) => (
              <ListItem key={i} sx={{ px: 0, py: 0.25 }}>
                <ListItemText
                  primary={f.description}
                  secondary={f.suggestedAction}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        )}

        {checkpoint.options.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
            {checkpoint.options.map((option) => (
              <Chip key={option} label={option} size="small" variant="outlined" />
            ))}
          </Stack>
        )}

        <TextField
          size="small"
          fullWidth
          placeholder="Optional feedback..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          multiline
          maxRows={3}
          sx={{ mb: 1.5 }}
        />

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleDecide('APPROVED')}
            disabled={decideCheckpoint.isPending}
          >
            Approve
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<CancelIcon />}
            onClick={() => handleDecide('REJECTED')}
            disabled={decideCheckpoint.isPending}
          >
            Reject
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
