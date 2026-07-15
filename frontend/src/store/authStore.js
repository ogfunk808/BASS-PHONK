import { create } from 'zustand';
import { supabase, supabaseConfigured } from '../services/supabaseClient';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const storedUser = localStorage.getItem('bass_phonk_user');
const initialUser = storedUser ? JSON.parse(storedUser) : null;

export const useAuthStore = create((set) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  loading: false,

  login: async (username, age) => {
    set({ loading: true });
    try {
      const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');

      if (!supabaseConfigured) {
        throw new Error('Supabase not configured');
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (error) throw error;

      let userRecord;
      if (profile) {
        userRecord = {
          id: profile.id,
          username: profile.username,
          age: parseInt(age),
          display_name: profile.display_name || profile.username.toUpperCase(),
          avatar_url: profile.avatar_url || '/artwork/default_avatar.svg',
          is_artist: profile.is_artist,
          is_premium: profile.is_premium,
          bio: profile.bio || ''
        };
      } else {
        const newId = generateUUID();
        const profileData = {
          id: newId,
          username: cleanUsername,
          display_name: username.toUpperCase(),
          avatar_url: '/artwork/default_avatar.svg',
          is_artist: true,
          is_premium: false,
          bio: 'Born to drift 🏎️💨'
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (insertError) throw insertError;

        userRecord = {
          ...profileData,
          age: parseInt(age)
        };
      }

      localStorage.setItem('bass_phonk_user', JSON.stringify(userRecord));
      set({ user: userRecord, isAuthenticated: true });
    } catch (err) {
      const fallbackUser = {
        id: generateUUID(),
        username: username,
        age: parseInt(age),
        display_name: username.toUpperCase(),
        avatar_url: '/artwork/default_avatar.svg',
        is_artist: true,
        is_premium: false,
        bio: 'Born to drift 🏎️💨'
      };
      localStorage.setItem('bass_phonk_user', JSON.stringify(fallbackUser));
      set({ user: fallbackUser, isAuthenticated: true });
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (updatedData) => {
    set((state) => {
      const updatedUser = { ...state.user, ...updatedData };
      localStorage.setItem('bass_phonk_user', JSON.stringify(updatedUser));
      
      // Update asynchronously in Supabase database
      supabase.from('profiles').update({
        display_name: updatedUser.display_name,
        bio: updatedUser.bio,
        avatar_url: updatedUser.avatar_url,
        is_artist: updatedUser.is_artist,
        is_premium: updatedUser.is_premium
      }).eq('id', updatedUser.id).then(({ error }) => {
        if (error) console.error('Error syncing profile update to Supabase:', error);
      });

      return { user: updatedUser };
    });
  },

  logout: () => {
    localStorage.removeItem('bass_phonk_user');
    set({ user: null, isAuthenticated: false });
  },
}));
