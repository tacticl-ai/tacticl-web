import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { CostByPlaybook } from '../../api/types.ts';

interface CostTableProps {
  data: CostByPlaybook[];
}

export default function CostTable({ data }: CostTableProps) {
  const sorted = [...data].sort((a, b) => b.costUsd - a.costUsd);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography variant="subtitle2" sx={{ mb: 2, color: '#999', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Cost by Playbook
        </Typography>
        <TableContainer sx={{ maxHeight: 280 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: '#1a1a2e' }}>Playbook</TableCell>
                <TableCell align="right" sx={{ backgroundColor: '#1a1a2e' }}>Runs</TableCell>
                <TableCell align="right" sx={{ backgroundColor: '#1a1a2e' }}>Cost</TableCell>
                <TableCell align="right" sx={{ backgroundColor: '#1a1a2e' }}>Avg Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((row) => (
                <TableRow key={row.playbook} hover sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' } }}>
                  <TableCell sx={{ color: '#e0e0e0', fontSize: '0.8rem' }}>{row.playbook}</TableCell>
                  <TableCell align="right" sx={{ color: '#999', fontSize: '0.8rem' }}>{row.runs.toLocaleString()}</TableCell>
                  <TableCell align="right" sx={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 600 }}>
                    ${row.costUsd.toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#999', fontSize: '0.8rem' }}>
                    ${row.runs > 0 ? (row.costUsd / row.runs).toFixed(2) : '0.00'}
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ color: '#666', py: 4 }}>
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
