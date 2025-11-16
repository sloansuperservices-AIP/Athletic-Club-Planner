import React from 'react';
import type { DailyLesson } from '../types';

interface LessonPlanModalProps {
  lesson: DailyLesson;
  onClose: () => void;
}

const LessonPlanModal: React.FC<LessonPlanModalProps> = ({ lesson, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col no-print">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">Lesson Plan: Day {lesson.day}</h3>
          <div className="flex items-center space-x-2">
             <button onClick={handlePrint} className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
            </button>
            <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto printable-area">
          <PrintableLessonPlan lesson={lesson} />
        </div>
      </div>
       {/* Hidden printable version */}
      <div className="hidden print-only">
        <PrintableLessonPlan lesson={lesson} />
      </div>
    </div>
  );
};


const PrintableLessonPlan: React.FC<{ lesson: DailyLesson }> = ({ lesson }) => (
    <div>
        <div className="text-center mb-6">
            <h1 className="text-2xl font-bold print-text-black">Vision Volleyball - Practice Plan</h1>
            <h2 className="text-xl text-slate-400 print-text-black">Day {lesson.day}</h2>
        </div>

        <div className="bg-sky-100/10 p-4 rounded-lg mb-6 border border-sky-500/30">
            <h3 className="text-sm font-semibold uppercase text-sky-400 print-text-black">Primary Focus</h3>
            <p className="text-lg font-bold text-white print-text-black">{lesson.focus}</p>
        </div>

        <div>
            <h3 className="text-sm font-semibold uppercase text-sky-400 mb-3 print-text-black">Drills & Activities</h3>
            <div className="space-y-4">
                {lesson.drills.map((drill, index) => (
                    <div key={index} className="pb-4 border-b border-slate-700 last:border-b-0">
                        <p className="font-bold text-white print-text-black">{index + 1}. {drill.name}</p>
                        <p className="text-slate-300 ml-5 mt-1 text-sm print-text-black">{drill.description}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default LessonPlanModal;