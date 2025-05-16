import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  LinearProgress,
} from '@mui/material';
import { format } from 'date-fns';
import { MonitorStatus } from '../../types';

interface ListViewProps {
  statuses: MonitorStatus[];
  totalCount: number;
  page: number;
  rowsPerPage: number;
  loading?: boolean;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * List view for monitor status history
 * Shows tabular data with pagination
 */
export const ListView: React.FC<ListViewProps> = ({
  statuses,
  totalCount,
  page,
  rowsPerPage,
  loading = false,
  onPageChange,
  onRowsPerPageChange,
}) => {
  return (
    <Box>
      {loading && <LinearProgress />}

      {statuses.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No status history found for this monitor with the current filters.
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Response Time (ms)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statuses.map((status) => (
                  <TableRow key={status.id}>
                    <TableCell>{format(new Date(status.startTime), 'yyyy-MM-dd')}</TableCell>
                    <TableCell>{format(new Date(status.startTime), 'HH:mm:ss')}</TableCell>
                    <TableCell>
                      <Chip
                        label={status.status ? 'UP' : 'DOWN'}
                        size="small"
                        color={status.status ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell align="right">{status.responseTime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
          />
        </>
      )}
    </Box>
  );
};
