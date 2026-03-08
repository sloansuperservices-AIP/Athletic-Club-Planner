import React, { useState } from 'react';
import { players, drills } from '../data';
import LessonPlanner from './LessonPlanner';

const CoachDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('roster');
  const [filter, setFilter] = useState('all'); // 'all', 'mine', '17U Gold', '16U Blue', '18U Gold'
  
  const teams = [...new Set(players.map(p => p.team))];
  
  const filteredPlayers = players.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'mine') return [1, 3].includes(p.id); // Simulated "my players"
    return p.team === filter;
  });

  const tabs = [
    { id: 'roster', label: 'Roster' },
    { id: 'planner', label: 'Lesson Planner' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <div className="border-b border-slate-700">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-sky-400 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === 'roster' && (
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-6">
             <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All Players</FilterButton>
             <FilterButton active={filter === 'mine'} onClick={() => setFilter('mine')}>My Players</FilterButton>
             <div className="h-4 w-px bg-slate-600 mx-2"></div>
             {teams.map(team => (
                <FilterButton key={team} active={filter === team} onClick={() => setFilter(team)}>{team}</FilterButton>
             ))}
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg">
             <table className="w-full text-left">
                <thead className="border-b border-slate-700 text-xs text-slate-400 uppercase">
                    <tr>
                        <th className="px-6 py-3">Player</th>
                        <th className="px-6 py-3">Position</th>
                        <th className="px-6 py-3">Grad Year</th>
                        <th className="px-6 py-3">Team</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {filteredPlayers.map(player => (
                        <tr key={player.id} className="hover:bg-slate-700/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                    <img src={player.avatarUrl} alt={player.name} className="w-10 h-10 rounded-full" />
                                    <span className="font-medium text-white">{player.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-slate-300">{player.position}</td>
                            <td className="px-6 py-4 text-slate-300">{player.gradYear}</td>
                            <td className="px-6 py-4 text-slate-300">{player.team}</td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
        </div>
      )}
      
      {activeTab === 'planner' && (
        <LessonPlanner drills={drills} />
      )}
    </div>
  );
};

const FilterButton: React.FC<{active: boolean, onClick: () => void, children: React.ReactNode}> = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 ${
        active
          ? 'bg-sky-500 text-white'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
      }`}
    >
      {children}
    </button>
)

export default CoachDashboard;