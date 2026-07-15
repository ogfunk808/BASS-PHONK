import { create } from 'zustand';

export const usePlayerStore = create((set) => ({
  currentTrack: null,
  isPlaying: false,
  queue: [],
  currentIndex: -1,
  volume: 0.8,
  progress: 0,
  duration: 0,
  
  // Audio effects state
  bassBoost: 50, // 0 - 100
  reverbMix: 0,  // 0 - 100
  is8D: false,
  speed: 1.0,    // 0.5 - 2.0
  pitch: 1.0,    // 0.5 - 2.0
  eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 10 bands (-12dB to +12dB)
  
  // Controls
  setCurrentTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setQueue: (newQueue) => set({ queue: newQueue }),
  addTrack: (track) => set((state) => ({ queue: [...state.queue, track] })),
  setCurrentIndex: (index) => set((state) => ({ 
    currentIndex: index, 
    currentTrack: state.queue[index] || null 
  })),
  setVolume: (vol) => set({ volume: vol }),
  setProgress: (prog) => set({ progress: prog }),
  setDuration: (dur) => set({ duration: dur }),
  
  // FX setters
  setBassBoost: (val) => set({ bassBoost: val }),
  setReverbMix: (val) => set({ reverbMix: val }),
  setIs8D: (enabled) => set({ is8D: enabled }),
  setSpeed: (val) => set({ speed: val }),
  setPitch: (val) => set({ pitch: val }),
  setEqBand: (index, value) => set((state) => {
    const newBands = [...state.eqBands];
    newBands[index] = value;
    return { eqBands: newBands };
  }),
  resetEqBands: () => set({ eqBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }),
}));
