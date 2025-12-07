export interface Comment {
  id: string;
  author: string;
  authorId: string;
  text: string;
  createdAt: number;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  storyUrl?: string; // New field
  insights?: string; // New field
  transcript?: string; // New field
  author: string;
  authorId?: string;
  createdAt: number;
  tags: string[];
  likes: number;
  views: number;
  readTimeMinutes: number;
  coverImage?: string;
  isFeatured?: boolean;
  comments: Comment[];
}

export interface UserProfile {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  role: 'user' | 'admin';
  email: string;
  likedStories: string[];
}

export enum EditorMode {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  CREATE = 'CREATE'
}

export type AIActionType = 'POLISH' | 'EXPAND' | 'SUMMARIZE' | 'TITLE' | 'INSIGHTS';