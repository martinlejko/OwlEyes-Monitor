import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, CircularProgress, Box, Typography } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Layout from './components/Layout'; // Assuming Layout handles Navbar and Footer

// Lazy load page components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const MonitorDetail = lazy(() => import('./pages/MonitorDetail'));
const EditMonitor = lazy(() => import('./pages/EditMonitor'));
const ProjectsPage = lazy(() => import('./pages/Projects'));
const MonitorsPage = lazy(() => import('./pages/Monitors'));
const CreateProject = lazy(() => import('./pages/CreateProject'));
const CreateMonitor = lazy(() => import('./pages/CreateMonitor'));

// Placeholder for new/detail pages that are not yet implemented
const NotImplemented: React.FC<{ title: string }> = ({ title }) => (
  <Box sx={{ textAlign: 'center', mt: 4, p:3 }}>
    <Typography variant="h5" gutterBottom>{title}</Typography>
    <Typography color="text.secondary">This page is currently under construction. Please check back later!</Typography>
  </Box>
);

// Create a QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Create a default theme (user can customize this later if needed)
const theme = createTheme({
  palette: {
    primary: {
      main: '#3c5a72', // Example primary color
    },
    secondary: {
      main: '#e57373', // Example secondary color
    },
    background: {
      default: '#f5f8fa', // Light background for content area
    },
  },
  typography: {
    fontFamily: "'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Common preference for button text
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0,0,0,0.05), 0px 1px 2px rgba(0,0,0,0.05)', // Softer default shadow
        }
      }
    }
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
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
              </Box>
            }
          >
            <Layout> {/* Wrap routes with Layout */}
              <Routes>
                <Route path="/" element={<Dashboard />} />
                
                {/* Project Routes */}
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/new" element={<CreateProject />} />
                <Route path="/projects/:id" element={<ProjectDetail />} /> 
                {/* <Route path="/projects/:id/edit" element={<NotImplemented title="Edit Project Details" />} /> */}

                {/* Monitor Routes */}
                <Route path="/monitors" element={<MonitorsPage />} />
                <Route path="/monitors/new" element={<CreateMonitor />} />
                <Route path="/monitors/:id" element={<MonitorDetail />} />
                <Route path="/monitors/:id/edit" element={<EditMonitor />} />
                
                {/* Redirect for any other path */}
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
