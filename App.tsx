
import React, { useState } from 'react';
import AthleteDashboard from './components/AthleteDashboard';
import CoachDashboard from './components/CoachDashboard';

// FIX: Export UserRole type to be used in other components.
export type UserRole = 'Athlete' | 'Coach';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>('Athlete');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <Header currentRole={role} setRole={setRole} />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {role === 'Athlete' ? <AthleteDashboard /> : <CoachDashboard />}
      </main>
      <Footer />
    </div>
  );
};

interface HeaderProps {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
}

const Header: React.FC<HeaderProps> = ({ currentRole, setRole }) => {
  const toggleRole = () => {
    setRole(currentRole === 'Athlete' ? 'Coach' : 'Athlete');
  };

  const userName = currentRole === 'Athlete' ? 'Alex' : 'Coach Davis';
  const avatarId = currentRole === 'Athlete' ? '237' : '1005';


  return (
    <header className="bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 19.5v-.75a7.5 7.5 0 0 0-7.5-7.5H4.5m0-6.75h.75c7.87 0 14.25 6.38 14.25 14.25v.75M6 18.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            <h1 className="text-xl font-bold text-white">
              Vision Volleyball <span className="text-sky-400 text-sm font-medium ml-2">{currentRole} View</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleRole}
              title="Switch Role"
              className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1.365l-4.243 4.242a1 1 0 001.414 1.414L10 6.414l3.828 3.828a1 1 0 001.414-1.414L11 4.365V3a1 1 0 00-1-1zM4.172 10.172a1 1 0 00-1.414 1.414L6.586 15l-3.828 3.828a1 1 0 101.414 1.414L10 16.414l4.243 4.242a1 1 0 101.414-1.414L13.414 15l3.828-3.828a1 1 0 10-1.414-1.414L10 13.586 4.172 10.172z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-sm hidden sm:block">Welcome, {userName}!</span>
            <img src={`https://picsum.photos/id/${avatarId}/40/40`} alt="User Avatar" className="w-10 h-10 rounded-full border-2 border-slate-600" />
          </div>
        </div>
      </div>
    </header>
  );
};


const Footer: React.FC = () => (
  <footer className="bg-slate-800/50 mt-12 py-4">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400 text-sm">
      <p>&copy; {new Date().getFullYear()} Vision Volleyball Club. All Rights Reserved.</p>
    </div>
  </footer>
);

export default App;