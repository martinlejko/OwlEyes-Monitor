import React from 'react';
import { 
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  SelectChangeEvent,
  Stack,
  CircularProgress
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  FilterAlt as FilterIcon,
  RestartAlt as ResetIcon
} from '@mui/icons-material';

interface FilterBarProps {
  statusFilter: string;
  dateFrom: string;
  dateTo: string;
  onStatusFilterChange: (event: SelectChangeEvent) => void;
  onDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRefresh: () => void;
  onResetFilters?: () => void;
  isRefreshing?: boolean;
}

/**
 * Filter bar for monitor history
 * Provides controls for filtering status data
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  statusFilter,
  dateFrom,
  dateTo,
  onStatusFilterChange,
  onDateChange,
  onRefresh,
  onResetFilters,
  isRefreshing = false
}) => {
  return (
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
              onChange={onStatusFilterChange}
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
            onChange={onDateChange}
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
            onChange={onDateChange}
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
          />
        </Box>
        
        <Box>
          <Stack direction="row" spacing={1}>
            <Button 
              startIcon={isRefreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              onClick={onRefresh}
              variant="outlined"
              size="small"
              color="primary"
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            
            <Button 
              startIcon={<ResetIcon />} 
              onClick={onResetFilters}
              variant="outlined"
              size="small"
              color="secondary"
              disabled={!onResetFilters || (statusFilter === 'all' && !dateFrom && !dateTo) || isRefreshing}
            >
              Reset
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}; 