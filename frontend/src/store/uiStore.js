import { create } from 'zustand';

export const useUiStore = create((set) => ({
  activePage: 'home', // home, explore, library, community, wallpapers, settings, visualizer, car-mode
  carModeEnabled: false,
  visualizerEnabled: false,
  visualizerMode: 'spectrum', // spectrum, waveform, particles
  
  setActivePage: (page) => set({ 
    activePage: page,
    carModeEnabled: page === 'car-mode',
    visualizerEnabled: page === 'visualizer',
  }),
  setCarModeEnabled: (enabled) => set({ 
    carModeEnabled: enabled, 
    activePage: enabled ? 'car-mode' : 'home' 
  }),
  setVisualizerEnabled: (enabled) => set({ 
    visualizerEnabled: enabled,
    activePage: enabled ? 'visualizer' : 'home'
  }),
  setVisualizerMode: (mode) => set({ visualizerMode: mode }),
}));
