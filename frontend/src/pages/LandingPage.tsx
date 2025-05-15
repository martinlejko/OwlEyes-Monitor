import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Link,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Stack
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import ArticleIcon from '@mui/icons-material/Article';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Project Management",
      description: "Organize your monitoring into logical projects with tags for easy filtering.",
      icon: <ArticleIcon fontSize="large" color="primary" />
    },
    {
      title: "Multiple Monitor Types",
      description: "Monitor websites, APIs, and services with various monitor types including ping and HTTP checks.",
      icon: <MonitorHeartIcon fontSize="large" color="primary" />
    },
    {
      title: "Visualization & Alerts",
      description: "View uptime statistics, response time graphs, and receive alerts when things go wrong.",
      icon: <SettingsSuggestIcon fontSize="large" color="primary" />
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" component="h1" gutterBottom>
            <span role="img" aria-label="owl">🦉</span> OwlEyes Monitor
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            A comprehensive, open-source monitoring solution for your websites and services
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mt: 4 }}
          >
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => navigate('/')}
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              startIcon={<GitHubIcon />}
              component={Link}
              href="https://github.com/martinlejko/OwlEyes-Monitor"
              target="_blank"
            >
              View on GitHub
            </Button>
          </Stack>
        </Box>

        <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
          <Typography variant="h4" gutterBottom>
            About the Project
          </Typography>
          <Typography variant="body1" paragraph>
            OwlEyes Monitor is a powerful monitoring solution designed to help you keep track of your websites, APIs, and services.
            With its intuitive interface and robust feature set, you can easily set up monitoring for all your critical systems and get
            notified when something goes wrong.
          </Typography>
          <Typography variant="body1">
            This project is maintained as an open-source initiative and welcomes contributions from the community.
            Whether you're looking to monitor a personal project or need a solution for your organization, OwlEyes has you covered.
          </Typography>
        </Paper>

        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Key Features
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 6 }}>
          {features.map((feature, index) => (
            <Box key={index} sx={{ flex: { xs: '1 0 100%', md: '1 0 30%' } }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom align="center">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>

        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Getting Started
          </Typography>
          <Typography variant="body1" paragraph>
            To get started with OwlEyes Monitor, you can:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: { xs: '1 0 100%', md: '1 0 calc(50% - 8px)' } }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Create a Project
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start by creating a project to organize your monitors. Add meaningful tags to filter them later.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate('/projects/new')}>
                    Create Project
                  </Button>
                </CardActions>
              </Card>
            </Box>
            <Box sx={{ flex: { xs: '1 0 100%', md: '1 0 calc(50% - 8px)' } }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Add Monitors
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add monitors to track your websites, APIs, and services. Configure alerts to know when things go wrong.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate('/monitors/new')}>
                    Create Monitor
                  </Button>
                </CardActions>
              </Card>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="body2" color="text.secondary">
            OwlEyes Monitor - Open Source Monitoring Solution
          </Typography>
          <Link 
            href="https://github.com/martinlejko/OwlEyes-Monitor" 
            target="_blank" 
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}
          >
            <GitHubIcon fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="body2">
              GitHub Repository
            </Typography>
          </Link>
        </Box>
      </Box>
    </Container>
  );
};

export default LandingPage; 