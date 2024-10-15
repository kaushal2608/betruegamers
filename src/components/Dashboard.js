// app/components/Dashboard.js
'use client';

import { Box, Grid, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import EmailIcon from '@mui/icons-material/Email';
import axios from 'axios';
import { useEffect, useState } from 'react';
import styles from '../styles/Dashboard.module.scss';

const Dashboard = () => {
  // Sample data for the chart
  const data = {
    labels: ['Total Applicants', 'Not Reviewed'],
    datasets: [
      {
        data: [1500, 500],
        backgroundColor: ['#6366F1', '#CBD5E0'],
      },
    ],
  };

  // Fetching candidates from an API
  const [candidates, setCandidates] = useState([
    {name:"kaushal", job:"kjban", rating:"hjfuvh", date:"678"}
  ]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const response = await axios.get('/api/candidates');
  //       setCandidates(response.data);
  //     } catch (error) {
  //       console.error('Error fetching candidates:', error);
  //     }
  //   };
  //   fetchData();
  // }, []);

  return (
    <Box className={styles.dashboardContainer}>
      <Grid container spacing={2}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper className={styles.welcome}>
            <Typography variant="h4">Welcome back, Lewis</Typography>
            <Typography variant="body1">
              Here’s what's changed in your talent hunt journey!
            </Typography>
          </Paper>
        </Grid>

        {/* Job Stats */}
        <Grid item xs={12} md={4}>
          <Paper className={styles.statsCard}>
            <Typography>Total Jobs</Typography>
            <Typography variant="h3">15</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper className={styles.statsCard}>
            <Typography>Applicants</Typography>
            <Typography variant="h3">1500</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper className={styles.statsCard}>
            <Typography>AI Credits</Typography>
            <Typography variant="h3">20,000</Typography>
          </Paper>
        </Grid>

        {/* Doughnut Chart */}
        {/* <Grid item xs={12} md={6}>
          <Paper className={styles.chartCard}>
            <Doughnut data={data} />
          </Paper>
        </Grid> */}

        {/* Latest Candidates */}
        <Grid item xs={12}>
          <Paper className={styles.tableCard}>
            <Typography variant="h6">Latest Candidates</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Candidate Name</TableCell>
                    <TableCell>Job Name</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Applied Date</TableCell>
                    <TableCell>Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidates.map((candidate, index) => (
                    <TableRow key={index}>
                      <TableCell>{candidate.name}</TableCell>
                      <TableCell>{candidate.job}</TableCell>
                      <TableCell>{candidate.rating}</TableCell>
                      <TableCell>{candidate.date}</TableCell>
                      <TableCell>
                        <a href={`mailto:${candidate.email}`}>
                          <EmailIcon className={styles.icon} /> {candidate.email}
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
