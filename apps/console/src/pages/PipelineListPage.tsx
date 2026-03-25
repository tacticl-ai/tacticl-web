import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import SearchIcon from '@mui/icons-material/Search';
import { format, parseISO } from 'date-fns';
import { usePipelineRuns } from '../api/analytics.ts';
import StatusBadge from '../components/common/StatusBadge.tsx';
import LoadingSpinner from '../components/common/LoadingSpinner.tsx';
import type { PipelineRun } from '../api/types.ts';

type SortKey = 'createdAt' | 'costUsd' | 'totalTokens' | 'durationMs' | 'status';
type SortDir = 'asc' | 'desc';

function formatDuration(ms: number): string {
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)}m`;
  if (ms >= 1_000) return `${(ms / 1_000).toFixed(1)}s`;
  return `${ms}ms`;
}

export default function PipelineListPage() {
  const { data, isLoading, error } = usePipelineRuns();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    if (!data?.pipelines) return [];
    let result = data.pipelines;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q) ||
          (p.type && p.type.toLowerCase().includes(q)),
      );
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'createdAt') cmp = a.createdAt.localeCompare(b.createdAt);
      else if (sortKey === 'costUsd') cmp = a.costUsd - b.costUsd;
      else if (sortKey === 'totalTokens') cmp = a.totalTokens - b.totalTokens;
      else if (sortKey === 'durationMs') cmp = a.durationMs - b.durationMs;
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [data, search, sortKey, sortDir]);

  if (isLoading) return <LoadingSpinner message="Loading pipeline runs..." />;
  if (error) return <Alert severity="error" sx={{ mt: 2 }}>Failed to load pipelines: {(error as Error).message}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#e0e0e0' }}>
            Pipeline Runs
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
            {data?.total ?? 0} total pipeline executions
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Search pipelines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#666', fontSize: 18 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            width: 280,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#1a1a2e',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
            },
          }}
        />
      </Box>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Pipeline</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortKey === 'status'}
                    direction={sortKey === 'status' ? sortDir : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>Roles</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortKey === 'totalTokens'}
                    direction={sortKey === 'totalTokens' ? sortDir : 'asc'}
                    onClick={() => handleSort('totalTokens')}
                  >
                    Tokens
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortKey === 'costUsd'}
                    direction={sortKey === 'costUsd' ? sortDir : 'asc'}
                    onClick={() => handleSort('costUsd')}
                  >
                    Cost
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortKey === 'durationMs'}
                    direction={sortKey === 'durationMs' ? sortDir : 'asc'}
                    onClick={() => handleSort('durationMs')}
                  >
                    Duration
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortKey === 'createdAt'}
                    direction={sortKey === 'createdAt' ? sortDir : 'asc'}
                    onClick={() => handleSort('createdAt')}
                  >
                    Created
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p: PipelineRun) => (
                <TableRow
                  key={p.id}
                  hover
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' } }}
                  onClick={() => navigate(`/pipelines/${p.id}`)}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#e0e0e0', fontSize: '0.8rem' }}>
                      {p.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666', fontSize: '0.65rem' }}>
                      {p.id.slice(0, 8)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {p.type && (
                      <Chip
                        label={p.type}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {p.roles.slice(0, 3).map((r) => (
                        <Chip
                          key={r}
                          label={r}
                          size="small"
                          sx={{ fontSize: '0.6rem', height: 18, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        />
                      ))}
                      {p.roles.length > 3 && (
                        <Chip
                          label={`+${p.roles.length - 3}`}
                          size="small"
                          sx={{ fontSize: '0.6rem', height: 18, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#999', fontSize: '0.8rem' }}>
                    {p.totalTokens.toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 600 }}>
                    ${p.costUsd.toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#999', fontSize: '0.8rem' }}>
                    {formatDuration(p.durationMs)}
                  </TableCell>
                  <TableCell sx={{ color: '#999', fontSize: '0.75rem' }}>
                    {format(parseISO(p.createdAt), 'MMM d, HH:mm')}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#666' }}>
                    {search ? 'No pipelines match your search' : 'No pipeline runs found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
