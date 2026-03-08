
import React, { useState, useMemo } from 'react';
import type { Player } from '../types';
import { Skill } from '../types';
import Card from './shared/Card';
import { HittingIcon, ServingIcon, PassingIcon, BlockingIcon, SettingIcon, DiggingIcon } from './shared/SkillIcons';

interface LeaderboardProps {
  players: Player[];
}

const skillIcons: Record<Skill, React.ReactNode> = {
    [Skill.Hitting]: <HittingIcon />,
    [Skill.Serving]: <ServingIcon />,
    [Skill.Passing]: <PassingIcon />,
    [Skill.Blocking]: <BlockingIcon />,
    [Skill.Setting]: <SettingIcon />,
    [Skill.Digging]: <DiggingIcon />,
}

const Leaderboard: React.FC<LeaderboardProps> = ({ players }) => {
  const [selectedSkill, setSelectedSkill] = useState<Skill>(Skill.Hitting);

  const sortedPlayers = useMemo(() => {
    return [...players]
      .map(player => {
        const stat = player.stats.find(s => s.skill === selectedSkill);
        return {
          ...player,
          value: stat ? stat.value : 0,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [players, selectedSkill]);
  
  const skills = Object.values(Skill);

  return (
    <Card>
      <h3 className="text-xl font-bold text-white mb-4">Leaderboards</h3>
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {skills.map(skill => (
            <button
              key={skill}
              onClick={() => setSelectedSkill(skill)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 ${
                selectedSkill === skill
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>
      
      <ul className="space-y-3">
        {sortedPlayers.map((player, index) => (
          <li key={player.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
            <div className="flex items-center space-x-3">
              <span className={`w-6 text-center font-bold text-slate-400 ${index < 3 ? 'text-sky-300' : ''}`}>{index + 1}</span>
              <img src={player.avatarUrl} alt={player.name} className="w-9 h-9 rounded-full" />
              <div>
                <p className="font-semibold text-slate-200 text-sm">{player.name}</p>
                <p className="text-slate-400 text-xs">{player.team}</p>
              </div>
            </div>
             <div className="flex items-center space-x-2 bg-slate-700 px-2 py-1 rounded-md">
                {skillIcons[selectedSkill]}
                <span className="font-bold text-sky-400 text-sm">{player.value}</span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default Leaderboard;
