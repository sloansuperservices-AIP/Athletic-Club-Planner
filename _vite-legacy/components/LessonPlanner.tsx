import React, { useState, useCallback } from 'react';
import Card from './shared/Card';
import { generateMonthlyLessonPlan } from '../services/geminiService';
import type { Drill, MonthlyPlan, DailyLesson } from '../types';
import LessonPlanModal from './LessonPlanModal';

interface LessonPlannerProps {
    drills: Drill[];
}

const LessonPlanner: React.FC<LessonPlannerProps> = ({ drills }) => {
    const [plan, setPlan] = useState<MonthlyPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<DailyLesson | null>(null);

    const handleGeneratePlan = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const generatedPlan = await generateMonthlyLessonPlan(drills);
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
    }, [drills]);

    return (
        <Card>
            <h3 className="text-xl font-bold text-white mb-2">AI-Powered Lesson Planner</h3>
            <p className="text-slate-400 mb-6">Generate a comprehensive, 30-day training calendar for your team.</p>

            {!plan && !isLoading && (
                <div className="text-center py-8">
                    <button
                        onClick={handleGeneratePlan}
                        className="bg-sky-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-600 transition-colors duration-200 transform hover:scale-105"
                    >
                        Generate 1-Month Plan
                    </button>
                </div>
            )}

            {isLoading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} onRetry={handleGeneratePlan} />}

            {plan && (
                <div className="space-y-3">
                    {plan.map(lesson => (
                        <div key={lesson.day} onClick={() => setSelectedLesson(lesson)} className="flex items-center space-x-4 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700/80 transition-colors">
                            <div className="flex-shrink-0 w-12 h-12 bg-slate-700 rounded-lg flex flex-col items-center justify-center">
                                <span className="text-xs text-slate-400">DAY</span>
                                <span className="text-xl font-bold text-white">{lesson.day}</span>
                            </div>
                            <div>
                                <p className="font-semibold text-sky-400">{lesson.focus}</p>
                                <p className="text-sm text-slate-300">{lesson.drills.map(d => d.name).join(' • ')}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {selectedLesson && (
                <LessonPlanModal lesson={selectedLesson} onClose={() => setSelectedLesson(null)} />
            )}
        </Card>
    );
};


const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
        <svg className="animate-spin h-8 w-8 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-slate-300">Generating your monthly lesson plan... this may take a moment.</p>
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


export default LessonPlanner;