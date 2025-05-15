import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  SelectChangeEvent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  QueryStats as QueryStatsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  FilterAlt as FilterIcon,
  CalendarMonth as CalendarIcon,
  List as ListIcon,
  ShowChart as ChartIcon
} from '@mui/icons-material';
import { format, addMonths, startOfMonth, endOfMonth, parseISO, subMonths } from 'date-fns';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { getMonitor, getMonitorStatuses, deleteMonitor } from '../services/api';
import { Monitor, MonitorStatus, PaginatedResponse, CalendarDataPoint, GraphDataPoint } from '../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`monitor-tabpanel-${index}`}
      aria-labelledby={`monitor-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const CalendarView = ({ data, onRefresh }: { data: CalendarDataPoint[], onRefresh: () => void }) => {
  const getMonthData = (month: Date) => {
    const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(month), 'yyyy-MM-dd');
    
    return data.filter(point => 
      point.date >= startDate && point.date <= endDate
    );
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
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: 1 
        }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Box key={day} sx={{ textAlign: 'center', fontWeight: 'bold' }}>
              {day}
            </Box>
          ))}
          
          {Array.from({ length: new Date(month.getFullYear(), month.getMonth(), 1).getDay() }, (_, i) => (
            <Box key={`empty-${i}`} />
          ))}
          
          {Array.from(
            { length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() }, 
            (_, i) => {
              const day = i + 1;
              const dateStr = format(new Date(month.getFullYear(), month.getMonth(), day), 'yyyy-MM-dd');
              const dayData = monthData.find(d => d.date === dateStr);
              
              let bgColor = '#eeeeee'; // Default gray for no data
              let statusText = 'No data';
              
              if (dayData) {
                if (dayData.status === 'success') {
                  bgColor = '#4caf50'; // Green for success
                  statusText = '100% uptime';
                } else if (dayData.status === 'warning') {
                  bgColor = '#ff9800'; // Orange for warning (≤ 5% failures)
                  statusText = `${(dayData.failed / dayData.total * 100).toFixed(1)}% failures`;
                } else if (dayData.status === 'danger') {
                  bgColor = '#f44336'; // Red for danger (> 5% failures)
                  statusText = `${(dayData.failed / dayData.total * 100).toFixed(1)}% failures`;
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
                      }
                    }}
                  >
                    {day}
                  </Box>
                </Tooltip>
              );
            }
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
        >
          Refresh
        </Button>
      </Box>
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
    </Box>
  );
};

const GraphView = ({ data, onRefresh }: { data: GraphDataPoint[], onRefresh: () => void }) => {
  const chartData = {
    labels: data.map(point => format(parseISO(point.time), 'HH:mm:ss')),
    datasets: [
      {
        label: 'Response Time (ms)',
        data: data.map(point => point.responseTime),
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
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={onRefresh}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ height: 400 }}>
          {data.length > 0 ? (
            <Line data={chartData} options={options} />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography color="text.secondary">No graph data available</Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

const MonitorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // States for monitor data and loading
  const [monitor, setMonitor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // States for status list view
  const [statuses, setStatuses] = useState<MonitorStatus[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalStatusCount, setTotalStatusCount] = useState(0);
  
  // States for calendar view
  const [calendarData, setCalendarData] = useState<CalendarDataPoint[]>([]);
  
  // States for graph view
  const [graphData, setGraphData] = useState<GraphDataPoint[]>([]);
  
  // States for tab navigation
  const [tabValue, setTabValue] = useState(0);
  
  // States for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // States for status filtering
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // Ref for auto-update interval
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMonitor = async () => {
    try {
      if (!id) return;
      
      const monitorData = await getMonitor(parseInt(id));
      setMonitor(monitorData);
      
    } catch (err: any) {
      console.error('Error fetching monitor:', err);
      setError(err.message || 'Failed to load monitor details');
    }
  };

  const fetchStatusData = async (viewMode = tabValue) => {
    try {
      if (!id) return;
      
      const monitorId = parseInt(id);
      let from: Date | undefined = undefined;
      let to: Date | undefined = undefined;
      let statusFilterValue: boolean | undefined = undefined;
      
      // Handle filters
      if (dateFrom) {
        from = new Date(dateFrom);
      }
      
      if (dateTo) {
        to = new Date(dateTo);
        // Set time to end of day
        to.setHours(23, 59, 59, 999);
      }
      
      if (statusFilter === 'up') {
        statusFilterValue = true;
      } else if (statusFilter === 'down') {
        statusFilterValue = false;
      }
      
      // Fetch data based on view mode
      if (viewMode === 0) { // List view
        const response = await getMonitorStatuses(
          monitorId, 
          page + 1, 
          rowsPerPage, 
          from, 
          to, 
          statusFilterValue,
          'list'
        );
        
        // Type assertion since we know the structure based on view
        const listResponse = response as PaginatedResponse<MonitorStatus>;
        setStatuses(listResponse.data);
        setTotalStatusCount(listResponse.meta.total);
        
      } else if (viewMode === 1) { // Calendar view
        const response = await getMonitorStatuses(
          monitorId, 
          1, 
          100, 
          subMonths(new Date(), 2), // From 3 months ago
          new Date(), // To today
          statusFilterValue,
          'calendar'
        );
        
        // Type assertion
        const calendarResponse = response as { data: CalendarDataPoint[] };
        setCalendarData(calendarResponse.data);
        
      } else if (viewMode === 2) { // Graph view
        const response = await getMonitorStatuses(
          monitorId, 
          1, 
          100, 
          from || subMonths(new Date(), 1), // Default to 1 month if not specified
          to || new Date(),
          undefined, // Don't filter by status for graph
          'graph'
        );
        
        // Type assertion
        const graphResponse = response as { data: GraphDataPoint[] };
        setGraphData(graphResponse.data);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching status data:', err);
      setError(err.message || 'Failed to load status data');
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    await fetchMonitor();
    await fetchStatusData();
  };

  // Initialize data
  useEffect(() => {
    fetchData();
    
    // Set up live updates
    updateIntervalRef.current = setInterval(() => {
      fetchMonitor();
      fetchStatusData();
    }, 5000); // 5 seconds update interval
    
    return () => {
      // Clean up interval on component unmount
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [id]);
  
  // Fetch data when filters or pagination change
  useEffect(() => {
    fetchStatusData();
  }, [page, rowsPerPage, statusFilter, dateFrom, dateTo, tabValue]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
    setPage(0); // Reset to first page on filter change
  };
  
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === 'dateFrom') {
      setDateFrom(value);
    } else if (name === 'dateTo') {
      setDateTo(value);
    }
    setPage(0); // Reset to first page on filter change
  };
  
  const handleRefresh = () => {
    fetchStatusData();
  };

  const handleEditClick = () => {
    if (id) {
      navigate(`/monitors/${id}/edit`);
    }
  };

  const handleDeleteClick = () => {
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      
      if (id) {
        console.log('Confirming deletion of monitor ID:', id);
        
        const timestamp = new Date().getTime();
        console.log('Using timestamp for cache busting:', timestamp);
        
        await deleteMonitor(parseInt(id));
        console.log('Delete operation completed successfully');
        
        setDeleteDialogOpen(false);
        
        // After successful deletion, navigate back to project or dashboard
        if (monitor?.projectId) {
          const projectId = monitor.projectId;
          console.log('Navigating to project page with cache buster:', `/projects/${projectId}?_=${timestamp}`);
          
          // Use React Router navigation instead of direct location change
          navigate(`/projects/${projectId}?_=${timestamp}`);
        } else {
          console.log('Navigating to dashboard with cache buster');
          navigate(`/?_=${timestamp}`);
        }
      }
    } catch (error: any) {
      console.error('Detailed error object when deleting monitor:', error);
      let displayErrorMessage = 'Failed to delete monitor. Please try again later.';
      if (error.isAxiosError && error.response) {
        // Server responded with an error status code (4xx or 5xx)
        if (error.response.data && typeof error.response.data.error === 'string') {
          displayErrorMessage = error.response.data.error;
        } else {
          // Response data is not in the expected format, or no specific error message from backend
          displayErrorMessage = `Server error: ${error.response.status} ${error.response.statusText || ''}`.trim();
        }
      } else if (error.isAxiosError && error.request) {
        // The request was made but no response was received
        displayErrorMessage = 'No response from server. Check network connection or server status.';
      } else {
        // Something happened in setting up the request that triggered an Error, or a non-Axios error
        displayErrorMessage = error.message || 'An unexpected error occurred.';
      }
      setDeleteError(displayErrorMessage);
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteError(null);
    setDeleteDialogOpen(false);
  };

  const getStatusColor = (status?: boolean): string => {
    if (status === undefined) return '#9e9e9e'; // Gray for unknown
    return status ? '#4caf50' : '#f44336'; // Green for up, red for down
  };

  const getStatusText = (status?: boolean): string => {
    if (status === undefined) return 'UNKNOWN';
    return status ? 'UP' : 'DOWN';
  };

  const getMonitorTypeDetails = () => {
    if (!monitor) return null;
    
    if (monitor.type === 'ping') {
      const pingMonitor = monitor as any; // Using any as a workaround for type casting
      return (
        <Typography variant="body2" color="text.secondary">
          Host: {pingMonitor.host} 
          {pingMonitor.port && ` : ${pingMonitor.port}`}
        </Typography>
      );
    } else if (monitor.type === 'website') {
      const websiteMonitor = monitor as any; // Using any as a workaround for type casting
      return (
        <Typography variant="body2" color="text.secondary">
          URL: {websiteMonitor.url}
        </Typography>
      );
    }
    
    return null;
  };

  if (loading && !monitor) {
    return (
      <Box>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading monitor details...
        </Typography>
      </Box>
    );
  }

  if (error && !monitor) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)} 
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  if (!monitor) {
    return (
      <Box>
        <Alert severity="warning">Monitor not found</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)} 
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(`/projects/${monitor.projectId}`)}
        >
          Back to Project
        </Button>
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<QueryStatsIcon />}
            onClick={() => navigate(`/monitors/${id}/statistics`)}
            sx={{ mr: 1 }}
          >
            View Statistics
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<EditIcon />}
            onClick={handleEditClick}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}
          >
            Delete
          </Button>
        </Box>
      </Box>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start'
          }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                {monitor.label}
              </Typography>
              <Chip 
                label={monitor.type.toUpperCase()} 
                color={monitor.type === 'ping' ? 'info' : 'secondary'} 
                sx={{ mb: 1 }}
              />
              {getMonitorTypeDetails()}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Check interval: {monitor.periodicity} seconds
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Badge label: {monitor.badgeLabel}
              </Typography>
            </Box>
            <Box>
              <Chip 
                label={getStatusText(monitor.latestStatus?.status)} 
                color={monitor.latestStatus?.status ? 'success' : 'error'} 
                sx={{ fontWeight: 'bold', fontSize: '1.1rem', px: 2, py: 2.5 }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Monitor History
        </Typography>
        
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="monitor views"
              variant="fullWidth"
            >
              <Tab 
                icon={<ListIcon />} 
                label="List View" 
                id="monitor-tab-0" 
                aria-controls="monitor-tabpanel-0" 
              />
              <Tab 
                icon={<CalendarIcon />} 
                label="Calendar View" 
                id="monitor-tab-1" 
                aria-controls="monitor-tabpanel-1" 
              />
              <Tab 
                icon={<ChartIcon />} 
                label="Graph View" 
                id="monitor-tab-2" 
                aria-controls="monitor-tabpanel-2" 
              />
            </Tabs>
          </Box>
          
          {/* Filters */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle2">
                  <FilterIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Filters:
                </Typography>
              </Box>
              
              <Box sx={{ flex: { xs: '1 0 100%', sm: '1 0 220px' } }}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    id="status-filter"
                    value={statusFilter}
                    label="Status"
                    onChange={handleStatusFilterChange}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="up">Up Only</MenuItem>
                    <MenuItem value="down">Down Only</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ flex: { xs: '1 0 100%', sm: '1 0 220px' } }}>
                <TextField
                  name="dateFrom"
                  label="From Date"
                  type="date"
                  value={dateFrom}
                  onChange={handleDateChange}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  fullWidth
                />
              </Box>
              
              <Box sx={{ flex: { xs: '1 0 100%', sm: '1 0 220px' } }}>
                <TextField
                  name="dateTo"
                  label="To Date"
                  type="date"
                  value={dateTo}
                  onChange={handleDateChange}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  fullWidth
                />
              </Box>
              
              <Box>
                <Button 
                  startIcon={<RefreshIcon />} 
                  onClick={handleRefresh}
                  variant="outlined"
                  size="small"
                >
                  Refresh
                </Button>
              </Box>
            </Box>
          </Box>
          
          {/* List View */}
          <TabPanel value={tabValue} index={0}>
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
                          <TableCell>
                            {format(new Date(status.startTime), 'yyyy-MM-dd')}
                          </TableCell>
                          <TableCell>
                            {format(new Date(status.startTime), 'HH:mm:ss')}
                          </TableCell>
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
                  count={totalStatusCount}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </TabPanel>
          
          {/* Calendar View */}
          <TabPanel value={tabValue} index={1}>
            {loading && <LinearProgress />}
            <CalendarView 
              data={calendarData} 
              onRefresh={handleRefresh} 
            />
          </TabPanel>
          
          {/* Graph View */}
          <TabPanel value={tabValue} index={2}>
            {loading && <LinearProgress />}
            <GraphView 
              data={graphData} 
              onRefresh={handleRefresh} 
            />
          </TabPanel>
        </Paper>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Badge
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography variant="body1" gutterBottom>
            Use this badge in your README or website to show the current status of this monitor:
          </Typography>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', overflowX: 'auto' }}>
              {`![${monitor.badgeLabel} Status](http://localhost:8000/badge/${monitor.id})`}
            </Typography>
          </Box>
          
          <Box sx={{ mt: 2, p: 1, display: 'flex', justifyContent: 'center' }}>
            <img 
              src={`http://localhost:8000/badge/${monitor.id}`} 
              alt={`${monitor.badgeLabel} Status`}
            />
          </Box>
        </Paper>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete Monitor"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this monitor? This action cannot be undone.
            All status history for this monitor will also be deleted.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            autoFocus
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MonitorDetail; 