import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  name?: string;
  role: 'candidate' | 'hr' | 'admin';
  isApproved: boolean;
  resumeUrl?: string;
  bio?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Session {
  id: string;
  userId: string;
  role: string;
  experienceLevel: string;
  overallScore?: number;
  queueState?: string;
  currentQuestionNumber?: number;
  createdAt: Timestamp;
}

export interface Turn {
  id: string;
  sessionId: string;
  questionNumber: number;
  question: string;
  answerText?: string;
  answerAudioUrl?: string;
  voiceMetrics?: Record<string, any>;
  bodyMetrics?: Record<string, any>;
  evalJson?: Record<string, any>;
  timestamp: Timestamp;
}

export interface Report {
  id: string;
  sessionId: string;
  userId: string;
  overallScore: number;
  performanceBreakdown?: Record<string, any>;
  strengths?: string[];
  gaps?: string[];
  suggestedTopics?: string[];
  pdfUrl?: string;
  shareId?: string;
  createdAt: Timestamp;
}

export interface Tip {
  id: string;
  userId: string;
  identifiedWeaknesses?: string[];
  suggestedTopics?: string[];
  tier?: string;
  createdAt: Timestamp;
}

export interface Share {
  id: string;
  reportId: string;
  shareToken: string;
  public: boolean;
  expiresAt?: Timestamp;
  viewCount: number;
  createdAt: Timestamp;
}

export interface MockInterviewRequest {
  id: string;
  userId: string;
  jobRole: string;
  companyName?: string;
  experienceLevel: string;
  jobDescription?: string;
  status: 'pending' | 'approved' | 'rejected';
  bookingStatus: 'open' | 'claimed' | 'scheduled' | 'completed';
  claimedBy?: string;
  scheduledDate?: Timestamp;
  preferredDate?: string;
  preferredTime?: string;
  additionalNotes?: string;
  createdAt: Timestamp;
}

export interface AdminAction {
  id: string;
  actionType: string;
  requestId?: string;
  userId: string;
  timestamp: Timestamp;
}

export interface ResumeData {
  id: string;
  userId: string;
  parsedData: Record<string, any>;
  createdAt: Timestamp;
}

export type UserRole = 'candidate' | 'hr' | 'admin';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type BookingStatus = 'open' | 'claimed' | 'scheduled' | 'completed';
