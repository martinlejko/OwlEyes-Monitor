import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, CircularProgress, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Layout from './components/Layout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const MonitorDetail = lazy(() => import('./pages/MonitorDetail'));
const EditMonitor = lazy(() => import('./pages/EditMonitor'));
const ProjectsPage = lazy(() => import('./pages/Projects'));
const MonitorsPage = lazy(() => import('./pages/Monitors'));
const CreateProject = lazy(() => import('./pages/CreateProject'));
const CreateMonitor = lazy(() => import('./pages/CreateMonitor'));
const LandingPage = lazy(() => import('./pages/LandingPage'));

// Create a QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0,0,0,0.05), 0px 1px 2px rgba(0,0,0,0.05)',
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
          <Suspense
            fallback={
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100vh',
                }}
              >
                <CircularProgress />
              </Box>
            }
          >
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/about" element={<LandingPage />} />

                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/new" element={<CreateProject />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />

                <Route path="/monitors" element={<MonitorsPage />} />
                <Route path="/monitors/new" element={<CreateMonitor />} />
                <Route path="/monitors/:id" element={<MonitorDetail />} />
                <Route path="/monitors/:id/edit" element={<EditMonitor />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Suspense>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
