import React, { useState } from 'react';
import PlayerStats from './PlayerStats';
import Leaderboard from './Leaderboard';
import DevelopmentPlan from './DevelopmentPlan';
import RecruitmentPlanner from './RecruitmentPlanner';
import CollegeSearch from './CollegeSearch';
import { players, drills } from '../data';
import type { Player } from '../types';

const AthleteDashboard: React.FC = () => {
  const [activePlayer] = useState<Player>(players[0]);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Player Overview' },
    { id: 'development', label: 'AI Development' },
    { id: 'recruiting', label: 'Recruiting' },
    { id: 'colleges', label: 'College Search' },
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
      
      <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PlayerStats player={activePlayer} />
          </div>
          <div>
            <Leaderboard players={players} />
          </div>
        </div>
      </div>

      <div className={activeTab === 'development' ? 'block' : 'hidden'}>
        <DevelopmentPlan player={activePlayer} drills={drills} />
      </div>

      <div className={activeTab === 'recruiting' ? 'block' : 'hidden'}>
         <RecruitmentPlanner player={activePlayer} />
      </div>

      <div className={activeTab === 'colleges' ? 'block' : 'hidden'}>
        <CollegeSearch />
      </div>
      
    </div>
  );
};

export default AthleteDashboard;