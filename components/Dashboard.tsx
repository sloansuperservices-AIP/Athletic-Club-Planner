import React from 'react';
import AthleteDashboard from './AthleteDashboard';
import CoachDashboard from './CoachDashboard';
import type { UserRole } from '../App'; // Assuming UserRole is exported from App

interface DashboardProps {
  role: UserRole;
}

const Dashboard: React.FC<DashboardProps> = ({ role }) => {
  return role === 'Athlete' ? <AthleteDashboard /> : <CoachDashboard />;
};

export default Dashboard;
