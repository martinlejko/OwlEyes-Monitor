import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import MonitorDetail from './pages/MonitorDetail';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3c5a72',
    },
    secondary: {
      main: '#e57373',
    },
    background: {
      default: '#f5f8fa',
    },
  },
  typography: {
    fontFamily: "'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<div>Projects Page (To be implemented)</div>} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/monitors" element={<div>Monitors Page (To be implemented)</div>} />
              <Route path="/monitors/:id" element={<MonitorDetail />} />
              <Route path="*" element={<div>404 Not Found</div>} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
