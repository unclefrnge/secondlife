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
  audioFile: string;
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
