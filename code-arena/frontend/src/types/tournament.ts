export type TournamentStatus = 
  | 'DRAFT'
  | 'REGISTRATION'
  | 'GROUP_STAGE'
  | 'QUARTER_FINAL'
  | 'SEMI_FINAL'
  | 'FINAL'
  | 'COMPLETED'
  | 'CANCELLED';

export type PlayoffFormat = 'SINGLE_ELIMINATION';

export interface Tournament {
  _id: string;
  name: string;
  slug?: string;
  description: string;
  status: TournamentStatus;
  currentStage?: string;
  maxParticipants: number;
  numberOfGroups?: number;
  participantsPerGroup?: number;
  qualifiersPerGroup?: number;
  groupContests?: number;
  playoffFormat?: PlayoffFormat;
  registrationStart?: string;
  registrationEnd?: string;
  tournamentStart?: string;
  tournamentEnd?: string;
  startDate?: string;
  endDate?: string;
  createdBy: {
    _id: string;
    name: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTournamentPayload {
  name: string;
  description: string;
  registrationStart: string;
  registrationEnd: string;
  tournamentStart: string;
  tournamentEnd: string;
  maxParticipants: number;
  numberOfGroups: number;
  participantsPerGroup: number;
  qualifiersPerGroup: number;
  groupContests: number;
  playoffFormat: PlayoffFormat;
}