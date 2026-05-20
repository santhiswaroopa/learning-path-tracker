export type TopicStatus = 'not_started' | 'in_progress' | 'completed' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Subtopic {
  id: number;
  topicId: number;
  title: string;
  isCompleted: boolean;
  isDone?: boolean;
}

export interface Note {
  id: number;
  topicId: number;
  content: string;
  createdAt: string;
  isImportant?: boolean;
  topic: { id: number; title: string };
}

export interface Topic {
  id: number;
  title: string;
  description: string;
  status: TopicStatus;
  progress: number;
  createdAt: string;
  category: string;
  priority?: string;
  subtopics: Subtopic[];
  notes: Note[];
}

export interface ActivityItem {
  id: number;
  type: 'note_added' | 'topic_started' | 'topic_completed' | 'subtopic_done';
  message: string;
  timestamp: string;
  topicTitle: string;
}

export interface DashboardStats {
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  totalNotes: number;
  currentStreak: number;
  weeklyGoal: number;
  weeklyCompleted: number;
  totalSubtopics: number;
  completedSubtopics: number;
  overallProgress: number;
}
