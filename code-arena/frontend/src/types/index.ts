// ============================================================
// USER TYPES
// ============================================================
export interface User {
  _id: string;
  id?: string;
  username: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'PARTICIPANT' | 'USER';
  codeforcesUsername?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
  codeforcesUsername?: string;
}

// ============================================================
// TOURNAMENT TYPES
// ============================================================
export type TournamentStatus =
  | 'DRAFT'
  | 'REGISTRATION'
  | 'GROUP_STAGE'
  | 'QUARTER_FINAL'
  | 'SEMI_FINAL'
  | 'FINAL'
  | 'COMPLETED'
  | 'CANCELLED';

export type TournamentStage =
  | 'GROUP_STAGE'
  | 'QUARTER_FINAL'
  | 'SEMI_FINAL'
  | 'FINAL';

export interface Tournament {
  _id: string;
  name: string;
  slug?: string;
  description: string;
  status: TournamentStatus;
  currentStage?: TournamentStage | string;
  maxParticipants: number;
  participantCount?: number;

  // Display / metadata
  format?: string;
  prizePool?: string | number;

  numberOfGroups?: number;
  participantsPerGroup?: number;
  qualifiersPerGroup?: number;
  groupContests?: number;
  playoffFormat?: string;
  registrationStart?: string;
  registrationEnd?: string;
  tournamentStart?: string;
  tournamentEnd?: string;
  startDate?: string;
  endDate?: string;
  contestCount?: number;
  createdBy: {
    _id: string;
    name: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// PARTICIPANT TYPES
// ============================================================
export type ParticipantStatus =
  | 'ACTIVE'
  | 'ELIMINATED'
  | 'ADVANCED'
  | 'CHAMPION';
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Participant {
  _id: string;
  user: User;
  tournamentId: string;
  registrationStatus?: RegistrationStatus;
  group?: string;
  seed?: number;
  rank?: number;
  score?: number;
  solved?: number;
  penalty?: number;
  status: ParticipantStatus;
  currentStage?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// CONTEST TYPES
// ============================================================
export type ContestStatus =
  | 'DRAFT'
  | 'UPCOMING'
  | 'PUBLISHED'
  | 'LIVE'
  | 'FINISHED'
  | 'CANCELLED';

export interface Contest {
  _id: string;
  tournamentId: string;

  name?: string;
  invitationUrl?: string;
  description?: string;
  published: boolean;
  publishedAt?: Date;
  endTime?: Date;

  codeforcesContestId?: number;
  codeforcesContestName?: string;
  codeforcesUrl?: string;
  type?: string;
  phase?: string;
  lastSyncedAt?: Date;
  syncedCount?: number;

  startTime: Date;
  durationSeconds?: number;
  durationMinutes?: number;

  stage: TournamentStage | string;
  round?: string;
  group?: string;
  matchNumber?: number;
  matchNumbers?: number[];

  status?: ContestStatus;

  createdAt?: string;
  updatedAt?: string;
}

// ============================================================
// LEADERBOARD TYPES
// ============================================================
export interface LeaderboardEntry {
  rank: number;
  participantId: string;
  username: string;
  name?: string;
  codeforcesUsername?: string;
  group?: string;
  solved: number;
  score: number;
  penalty: number;

  status?: ParticipantStatus;
  currentStage?: string | null;

  validContests?: number;
  contestCount?: number;
  groupRank?: number | null;
  latestRank?: number | null;
  winRate?: number | null;
  isEliminated?: boolean;
  hasAdvanced?: boolean;
  isChampion?: boolean;
}

// ============================================================
// STANDINGS TYPES
// ============================================================
export interface StandingsEntry {
  rank: number;
  participantId: string;
  username: string;
  name?: string;
  codeforcesUsername?: string;
  group?: string;
  solved: number;
  score: number;
  penalty: number;
  status: ParticipantStatus;
  isEliminated?: boolean;
  hasAdvanced?: boolean;
}

// ============================================================
// BRACKET / MATCH TYPES
// ============================================================
// Nested contest info as returned by the bracket endpoint
export interface BracketMatchContest {
  _id: string;
  name?: string;
  status?: string;
}

// A single knockout match (as returned by the bracket endpoint)
export interface Match {
  _id?: string;
  matchNumber: number;
  stage?: string;
  participants: Participant[];
  contest?: BracketMatchContest | null;
  winner?: Participant | null;
  status?: 'PENDING' | 'LIVE' | 'COMPLETED' | 'TIE';
  rematchRound?: number;
}

// Backwards-compatible alias — some pages import BracketMatch
export type BracketMatch = Match;

export interface Bracket {
  groupStage: Record<string, Participant[]>;
  quarterFinal: Match[];
  semiFinal: Match[];
  final: Match | null;
  champion: Participant | null;
}

// ============================================================
// RESULT TYPES
// ============================================================
export interface ProblemResult {
  problemIndex: string;
  problemName: string;
  points: number;
  solved: boolean;
  wrongAttempts: number;
  bestSubmissionTime?: number;
}

export interface Result {
  _id: string;
  contestId: string;
  tournamentId: string;
  participantId: string;
  participant?: {
    _id: string;
    user?: {
      username?: string;
      name?: string;
      codeforcesUsername?: string;
    };
    group?: string;
  };
  codeforcesHandle: string;
  rank: number;
  points: number;
  score: number;
  penalty: number;
  solvedCount: number;
  solved: number;
  problemResults: ProblemResult[];
  syncedAt: Date;
}

// ============================================================
// VIDEO SUBMISSION TYPES
// ============================================================
export type VideoStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'NOT_SUBMITTED';

export interface VideoSubmission {
  _id: string;
  contestId: string;
  tournamentId: string;
  participantId: string;
  videoUrl: string;
  note?: string;
  status: VideoStatus;
  reviewedBy?: User;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// INVITATION TYPES
// ============================================================
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface Invitation {
  _id: string;
  contestId: string;
  tournamentId: string;
  participantId: string;
  status: InvitationStatus;
  invitedBy: User;
  respondedAt?: Date;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// AUDIT LOG TYPES
// ============================================================
export interface AuditLog {
  _id: string;
  action: string;
  description: string;
  admin: User;
  tournament?: string;
  details: unknown;
  createdAt: Date;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}