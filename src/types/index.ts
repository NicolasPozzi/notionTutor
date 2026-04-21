/**
 * NotionTutor Type Definitions
 * Shared types used across the application
 *
 * Note: These types are defined based on architecture.md schema.
 * They will be used once Prisma is configured in Story 0.2.
 * Keeping them here ensures type consistency from the start.
 */

// API Error Response (standardized format from architecture.md)
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    retryAfter?: number;
  };
}

// User types (from database schema)
export interface User {
  id: string;
  notionUserId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

// Revision session types
export type SessionStatus = "in_progress" | "completed" | "abandoned";

export interface RevisionSession {
  id: string;
  userId: string;
  notionPageId: string;
  notionPageTitle: string | null;
  status: SessionStatus;
  questionsTotal: number;
  questionsAnswered: number;
  correctCount: number;
  startedAt: Date;
  completedAt: Date | null;
}

// Question types
export interface Question {
  id: string;
  userId: string;
  sessionId: string | null;
  notionPageId: string;
  questionText: string;
  answerExcerpt: string | null;
  timesAsked: number;
  timesCorrect: number;
  lastAskedAt: Date | null;
  nextReviewAt: Date | null;
  createdAt: Date;
}

// Digest types
export type DigestFrequency = "daily" | "weekly";
export type DigestStatus = "active" | "paused" | "completed";

export interface Digest {
  id: string;
  userId: string;
  notionPageId: string;
  notionPageTitle: string | null;
  frequency: DigestFrequency;
  sendTime: string;
  timezone: string;
  durationDays: number | null;
  startedAt: Date;
  endsAt: Date | null;
  lastSentAt: Date | null;
  status: DigestStatus;
  createdAt: Date;
}

// Streak types
export interface UserStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  updatedAt: Date;
}
