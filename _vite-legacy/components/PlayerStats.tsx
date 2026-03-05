import React from 'react';
import type { Player } from '../types';
import Card from './shared/Card';

interface PlayerStatsProps {
  player: Player;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ player }) => {
  const chartData = player.stats.map(stat => ({
    name: stat.skill,
    value: stat.value,
  })).sort((a,b) => b.value - a.value);

  return (
    <Card>
      <div className="flex flex-col sm:flex-row items-start sm:space-x-6 mb-6">
        <img src={player.avatarUrl} alt={player.name} className="w-24 h-24 rounded-full border-4 border-slate-700 mb-4 sm:mb-0" />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold text-white">{player.name}</h3>
              <p className="text-sky-400">{player.position} | {player.team}</p>
              <p className="text-slate-400 text-sm">Grad Year: {player.gradYear}</p>
            </div>
            <a 
              href={player.profileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-slate-700 text-sky-300 text-xs font-bold py-1.5 px-3 rounded-full hover:bg-slate-600 transition-colors flex items-center space-x-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
              <span>Public Profile</span>
            </a>
          </div>
          
          <div className="mt-4 border-t border-slate-700 pt-3">
             <h4 className="text-sm font-semibold text-slate-300 mb-2">Recruiting Info</h4>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                <InfoItem label="GPA" value={player.gpa.toFixed(1)} />
                {player.satScore && <InfoItem label="SAT" value={player.satScore} />}
                {player.actScore && <InfoItem label="ACT" value={player.actScore} />}
                {player.honors && <InfoItem label="Honors" value={player.honors} className="col-span-2 sm:col-span-3" />}
             </div>
          </div>
        </div>
      </div>
      
      <h4 className="text-lg font-semibold text-white mb-4">Skill Performance</h4>
      <div className="w-full space-y-3">
        {chartData.map((stat, index) => (
            <div 
                key={stat.name} 
                className="grid grid-cols-[100px_1fr] items-center gap-x-4 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
            >
                <span className="text-sm font-medium text-slate-300 truncate text-right">{stat.name}</span>
                <div className="w-full bg-slate-700 rounded-full h-5 overflow-hidden">
                    <div 
                        className="bg-sky-500 h-5 rounded-full text-xs font-bold text-white flex items-center justify-end px-2 transition-all duration-500 ease-out"
                        style={{ width: `${stat.value}%` }}
                    >
                        <span className="drop-shadow-sm">{stat.value}</span>
                    </div>
                </div>
            </div>
        ))}
    </div>
    </Card>
  );
};

const InfoItem: React.FC<{label: string, value: string | number, className?: string}> = ({ label, value, className }) => (
    <div className={className}>
        <span className="font-semibold text-slate-400">{label}: </span>
        <span className="text-slate-200">{value}</span>
    </div>
);


export default PlayerStats;