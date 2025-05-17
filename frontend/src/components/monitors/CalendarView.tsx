import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Tooltip, CircularProgress } from '@mui/material';
import { RefreshOutlined as RefreshIcon } from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { CalendarDataPoint } from '../../types';
import { getMonitorStatuses } from '../../services/api';

interface CalendarViewProps {
  data: CalendarDataPoint[];
  onRefresh: () => void;
  loading?: boolean;
  monitorId?: number;
}

/**
 * Calendar view for monitoring history
 * Shows 3 months of data with color-coded days based on uptime/downtime
 */
export const CalendarView: React.FC<CalendarViewProps> = ({
  data,
  onRefresh,
  loading,
  monitorId,
}) => {
  const [localData, setLocalData] = useState<CalendarDataPoint[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalendarData = async () => {
      if ((data.length === 0 || error) && monitorId) {
        setLocalLoading(true);
        setError(null);

        try {
          const today = new Date();
          const lastYear = new Date(today);
          lastYear.setFullYear(lastYear.getFullYear() - 1);

          const response = await getMonitorStatuses(
            monitorId,
            1,
            1000,
            lastYear, 
            today,
            undefined,
            'calendar',
          );

          const calendarResponse = response as { data: CalendarDataPoint[] };

          if (Array.isArray(calendarResponse.data)) {
            setLocalData(calendarResponse.data);

            if (calendarResponse.data.length === 0) {
              setError('No data found for the last year. Try adjusting the date filters.');
            }
          } else {
            setError('Received unexpected data format from server');
          }
        } catch (error: any) {
          let errorMessage = 'Failed to load calendar data.';

          if (error.response?.status === 500) {
            errorMessage = 'Server error processing calendar data. The error has been logged.';
          } else if (error.message) {
            errorMessage = error.message;
          }

          setError(errorMessage);
        } finally {
          setLocalLoading(false);
        }
      }
    };

    fetchCalendarData();
  }, [data.length, monitorId, error]);

  const displayData = localData.length > 0 ? localData : data;
  const isLoading = loading || localLoading;

  const getMonthData = (month: Date) => {
    const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(month), 'yyyy-MM-dd');

    const filteredData = displayData.filter(
      (point) => point.date >= startDate && point.date <= endDate,
    );

    return filteredData;
  };

  const today = new Date();
  const currentMonth = startOfMonth(today);
  const prevMonth = startOfMonth(subMonths(today, 1));
  const prevPrevMonth = startOfMonth(subMonths(today, 2));

  const renderMonth = (month: Date) => {
    const monthName = format(month, 'MMMM yyyy');
    const monthData = getMonthData(month);

    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {monthName}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 1,
          }}
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Box key={day} sx={{ textAlign: 'center', fontWeight: 'bold' }}>
              {day}
            </Box>
          ))}

          {Array.from(
            { length: new Date(month.getFullYear(), month.getMonth(), 1).getDay() },
            (_, i) => (
              <Box key={`empty-${i}`} />
            ),
          )}

          {Array.from(
            { length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() },
            (_, i) => {
              const day = i + 1;
              const dateStr = format(
                new Date(month.getFullYear(), month.getMonth(), day),
                'yyyy-MM-dd',
              );
              const dayData = monthData.find((d) => d.date === dateStr);

              let bgColor = '#eeeeee';
              let statusText = 'No data';

              if (dayData) {
                if (dayData.total === 0) {
                  bgColor = '#eeeeee';
                  statusText = 'No data';
                } else if (dayData.status === 'success') {
                  bgColor = '#4caf50';
                  statusText = '100% uptime';
                } else if (dayData.status === 'warning') {
                  bgColor = '#ff9800';
                  statusText = `${((dayData.failed / dayData.total) * 100).toFixed(1)}% failures`;
                } else if (dayData.status === 'danger') {
                  bgColor = '#f44336';
                  statusText = `${((dayData.failed / dayData.total) * 100).toFixed(1)}% failures`;
                }
              }

              return (
                <Tooltip key={day} title={statusText}>
                  <Box
                    sx={{
                      height: '2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: bgColor,
                      borderRadius: 1,
                      color: dayData ? 'white' : 'text.secondary',
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                  >
                    {day}
                  </Box>
                </Tooltip>
              );
            },
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Calendar View</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          variant="outlined"
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && !isLoading && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
          <Typography variant="body2" mt={1}>
            Try refreshing the page or checking the server logs for more details.
          </Typography>
        </Paper>
      )}

      {!isLoading && !error && displayData.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No data available for the selected date range.
          </Typography>
        </Paper>
      )}

      {!isLoading && displayData.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" paragraph>
            Each day is color-coded based on the monitor's performance:
            <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#4caf50', borderRadius: 1, mr: 1 }} />
                <Typography variant="body2">100% Up</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#ff9800', borderRadius: 1, mr: 1 }} />
                <Typography variant="body2">≤ 5% Failures</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#f44336', borderRadius: 1, mr: 1 }} />
                <Typography variant="body2">{`> 5% Failures`}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#eeeeee', borderRadius: 1, mr: 1 }} />
                <Typography variant="body2">No Data</Typography>
              </Box>
            </Box>
          </Typography>

          {renderMonth(currentMonth)}
          {renderMonth(prevMonth)}
          {renderMonth(prevPrevMonth)}
        </Paper>
      )}
    </Box>
  );
};
