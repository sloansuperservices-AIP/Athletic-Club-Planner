
import React, { useState, useCallback } from 'react';
import type { Player, Drill, DevelopmentPlan as Plan } from '../types';
import { generateDevelopmentPlan } from '../services/geminiService';
import Card from './shared/Card';

interface DevelopmentPlanProps {
  player: Player;
  drills: Drill[];
}

const DevelopmentPlan: React.FC<DevelopmentPlanProps> = ({ player, drills }) => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePlan = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const generatedPlan = await generateDevelopmentPlan(player, drills);
      setPlan(generatedPlan);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [player, drills]);

  return (
    <Card>
      <h3 className="text-xl font-bold text-white mb-2">AI Development Plan</h3>
      <p className="text-slate-400 mb-6">Get a personalized training plan based on your stats to level up your game.</p>
      
      {!plan && !isLoading && !error && (
        <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-700 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-sky-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
              </svg>
            </div>
            <button 
                onClick={handleGeneratePlan}
                className="bg-sky-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-600 transition-colors duration-200 transform hover:scale-105"
            >
                Generate My Plan
            </button>
        </div>
      )}

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={handleGeneratePlan} />}
      {plan && <PlanDisplay plan={plan} />}
    </Card>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-8 space-y-3">
    <svg className="animate-spin h-8 w-8 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="text-slate-300">Generating your personalized plan...</p>
  </div>
);

const ErrorMessage: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
    <div className="text-center p-8 bg-red-900/20 border border-red-500/30 rounded-lg">
        <h4 className="font-bold text-red-400 mb-2">Oops! Something went wrong.</h4>
        <p className="text-red-400/80 text-sm mb-4">{message}</p>
        <button onClick={onRetry} className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-500 transition-colors">
            Try Again
        </button>
    </div>
);


const PlanDisplay: React.FC<{ plan: Plan }> = ({ plan }) => (
  <div className="space-y-6">
    <div>
        <h4 className="font-bold text-sky-300 mb-3">Focus Areas</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plan.focusAreas.map(area => (
                <div key={area.skill} className="bg-slate-700/50 p-4 rounded-lg">
                    <p className="font-semibold text-white">{area.skill}</p>
                    <p className="text-sm text-slate-400 mt-1">{area.reasoning}</p>
                </div>
            ))}
        </div>
    </div>
    <div>
        <h4 className="font-bold text-sky-300 mb-3">Weekly Schedule</h4>
        <div className="space-y-4">
            {plan.weeklyPlan.map(dayPlan => (
                <div key={dayPlan.day} className="bg-slate-800 p-4 rounded-lg">
                    <p className="font-bold text-white">{dayPlan.day}: <span className="text-sky-400">{dayPlan.focus}</span></p>
                    <ul className="mt-3 list-disc list-inside space-y-2 pl-2 text-slate-300">
                        {dayPlan.drills.map(drill => (
                            <li key={drill.name} className="text-sm">
                                <span className="font-semibold">{drill.name}:</span> {drill.sets} sets of {drill.reps}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    </div>
  </div>
);

export default DevelopmentPlan;
