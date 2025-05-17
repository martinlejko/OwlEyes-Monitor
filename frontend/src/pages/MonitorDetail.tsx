import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, LinearProgress, Alert, Button, Paper, Tab, Tabs } from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  List as ListIcon,
  CalendarMonth as CalendarIcon,
  ShowChart as ChartIcon,
} from '@mui/icons-material';
import { subMonths, startOfMonth } from 'date-fns';
import { getMonitor, getMonitorStatuses, deleteMonitor } from '../services/api';
import {
  Monitor,
  MonitorStatus,
  PaginatedResponse,
  CalendarDataPoint,
  GraphDataPoint,
} from '../types';

import {
  TabPanel,
  ListView,
  CalendarView,
  GraphView,
  MonitorHeader,
  BadgeSection,
  FilterBar,
  DeleteDialog,
} from '../components/monitors';

const MonitorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statuses, setStatuses] = useState<MonitorStatus[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalStatusCount, setTotalStatusCount] = useState(0);

  const [calendarData, setCalendarData] = useState<CalendarDataPoint[]>([]);

  const [graphData, setGraphData] = useState<GraphDataPoint[]>([]);

  const [tabValue, setTabValue] = useState(0);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [refreshing, setRefreshing] = useState(false);

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

      if (viewMode === 0) {
        if (dateFrom) {
          from = new Date(dateFrom);
        }

        if (dateTo) {
          to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
        }

        if (statusFilter === 'up') {
          statusFilterValue = true;
        } else if (statusFilter === 'down') {
          statusFilterValue = false;
        }
      }

      console.log(
        `Fetching data with viewMode: ${viewMode}, statusFilter: ${statusFilter}, dateFrom: ${dateFrom}, dateTo: ${dateTo}, page: ${page}`,
      );

      const currentViewMode = viewMode; 

      if (currentViewMode === 0) {
        const response = await getMonitorStatuses(
          monitorId,
          page + 1,
          rowsPerPage,
          from,
          to,
          statusFilterValue,
          'list',
        );

        const listResponse = response as PaginatedResponse<MonitorStatus>;
        setStatuses(listResponse.data);
        setTotalStatusCount(listResponse.meta.total);
      } else if (currentViewMode === 1) {
        const fromDate = startOfMonth(subMonths(new Date(), 2));
        const toDate = new Date();

        const response = await getMonitorStatuses(
          monitorId,
          1,
          1000, 
          fromDate,
          toDate,
          undefined, 
          'calendar',
        );

        const calendarResponse = response as { data: CalendarDataPoint[] };
        setCalendarData(calendarResponse.data);
      } else if (currentViewMode === 2) {
        const fromDate = subMonths(new Date(), 1);
        const toDate = new Date();

        const response = await getMonitorStatuses(
          monitorId,
          1,
          100,
          fromDate,
          toDate,
          undefined,
          'graph',
        );

        const graphResponse = response as { data: GraphDataPoint[] };
        setGraphData(graphResponse.data);
      }

      setLoading(false);

      console.log('Status data fetch complete with preserved filters:', {
        viewMode: currentViewMode,
        statusFilter,
        dateFrom,
        dateTo,
        page,
      });
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

    const currentTabValue = tabValue;
    console.log('Initial data fetch with preserved filters:', {
      tabValue: currentTabValue,
      statusFilter,
      dateFrom,
      dateTo,
      page,
    });

    await fetchStatusData(currentTabValue);
  };

  useEffect(() => {
    fetchData();

    updateIntervalRef.current = setInterval(() => {
      fetchMonitor();

      const capturedTabValue = tabValue;
      const capturedStatusFilter = statusFilter;
      const capturedDateFrom = dateFrom;
      const capturedDateTo = dateTo;
      const capturedPage = page;
      const capturedRowsPerPage = rowsPerPage;

      console.log('Auto-refresh with preserved filters:', {
        tabValue: capturedTabValue,
        statusFilter: capturedStatusFilter,
        dateFrom: capturedDateFrom,
        dateTo: capturedDateTo,
        page: capturedPage,
      });

      fetchStatusData(capturedTabValue);
    }, 5000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    if (!loading && monitor) {
      console.log('Filter changed, refreshing data with:', {
        tabValue,
        statusFilter,
        dateFrom,
        dateTo,
        page,
      });
      fetchStatusData(tabValue);
    }
  }, [page, rowsPerPage, statusFilter, dateFrom, dateTo, tabValue, monitor]);

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

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === 'dateFrom') {
      setDateFrom(value);
    } else if (name === 'dateTo') {
      setDateTo(value);
    }
    setPage(0);
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    const currentTabValue = tabValue;
    const currentStatusFilter = statusFilter;
    const currentDateFrom = dateFrom;
    const currentDateTo = dateTo;

    console.log('Manual refresh with filters:', {
      tabValue: currentTabValue,
      statusFilter: currentStatusFilter,
      dateFrom: currentDateFrom,
      dateTo: currentDateTo,
    });

    try {
      await fetchStatusData(currentTabValue);
    } catch (error) {
      console.error('Error during manual refresh:', error);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 500);
    }
  };

  const handleResetFilters = async () => {
    console.log('Resetting all filters to default values');

    setRefreshing(true);

    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(0);

    try {
      console.log('Fetching data with reset filters');
      await fetchStatusData(tabValue);
    } catch (error) {
      console.error('Error during filter reset:', error);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 500);
    }
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

        if (monitor?.projectId) {
          const projectId = monitor.projectId;
          console.log(
            'Navigating to project page with cache buster:',
            `/projects/${projectId}?_=${timestamp}`,
          );

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
        if (error.response.data && typeof error.response.data.error === 'string') {
          displayErrorMessage = error.response.data.error;
        } else {
          displayErrorMessage =
            `Server error: ${error.response.status} ${error.response.statusText || ''}`.trim();
        }
      } else if (error.isAxiosError && error.request) {
        displayErrorMessage = 'No response from server. Check network connection or server status.';
      } else {
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

  const handleGoBack = () => {
    if (monitor?.projectId) {
      navigate(`/projects/${monitor.projectId}`);
    } else {
      navigate(-1);
    }
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
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  if (!monitor) {
    return (
      <Box>
        <Alert severity="warning">Monitor not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <MonitorHeader
        monitor={monitor}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onBack={handleGoBack}
      />

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

          {tabValue === 0 && (
            <FilterBar
              statusFilter={statusFilter}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onStatusFilterChange={handleStatusFilterChange}
              onDateChange={handleDateChange}
              onRefresh={handleRefresh}
              onResetFilters={handleResetFilters}
              isRefreshing={refreshing}
            />
          )}

          <TabPanel value={tabValue} index={0}>
            <ListView
              statuses={statuses}
              totalCount={totalStatusCount}
              page={page}
              rowsPerPage={rowsPerPage}
              loading={loading}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <CalendarView
              data={calendarData}
              onRefresh={handleRefresh}
              loading={loading}
              monitorId={monitor.id}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <GraphView data={graphData} onRefresh={handleRefresh} loading={loading} />
          </TabPanel>
        </Paper>
      </Box>

      <BadgeSection monitorId={monitor.id} badgeLabel={monitor.badgeLabel} />

      <DeleteDialog
        open={deleteDialogOpen}
        title="Delete Monitor"
        message="Are you sure you want to delete this monitor? This action cannot be undone. All status history for this monitor will also be deleted."
        error={deleteError}
        isDeleting={isDeleting}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
};

export default MonitorDetail;
