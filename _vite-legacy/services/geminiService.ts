import { GoogleGenAI, Type } from "@google/genai";
import type { Player, Drill, DevelopmentPlan, MonthlyPlan } from '../types';

// Assume API_KEY is set in the environment
if (!process.env.API_KEY) {
  console.warn("API key for Gemini not found. Please set the process.env.API_KEY environment variable. AI features will be disabled.");
}

const generateDevelopmentPlanSchema = {
  type: Type.OBJECT,
  properties: {
    focusAreas: {
      type: Type.ARRAY,
      description: "A list of the player's 3 weakest skills to focus on, with a brief explanation for each.",
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING, description: "The name of the skill." },
          reasoning: { type: Type.STRING, description: "A short, encouraging reason why focusing on this skill is important for their position." }
        },
        required: ["skill", "reasoning"],
      },
    },
    weeklyPlan: {
      type: Type.ARRAY,
      description: "A 3-day training plan for the week. Each day should have a clear focus and a list of specific drills.",
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING, description: "The day of the week (e.g., 'Day 1', 'Day 2')." },
          focus: { type: Type.STRING, description: "The primary skill focus for the day." },
          drills: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "The name of the drill from the provided list." },
                sets: { type: Type.NUMBER, description: "Number of sets to perform." },
                reps: { type: Type.STRING, description: "Repetitions or duration for each set (e.g., '15 reps', '5 minutes')." }
              },
              required: ["name", "sets", "reps"],
            }
          }
        },
        required: ["day", "focus", "drills"],
      }
    }
  },
  required: ["focusAreas", "weeklyPlan"],
};

export async function generateDevelopmentPlan(player: Player, drills: Drill[]): Promise<DevelopmentPlan> {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const sortedStats = [...player.stats].sort((a, b) => a.value - b.value);
  const weakestSkills = sortedStats.slice(0, 3);

  const drillList = drills.map(d => `- ${d.name} (Skill: ${d.skill}, Description: ${d.description})`).join('\n');

  const prompt = `
    You are an expert volleyball coach creating a personalized development plan for a youth athlete.
    
    Player Profile:
    - Name: ${player.name}
    - Position: ${player.position}
    - Weakest Skills (based on stats): ${weakestSkills.map(s => `${s.skill} (Score: ${s.value}/100)`).join(', ')}

    Available Drills:
    ${drillList}

    Task:
    Create a concise, encouraging, and actionable 1-week (3-day) development plan for ${player.name}. The plan should directly address their three weakest skills.
    1. Identify the 3 focus areas based on the weakest skills.
    2. Create a 3-day plan, assigning drills from the provided list that target these skills.
    3. The tone should be positive and motivational.
    4. Provide the output in the specified JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: generateDevelopmentPlanSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text;
    const plan = JSON.parse(jsonText) as DevelopmentPlan;
    return plan;
  } catch (error) {
    console.error("Error generating development plan with Gemini:", error);
    throw new Error("Failed to generate AI development plan. Please try again.");
  }
}

const generateMonthlyPlanSchema = {
    type: Type.ARRAY,
    description: "A 30-day lesson plan for a competitive youth volleyball team.",
    items: {
        type: Type.OBJECT,
        properties: {
            day: { type: Type.NUMBER, description: "The day number, from 1 to 30." },
            focus: { type: Type.STRING, description: "The primary skill or concept for the day's practice (e.g., 'Serving Accuracy', 'Defensive Transitions', 'Team Communication')." },
            drills: {
                type: Type.ARRAY,
                description: "A list of 3-4 specific drills for the day.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "A creative and descriptive name for the drill." },
                        description: { type: Type.STRING, description: "A concise, 1-2 sentence description of how to perform the drill." }
                    },
                    required: ["name", "description"]
                }
            }
        },
        required: ["day", "focus", "drills"]
    }
};

export async function generateMonthlyLessonPlan(drills: Drill[]): Promise<MonthlyPlan> {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const drillList = drills.map(d => `${d.name} (${d.skill})`).join(', ');

  const prompt = `
    You are an expert volleyball head coach for a competitive 17U team. Your task is to generate a comprehensive and varied 30-day practice plan for the upcoming month.

    Guidelines:
    1.  **Structure:** Create a plan for 30 consecutive days.
    2.  **Variety:** Ensure a balanced mix of skills throughout the month. Cover individual skills (serving, passing, hitting, setting, blocking, digging) and team concepts (e.g., serve receive patterns, defensive systems, offensive plays, transition offense, team communication).
    3.  **Progression:** The plan should have a logical flow. For example, start with fundamentals and build towards more complex team drills. Include lighter "recovery" or "strategy" days.
    4.  **Drill Generation:** For each day, create 3-4 specific, named drills with a brief description. You can use drills from the provided list as inspiration, but you should also create new, creative drills that fit the day's focus. Do not just copy the provided drills.
    5.  **Focus:** Each day must have a single, clear "focus".

    Here is a list of existing drills for inspiration: ${drillList}.

    Please generate the 30-day plan in the specified JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: generateMonthlyPlanSchema,
        temperature: 0.8,
      },
    });
    
    const jsonText = response.text;
    const plan = JSON.parse(jsonText) as MonthlyPlan;
    // Sort just in case the model returns them out of order
    return plan.sort((a, b) => a.day - b.day);
  } catch (error) {
    console.error("Error generating monthly lesson plan with Gemini:", error);
    throw new Error("Failed to generate AI lesson plan. Please try again.");
  }
}