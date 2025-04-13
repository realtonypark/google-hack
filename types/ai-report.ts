// types/ai-report.ts

export interface AIReport {
    personaName: string;
    tagline: string;
    personaDetails: {
      description: string;
      tags: string[];
    };
    genres: {
      name: string;
      percentage: number;
    }[];
    insightText: string;
    mediaPersonality: MBTITrait[]
  }

  export type MBTITrait = {
    name: string
    left: string
    right: string
    value: number // 0~100
  }