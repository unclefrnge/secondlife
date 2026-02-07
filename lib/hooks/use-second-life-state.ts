'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { tracks } from '@/lib/config';
import { DEFAULT_STATE, isStorageAvailable, readState, writeState } from '@/lib/storage';
import type { ListeningMode, SecondLifeState } from '@/lib/types';
import { uniquePush } from '@/lib/utils';

const totalTracks = tracks.length;

export function useSecondLifeState() {
  const [state, setState] = useState<SecondLifeState>(DEFAULT_STATE);
  const [isHydrated, setIsHydrated] = useState(false);
  const [storageEnabled, setStorageEnabled] = useState(true);

  useEffect(() => {
    const enabled = isStorageAvailable();
    setStorageEnabled(enabled);
    setState(enabled ? readState() : DEFAULT_STATE);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || !storageEnabled) {
      return;
    }
    writeState(state);
  }, [state, isHydrated, storageEnabled]);

  const setMode = useCallback((mode: ListeningMode) => {
    setState((current) => ({ ...current, mode }));
  }, []);

  const markGuidedLeadInComplete = useCallback((trackId: string) => {
    setState((current) => ({
      ...current,
      openedGuided: uniquePush(current.openedGuided, trackId),
      lastPlayedTrackId: trackId
    }));
  }, []);

  const markTrackStarted = useCallback((trackId: string) => {
    setState((current) => ({ ...current, lastPlayedTrackId: trackId }));
  }, []);

  const markTrackCompleted = useCallback((trackId: string, modeAtCompletion: ListeningMode) => {
    setState((current) => {
      const completedTracks = uniquePush(current.completedTracks, trackId);
      const guidedCompleted =
        modeAtCompletion === 'guided'
          ? uniquePush(current.guidedCompleted, trackId)
          : current.guidedCompleted;

      const appendixUnlocked = current.appendixUnlocked || guidedCompleted.length === totalTracks;

      return {
        ...current,
        completedTracks,
        guidedCompleted,
        appendixUnlocked
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setState((current) => ({
      ...current,
      openedGuided: [],
      completedTracks: [],
      guidedCompleted: [],
      appendixUnlocked: false,
      lastPlayedTrackId: null
    }));
  }, []);

  const hasOpenedGuidedTrack = useCallback(
    (trackId: string) => state.openedGuided.includes(trackId),
    [state.openedGuided]
  );

  const hasCompletedTrack = useCallback(
    (trackId: string) => state.completedTracks.includes(trackId),
    [state.completedTracks]
  );

  const shouldTriggerLeadIn = useCallback(
    (trackId: string, modeOverride?: ListeningMode) => {
      const mode = modeOverride ?? state.mode;
      if (mode !== 'guided') {
        return false;
      }
      return !state.openedGuided.includes(trackId);
    },
    [state.mode, state.openedGuided]
  );

  const progress = useMemo(
    () => ({
      completed: state.completedTracks.length,
      total: totalTracks
    }),
    [state.completedTracks.length]
  );

  return {
    state,
    isHydrated,
    storageEnabled,
    setMode,
    markGuidedLeadInComplete,
    markTrackStarted,
    markTrackCompleted,
    resetProgress,
    hasOpenedGuidedTrack,
    hasCompletedTrack,
    shouldTriggerLeadIn,
    progress
  };
}
