import { create } from 'zustand';

const storedUser = localStorage.getItem('bass_phonk_user');
const initialUser = storedUser ? JSON.parse(storedUser) : null;

export const useAuthStore = create((set) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  loading: false,

  login: (username, age) => {
    const newUser = {
      id: 'mock-user-id-' + Math.random().toString(36).substr(2, 9),
      username,
      age: parseInt(age),
      display_name: username.toUpperCase(),
      avatar_url: '/artwork/default_avatar.jpg',
      is_artist: true, // Allow user to upload songs by default
      is_premium: false
    };
    localStorage.setItem('bass_phonk_user', JSON.stringify(newUser));
    set({ user: newUser, isAuthenticated: true });
  },

  updateProfile: (updatedData) => set((state) => {
    const updatedUser = { ...state.user, ...updatedData };
    localStorage.setItem('bass_phonk_user', JSON.stringify(updatedUser));
    return { user: updatedUser };
  }),

  logout: () => {
    localStorage.removeItem('bass_phonk_user');
    set({ user: null, isAuthenticated: false });
  },
}));
