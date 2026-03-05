import React, { useState, useMemo } from 'react';
import type { Player, RecruitingTask, SchoolYear } from '../types';
import Card from './shared/Card';

interface RecruitmentPlannerProps {
  player: Player;
}

const yearOrder: SchoolYear[] = ['Freshman', 'Sophomore', 'Junior', 'Senior'];

const RecruitmentPlanner: React.FC<RecruitmentPlannerProps> = ({ player }) => {
  const [tasks, setTasks] = useState<RecruitingTask[]>(player.recruitingTimeline);

  const handleToggleTask = (taskId: string) => {
    setTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === taskId
          ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
          : task
      )
    );
  };
  
  const tasksByYear = useMemo(() => {
    const grouped: Record<SchoolYear, RecruitingTask[]> = {
      'Freshman': [],
      'Sophomore': [],
      'Junior': [],
      'Senior': [],
    };
    tasks.forEach(task => {
        if(grouped[task.year]) {
            grouped[task.year].push(task);
        }
    });
    return grouped;
  }, [tasks]);

  return (
    <div>
        <Card className="mb-8">
            <h3 className="text-xl font-bold text-white mb-2">Recruiting Timeline & Checklist</h3>
            <p className="text-slate-400">Stay on track with your recruiting journey from freshman to senior year.</p>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {yearOrder.map(year => (
                <YearColumn 
                    key={year} 
                    year={year} 
                    tasks={tasksByYear[year]} 
                    onToggleTask={handleToggleTask} 
                />
            ))}
        </div>
    </div>
  );
};

interface YearColumnProps {
    year: SchoolYear;
    tasks: RecruitingTask[];
    onToggleTask: (taskId: string) => void;
}

const YearColumn: React.FC<YearColumnProps> = ({ year, tasks, onToggleTask }) => {
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return (
        <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="font-bold text-lg text-white mb-1">{year} Year</h4>
            <p className="text-sm text-slate-400 mb-4">{completedTasks} of {totalTasks} tasks completed</p>
            
            <div className="w-full bg-slate-700 rounded-full h-2 mb-6">
                <div 
                    className="bg-sky-500 h-2 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <ul className="space-y-3">
                {tasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={onToggleTask} />
                ))}
            </ul>
        </div>
    )
}

interface TaskItemProps {
    task: RecruitingTask;
    onToggle: (taskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle }) => {
    const isCompleted = task.status === 'completed';
    return (
        <li 
            className="p-3 bg-slate-800 rounded-lg cursor-pointer transition-colors hover:bg-slate-700/80"
            onClick={() => onToggle(task.id)}
        >
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 pt-0.5">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${isCompleted ? 'bg-sky-500' : 'bg-slate-600'}`}>
                        {isCompleted && (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                </div>
                <div>
                    <p className={`font-semibold text-sm ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{task.title}</p>
                    <p className={`text-xs mt-1 ${isCompleted ? 'text-slate-500' : 'text-slate-400'}`}>{task.description}</p>
                </div>
            </div>
        </li>
    )
}


export default RecruitmentPlanner;