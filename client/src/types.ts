export type Role = "member" | "host" | "admin";
export type Urgency = "low" | "medium" | "high" | "urgent";
export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  eventId: number;
  hostType: string | null;
}
export interface Photo {
  id: number;
  filePath: string;
  createdAt: string;
  questionId?: number;
}
export interface Subtask {
  id: number;
  title: string;
  sortOrder: number;
  completedAt: string | null;
  completedByUserId: number | null;
}
export interface RelatedQuestion {
  id: number;
  content: string;
  urgency: Urgency;
  status: "open" | "resolved";
  answerText: string | null;
  photos: Photo[];
}
export interface Task {
  id: number;
  title: string;
  description: string | null;
  assignedToUserId: number | null;
  urgency: Urgency;
  status: "open" | "completed";
  photoRequired: boolean;
  subtasks: Subtask[];
  photos: Photo[];
  assignee?: {
    name: string;
    email: string;
  };
  relatedQuestions?: RelatedQuestion[];
  openQuestionCount?: number;
}
export interface Question {
  id: number;
  content: string;
  taskId: number | null;
  urgency: Urgency;
  status: "open" | "resolved";
  answerText: string | null;
  photos: Photo[];
}
