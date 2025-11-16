export enum Skill {
  Hitting = 'Hitting',
  Serving = 'Serving',
  Passing = 'Passing',
  Blocking = 'Blocking',
  Setting = 'Setting',
  Digging = 'Digging',
}

export interface Stat {
  skill: Skill;
  value: number;
}

export type SchoolYear = 'Freshman' | 'Sophomore' | 'Junior' | 'Senior';

export interface RecruitingTask {
  id: string;
  year: SchoolYear;
  title: string;
  description: string;
  status: 'completed' | 'pending';
}

export interface Player {
  id: number;
  name: string;
  avatarUrl: string;
  position: string;
  team: string;
  gradYear: number;
  profileUrl: string;
  gpa: number;
  satScore?: number;
  actScore?: number;
  honors?: string;
  stats: Stat[];
  recruitingTimeline: RecruitingTask[];
}

export interface Drill {
  id: number;
  name: string;
  description: string;
  skill: Skill;
}

export interface FocusArea {
    skill: string;
    reasoning: string;
}

export interface DailyDrill {
    name: string;
    sets: number;
    reps: string;
}

export interface DailyPlan {
    day: string;
    focus: string;
    drills: DailyDrill[];
}

export interface DevelopmentPlan {
    focusAreas: FocusArea[];
    weeklyPlan: DailyPlan[];
}

// For Coach Lesson Planner
export interface DailyLessonDrill {
    name: string;
    description: string;
}

export interface DailyLesson {
    day: number;
    focus: string;
    drills: DailyLessonDrill[];
}

export type MonthlyPlan = DailyLesson[];