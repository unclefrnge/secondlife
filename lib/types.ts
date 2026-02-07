export type ListeningMode = 'guided' | 'direct';

export type LeadInType = 'breathing-ring' | 'align-dots';

export interface TrackLeadIn {
  type: LeadInType;
  durationMs: number;
  driftSpeed?: 'slow' | 'normal' | 'fast';
}

export interface Track {
  id: string;
  order: number;
  title: string;
  embedUrl: string;
  leadIn: TrackLeadIn;
}

export interface AppendixItem {
  trackId: string;
  title: string;
  artefactType: 'note' | 'patch' | 'image';
  content: string;
  imageUrl?: string;
}

export interface SecondLifeState {
  mode: ListeningMode;
  openedGuided: string[];
  completedTracks: string[];
  guidedCompleted: string[];
  appendixUnlocked: boolean;
  lastPlayedTrackId: string | null;
}
