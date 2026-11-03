import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alert, Platform, AppState } from 'react-native';

const TimerContext = createContext(null);

export const TIMER_PRESETS = [
  { id: '15m', label: '15 Min', minutes: 15 },
  { id: '30m', label: '30 Min', minutes: 30 },
  { id: '1h', label: '1 Hour', minutes: 60 },
  { id: '2h', label: '2 Hours', minutes: 120 },
];

export function TimerProvider({ children }) {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [endTimestamp, setEndTimestamp] = useState(null);
  const [pausedRemaining, setPausedRemaining] = useState(0);

  const intervalRef = useRef(null);
  const endTimestampRef = useRef(null);
  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);

  // Keep refs in sync for handlers and callbacks
  useEffect(() => {
    endTimestampRef.current = endTimestamp;
    isRunningRef.current = isRunning;
    isPausedRef.current = isPaused;
  }, [endTimestamp, isRunning, isPaused]);

  const handleTimerComplete = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setIsPaused(false);
    setEndTimestamp(null);
    setRemainingSeconds(0);
    setTotalSeconds(0);
    setPausedRemaining(0);

    const msg = 'Your reading timer has finished! Take a break or stretch your eyes.';
    if (Platform.OS === 'web') {
      window.alert(`⏰ Reading Session Complete!\n\n${msg}`);
    } else {
      Alert.alert('Reading Session Complete', msg, [{ text: 'OK' }]);
    }
  };

  // Synchronize remaining time against the absolute end timestamp
  const syncWithEndTimestamp = () => {
    if (!isRunningRef.current || isPausedRef.current || !endTimestampRef.current) {
      return;
    }
    const diffMs = endTimestampRef.current - Date.now();
    const remaining = Math.max(0, Math.ceil(diffMs / 1000));

    if (remaining <= 0) {
      handleTimerComplete();
    } else {
      setRemainingSeconds(remaining);
    }
  };

  // Countdown timer tick driven by absolute timestamp
  useEffect(() => {
    if (isRunning && !isPaused && endTimestamp) {
      // Immediate sync
      syncWithEndTimestamp();

      intervalRef.current = setInterval(() => {
        syncWithEndTimestamp();
      }, 500); // 500ms intervals prevent second-skipping drift
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, endTimestamp]);

  // Handle phone screen lock / app backgrounding & web visibility changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        syncWithEndTimestamp();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Web visibility listener for background browser tabs
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        syncWithEndTimestamp();
      }
    };

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      subscription.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, []);

  const startTimer = (minutes) => {
    const seconds = Math.max(1, Math.round(minutes * 60));
    const targetEndTime = Date.now() + seconds * 1000;

    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    setPausedRemaining(0);
    setEndTimestamp(targetEndTime);
    setIsRunning(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    if (isRunning && !isPaused && endTimestamp) {
      const remaining = Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
      setPausedRemaining(remaining);
      setRemainingSeconds(remaining);
      setIsPaused(true);
      setEndTimestamp(null);
    }
  };

  const resumeTimer = () => {
    if (isRunning && isPaused && pausedRemaining > 0) {
      const targetEndTime = Date.now() + pausedRemaining * 1000;
      setEndTimestamp(targetEndTime);
      setIsPaused(false);
    }
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setIsPaused(false);
    setEndTimestamp(null);
    setRemainingSeconds(0);
    setTotalSeconds(0);
    setPausedRemaining(0);
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

    if (hrs > 0) {
      return `${hrs}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const progressPercent =
    totalSeconds > 0
      ? Math.max(0, Math.min(100, Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100)))
      : 0;

  return (
    <TimerContext.Provider
      value={{
        presets: TIMER_PRESETS,
        totalSeconds,
        remainingSeconds,
        isRunning,
        isPaused,
        progressPercent,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        formatTime,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useReadingTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useReadingTimer must be used within a TimerProvider');
  }
  return context;
}
