import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { RefreshOutlined as RefreshIcon } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { GraphDataPoint } from '../../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
);

interface GraphViewProps {
  data: GraphDataPoint[];
  onRefresh: () => void;
  loading?: boolean;
}

/**
 * Graph view for monitor response times
 * Shows response time history in a line chart
 */
export const GraphView: React.FC<GraphViewProps> = ({ data, onRefresh, loading }) => {
  const chartData = {
    labels: data.map((point) => format(parseISO(point.time), 'HH:mm:ss')),
    datasets: [
      {
        label: 'Response Time (ms)',
        data: data.map((point) => point.responseTime),
        borderColor: '#3c5a72',
        backgroundColor: 'rgba(60, 90, 114, 0.1)',
        fill: true,
        tension: 0.2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Response Time History',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Response Time (ms)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
    },
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Response Time Graph</Typography>
        <Button startIcon={<RefreshIcon />} onClick={onRefresh} variant="outlined">
          Refresh
        </Button>
      </Box>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ height: 400 }}>
          {data.length > 0 ? (
            <Line data={chartData} options={options} />
          ) : (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <Typography color="text.secondary">No graph data available</Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};
