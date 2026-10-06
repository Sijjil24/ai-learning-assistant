export type LearningLevel = "Beginner" | "Intermediate" | "Advanced";
export type Understanding = "shaky" | "getting-there" | "confident";
export type LessonRating = Understanding;

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  content: string;
  example: string;
  practiceQuestion: string;
}

export interface LearningPlan {
  topic: string;
  level: LearningLevel;
  understanding: Understanding;
  lessons: Lesson[];
  createdAt?: { seconds: number };
}

export interface TopicProgress {
  topic: string;
  level: LearningLevel;
  progressPercent: number;
  lessonRatings: Record<string, LessonRating>;
  completedLessons: string[];
  strongAreas: string[];
  weakAreas: string[];
}

export function topicProgressId(topic: string) {
  return topic.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}