import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from './store/playerStore';
import { useAuthStore } from './store/authStore';
import { useUiStore } from './store/uiStore';
import { audioEngine } from './services/audioEngine';
import { GENRES, DEMO_TRACKS, EQ_PRESETS } from './utils/constants';

// Simple mock/demo audio sources for phonk tracks so they play immediately!
const DEMO_AUDIO_URLS = [
  'https://pub-c5e31b5cdafb419a86616ddde59f971a.r2.dev/Why_Not.mp3',
  'https://pub-c5e31b5cdafb419a86616ddde59f971a.r2.dev/Murder_In_My_Mind.mp3',
  'https://pub-c5e31b5cdafb419a86616ddde59f971a.r2.dev/Override.mp3',
  'https://pub-c5e31b5cdafb419a86616ddde59f971a.r2.dev/Metamorphosis.mp3',
  'https://pub-c5e31b5cdafb419a86616ddde59f971a.r2.dev/Close_Eyes.mp3'
];

// Multi-language translation database
const TRANSLATIONS = {
  en: {
    home: 'Home',
    explore: 'Explore Playlists',
    visualizer: '3D Visualizer',
    speedometer: 'Speedometer Mode',
    wallpapers: 'Drift Wallpapers',
    equalizer: 'Equalizer & FX',
    aiDj: 'AI Phonk DJ',
    upload: 'Upload Track 📤',
    profile: 'My Profile 👤',
    logout: 'Log Out ✕',
    premium: 'GO PREMIUM',
    vipPass: 'VIP Phonk Pass',
    noAds: 'No Ads (Banners, Interstitials, Rewarded)',
    unlimitedDownloads: 'Unlimited Offline Downloads',
    hiResAudio: 'Hi-Res Audio (FLAC streaming)',
    dolbyEq: 'Exclusive Dolby & Studio EQ presets',
    speedometerThemes: 'Premium Speedometer Themes',
    download4k: 'Download Exclusive 4K Wallpapers',
    subscribeNow: 'SUBSCRIBE NOW',
    searchPlaceholder: 'Search Phonk, artists, genres...',
    volume: 'Volume',
    noSongPlaying: 'No song playing',
    popularGenres: 'Popular Genres',
    trendingSongs: 'Trending Phonk Songs',
    newReleases: 'New Releases',
    nowStreaming: 'NOW STREAMING',
    playNow: 'PLAY NOW',
    oneTouchBass: 'ONE-TOUCH BASS BOOST',
    currentSong: 'CURRENT SONG',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    aiPlaceholder: 'Ask AI DJ: "play METAMORPHOSIS", "boost bass to 100", "slowed", "help"...',
    send: 'Send',
    aiGreeting: 'Yo! I am your AI Phonk DJ. Ask me to play a track, boost the bass, or activate slowed & reverb! 🏎️💨',
    volumeWarning: '⚠️ WARNING: SUB-AMPLIFIER ACTIVE (VOL > 100%)',
    spatialActive: '8D SPATIAL ACTIVE',
    bassLevel: 'Bass Level',
    speedReverb: 'Playback Speed (Slowed & Reverb)',
    graphicEq: '10-Band Graphic Equalizer',
    leaderboard: 'Weekly Leaderboard',
    loginTitle: 'ENTER BASS PHONK',
    loginSub: 'Type username and age to enter the neon drift empire',
    usernameLabel: 'USERNAME',
    ageLabel: 'AGE',
    enterBtn: 'ENTER THE PHONK VERSE 🏎️💨',
    usernameError: 'Username must be at least 3 characters',
    ageError: 'You must enter a valid age',
    profileTitle: 'Customize Profile',
    displayNameLabel: 'Display Name',
    bioLabel: 'Bio',
    avatarUrlLabel: 'Avatar URL',
    saveProfileBtn: 'Save Profile Changes',
    uploadTitle: 'Upload Your Phonk',
    songTitleLabel: 'Song Title',
    artistLabel: 'Artist Name',
    bpmLabel: 'BPM',
    durationLabel: 'Duration (seconds)',
    audioUrlLabel: 'Audio Stream URL',
    coverUrlLabel: 'Cover Art Image URL',
    publishBtn: 'PUBLISH TRACK ⚡',
    youtube: 'YouTube Channel 📺',
    loudly: 'Loudly AI Remix 🎵',
    youtubeVideos: 'YouTube Videos 🎥',
    nowPlaying: 'Now Playing 🎵',
    likes: 'Likes',
    comments: 'Comments',
    commentPlaceholder: 'Write a comment...',
    postComment: 'Comment ⚡',
  },
  pt: {
    home: 'Início',
    explore: 'Explorar Playlists',
    visualizer: 'Visualizador 3D',
    speedometer: 'Velocímetro',
    wallpapers: 'Papéis de Parede Drift',
    equalizer: 'Equalizador e FX',
    aiDj: 'AI Phonk DJ',
    upload: 'Enviar Faixa 📤',
    profile: 'Meu Perfil 👤',
    logout: 'Sair ✕',
    premium: 'SEJA PREMIUM',
    vipPass: 'Passe VIP Phonk',
    noAds: 'Sem Anúncios (Banners, Intersticiais, Premiados)',
    unlimitedDownloads: 'Downloads Offline Ilimitados',
    hiResAudio: 'Áudio de Alta Resolução (FLAC)',
    dolbyEq: 'Presets exclusivos Dolby & Studio',
    speedometerThemes: 'Temas Premium do Velocímetro',
    download4k: 'Baixar papéis de parede 4K exclusivos',
    subscribeNow: 'INSCREVA-SE AGORA',
    searchPlaceholder: 'Buscar Phonk, artistas, gêneros...',
    volume: 'Volume',
    noSongPlaying: 'Nenhuma música tocando',
    popularGenres: 'Gêneros Populares',
    trendingSongs: 'Músicas Phonk do Momento',
    newReleases: 'Novos Lançamentos',
    nowStreaming: 'TOCANDO AGORA',
    playNow: 'TOCAR AGORA',
    oneTouchBass: 'BASS BOOST DE UM TOQUE',
    currentSong: 'MÚSICA ATUAL',
    privacy: 'Política de Privacidade',
    terms: 'Termos de Serviço',
    aiPlaceholder: 'Peça ao DJ: "tocar PHONK WALK", "grave no máximo", "slowed", "ajuda"...',
    send: 'Enviar',
    aiGreeting: 'E aí! Eu sou o seu AI Phonk DJ. Peça-me para tocar uma música, aumentar o grave ou ativar o modo slowed & reverb! 🇧🇷🔥',
    volumeWarning: '⚠️ PERIGO: SUB-AMPLIFICADOR ATIVO (VOL > 100%)',
    spatialActive: 'ESPACIAL 8D ATIVO',
    bassLevel: 'Grave',
    speedReverb: 'Velocidade de Reprodução (Slowed & Reverb)',
    graphicEq: 'Equalizador Gráfico de 10 Bandas',
    leaderboard: 'Líderes da Semana',
    loginTitle: 'ENTRAR NO BASS PHONK',
    loginSub: 'Digite nome de usuário e idade para entrar no império do drift',
    usernameLabel: 'NOME DE USUÁRIO',
    ageLabel: 'IDADE',
    enterBtn: 'ENTRAR NO PHONK VERSE 🏎️💨',
    usernameError: 'Nome de usuário deve ter pelo menos 3 caracteres',
    ageError: 'Digite uma idade válida',
    profileTitle: 'Personalizar Perfil',
    displayNameLabel: 'Nome de Exibição',
    bioLabel: 'Biografia',
    avatarUrlLabel: 'Link da Imagem de Avatar',
    saveProfileBtn: 'Salvar Alterações',
    uploadTitle: 'Enviar Seu Phonk',
    songTitleLabel: 'Título da Música',
    artistLabel: 'Nome do Artista',
    bpmLabel: 'BPM',
    durationLabel: 'Duração (segundos)',
    audioUrlLabel: 'Link do Áudio',
    coverUrlLabel: 'Link da Capa do Álbum',
    publishBtn: 'PUBLICAR MÚSICA ⚡',
    youtube: 'Canal do YouTube 📺',
    loudly: 'Loudly AI Remix 🎵',
    youtubeVideos: 'Vídeos do YouTube 🎥',
    nowPlaying: 'Tocando Agora 🎵',
    likes: 'Curtidas',
    comments: 'Comentários',
    commentPlaceholder: 'Escreva um comentário...',
    postComment: 'Comentar ⚡',
  },
  ru: {
    home: 'Главная',
    explore: 'Плейлисты',
    visualizer: '3D Визуализатор',
    speedometer: 'Спидометр',
    wallpapers: 'Дрифт Обои',
    equalizer: 'Эквалайзер и FX',
    aiDj: 'AI Фонк Диджей',
    upload: 'Загрузить трек 📤',
    profile: 'Мой Профиль 👤',
    logout: 'Выйти ✕',
    premium: 'ПРЕМИУМ',
    vipPass: 'VIP Фонк Пропуск',
    noAds: 'Без рекламы (Баннеры, Межстраничные, Видео)',
    unlimitedDownloads: 'Безлимитное скачивание',
    hiResAudio: 'Hi-Res Звук (FLAC стриминг)',
    dolbyEq: 'Эксклюзивные Dolby и Studio пресеты',
    speedometerThemes: 'Премиум темы спидометра',
    download4k: 'Эксклюзивные 4K обои',
    subscribeNow: 'ПОДПИСАТЬСЯ',
    searchPlaceholder: 'Искать фонк, артистов, жанры...',
    volume: 'Громкость',
    noSongPlaying: 'Песня не выбрана',
    popularGenres: 'Популярные жанры',
    trendingSongs: 'Популярные треки',
    newReleases: 'Новые релизы',
    nowStreaming: 'СЕЙЧАС ИГРАЕТ',
    playNow: 'ИГРАТЬ',
    oneTouchBass: 'БАС БУСТ В ОДНО КАСАНИЕ',
    currentSong: 'ТЕКУЩИЙ ТРЕК',
    privacy: 'Конфиденциальность',
    terms: 'Условия',
    aiPlaceholder: 'Попроси ИИ: "включи CLOSE EYES", "басс на 100", "замедлить", "помощь"...',
    send: 'Отправить',
    aiGreeting: 'Йоу! Я твой AI Phonk DJ. Попроси меня включить трек, бабахнуть басы или замедлить темп! 🇷🇺⚡',
    volumeWarning: '⚠️ ВНИМАНИЕ: УСИЛИТЕЛЬ АКТИВЕН (VOL > 100%)',
    spatialActive: '8D ЗВУК АКТИВЕН',
    bassLevel: 'Уровень баса',
    speedReverb: 'Скорость воспроизведения (Slowed & Reverb)',
    graphicEq: '10-полосный эквалайзер',
    leaderboard: 'Лидеры недели',
    loginTitle: 'ВХОД В BASS PHONK',
    loginSub: 'Введите юзернейм и возраст для входа в дрифт-империю',
    usernameLabel: 'ЮЗЕРНЕЙМ',
    ageLabel: 'ВОЗРАСТ',
    enterBtn: 'ВОЙТИ В ФОНК СВЕЛЕННУЮ 🏎️💨',
    usernameError: 'Имя пользователя должно быть не менее 3 символов',
    ageError: 'Укажите ваш возраст',
    profileTitle: 'Настройки Профиля',
    displayNameLabel: 'Отображаемое имя',
    bioLabel: 'О себе',
    avatarUrlLabel: 'Ссылка на аватар',
    saveProfileBtn: 'Сохранить изменения',
    uploadTitle: 'Загрузить свой фонк',
    songTitleLabel: 'Название трека',
    artistLabel: 'Имя артиста',
    bpmLabel: 'BPM',
    durationLabel: 'Длительность (сек.)',
    audioUrlLabel: 'Ссылка на аудиофайл',
    coverUrlLabel: 'Ссылка на обложку',
    publishBtn: 'ОПУБЛИКОВАТЬ ⚡',
    youtube: 'YouTube Канал 📺',
    loudly: 'Loudly ИИ Ремикс 🎵',
    youtubeVideos: 'YouTube Видео 🎥',
    nowPlaying: 'Сейчас Играет 🎵',
    likes: 'Понравилось',
    comments: 'Комментарии',
    commentPlaceholder: 'Написать комментарий...',
    postComment: 'Отправить ⚡',
  }
};

export default function App() {
  const { 
    currentTrack, isPlaying, volume, progress, duration, 
    bassBoost, eqBands, is8D, speed, queue, currentIndex,
    setCurrentTrack, setIsPlaying, setVolume, setProgress, setDuration,
    setBassBoost, setEqBand, setIs8D, setSpeed, setQueue, setCurrentIndex,
    addTrack
  } = usePlayerStore();

  const { activePage, setActivePage, visualizerMode, setVisualizerMode } = useUiStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // App UI State variables
  const [language, setLanguage] = useState('en');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 820);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  
  // Custom authentication states (Username + Age)
  const { user, isAuthenticated, login, logout, updateProfile } = useAuthStore();
  const [loginUsername, setLoginUsername] = useState('');
  const [loginAge, setLoginAge] = useState('');
  const [loginError, setLoginError] = useState('');

  // Editable Profile fields state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Upload track form states
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [uploadGenre, setUploadGenre] = useState('drift');

  // Like & Comment states
  const [commentsByTrack, setCommentsByTrack] = useState({
    '1': [
      { id: 1, user: 'Drift_King', text: 'That bass pattern is insane! 🔥', timestamp: '2 mins ago' },
      { id: 2, user: 'PhonkFanatic', text: 'Cowbell goes crazy 🔔', timestamp: '1 min ago' }
    ]
  });
  const [likesByTrack, setLikesByTrack] = useState({
    '1': 142,
    '2': 89,
    '3': 256,
    '4': 310,
    '5': 198
  });
  const [userLikedTracks, setUserLikedTracks] = useState(new Set());
  const [newCommentText, setNewCommentText] = useState('');

  // YouTube Data API v3 Live Integration
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [loadingYoutube, setLoadingYoutube] = useState(false);

  useEffect(() => {
    const fetchYoutubeVideos = async () => {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) {
        // Fallback to static list of Phonk videos (100% public, embed-safe)
        setYoutubeVideos([
          { title: 'BASS PHONK 2026 - TOKYO SPEED SHADOWS MIX', embedId: 'oK52K8j4GqE', duration: '03:15', audioUrl: 'https://pub-c5e31b5cdafb419a86616ddde59f971a.r2.dev/Why_Not.mp3' },
          { title: 'COWBELL NIGHTS - PHONK MIX BY OG FUNK', embedId: 'rV_H7N7l75E', duration: '02:40', audioUrl: 'https://pub-c5e31b5cdafb419a86616ddde59f971a.r2.dev/Murder_In_My_Mind.mp3' },
          { title: 'GYM PHONK - 1000% BASS BOOST DRIFT BEAT', embedId: 'e2pG1y_nL-0', duration: '05:22', audioUrl: 'https://pub-c5e31b5cdafb419a86616ddde59f971a.r2.dev/Override.mp3' },
          { title: 'MEMPHIS DRIFT STREETS - OG FUNK SPECIAL', embedId: 'n4q9-gH74Gg', duration: '04:10', audioUrl: 'https://pub-c5e31b5cdafb419a86616ddde59f971a.r2.dev/Metamorphosis.mp3' }
        ]);
        return;
      }

      setLoadingYoutube(true);
      try {
        const channelRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=@ogfunk808&key=${apiKey}`
        );
        const channelData = await channelRes.json();
        
        if (channelData.items && channelData.items.length > 0) {
          const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
          
          const videosRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId=${uploadsPlaylistId}&key=${apiKey}`
          );
          const videosData = await videosRes.json();
          
          if (videosData.items) {
            const demoAudios = [
              'https://pub-c5e31b5cdafb419a86616ddde59f971a.r2.dev/Why_Not.mp3',
              'https://pub-c5e31b5cdafb419a86616ddde59f971a.r2.dev/Murder_In_My_Mind.mp3',
              'https://pub-c5e31b5cdafb419a86616ddde59f971a.r2.dev/Override.mp3',
              'https://pub-c5e31b5cdafb419a86616ddde59f971a.r2.dev/Metamorphosis.mp3'
            ];
            
            const mapped = videosData.items.map((item, idx) => {
              const snippet = item.snippet;
              return {
                title: snippet.title,
                embedId: snippet.resourceId.videoId,
                duration: 'Live Beat',
                audioUrl: demoAudios[idx % demoAudios.length]
              };
            });
            setYoutubeVideos(mapped);
          }
        } else {
          throw new Error("No channel found for handle @ogfunk808");
        }
      } catch (err) {
        console.warn('YouTube Live API failed, using fallback list:', err);
        setYoutubeVideos([
          { title: 'BASS PHONK 2026 - TOKYO SPEED SHADOWS MIX', embedId: 'oK52K8j4GqE', duration: '03:15', audioUrl: 'https://pub-c5e31b5cdafb419a86616ddde59f971a.r2.dev/Why_Not.mp3' },
          { title: 'COWBELL NIGHTS - PHONK MIX BY OG FUNK', embedId: 'rV_H7N7l75E', duration: '02:40', audioUrl: 'https://pub-c5e31b5cdafb419a86616ddde59f971a.r2.dev/Murder_In_My_Mind.mp3' },
          { title: 'GYM PHONK - 1000% BASS BOOST DRIFT BEAT', embedId: 'e2pG1y_nL-0', duration: '05:22', audioUrl: 'https://pub-c5e31b5cdafb419a86616ddde59f971a.r2.dev/Override.mp3' },
          { title: 'MEMPHIS DRIFT STREETS - OG FUNK SPECIAL', embedId: 'n4q9-gH74Gg', duration: '04:10', audioUrl: 'https://pub-c5e31b5cdafb419a86616ddde59f971a.r2.dev/Metamorphosis.mp3' }
        ]);
      } finally {
        setLoadingYoutube(false);
      }
    };

    fetchYoutubeVideos();
  }, []);

  const [uploadBpm, setUploadBpm] = useState('140');
  const [uploadDuration, setUploadDuration] = useState('180');
  const [uploadAudioUrl, setUploadAudioUrl] = useState('');
  const [uploadCoverUrl, setUploadCoverUrl] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // AI Chat Bot State
  const [aiMessage, setAiMessage] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState([
    { sender: 'ai', text: TRANSLATIONS[language].aiGreeting }
  ]);

  // Audio references
  const audioRef = useRef(null);
  const visualizerCanvasRef = useRef(null);
  const requestRef = useRef(null);

  // Sync language selection changes to AI initial message if no chat history
  useEffect(() => {
    setAiChatHistory([
      { sender: 'ai', text: TRANSLATIONS[language].aiGreeting }
    ]);
  }, [language]);

  // Sync editable profile fields when user loads
  useEffect(() => {
    if (user) {
      setEditDisplayName(user.display_name || user.username);
      setEditBio(user.bio || '');
      setEditAvatar(user.avatar_url || '/artwork/default_avatar.jpg');
    }
  }, [user]);

  // Handle window resizing to adjust Spotify-like layouts dynamically
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 820);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set default queue
  useEffect(() => {
    const playableTracks = DEMO_TRACKS.map((t, idx) => ({
      ...t,
      audioUrl: DEMO_AUDIO_URLS[idx % DEMO_AUDIO_URLS.length]
    }));
    setQueue(playableTracks);
  }, [setQueue]);

  // Handle play/pause & Web Audio engine resume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
      audioEngine.resume();
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // Sync volume with GainNode booster (clamping source element between 0-1, GainNode handles up to 10.0 / 1000%)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(volume, 1.0);
    }
    audioEngine.setVolume(volume);
  }, [volume]);

  // Sync playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  // Sync effects to Web Audio Engine
  useEffect(() => {
    audioEngine.setBassBoost(bassBoost);
  }, [bassBoost]);

  useEffect(() => {
    audioEngine.set8D(is8D);
  }, [is8D]);

  useEffect(() => {
    eqBands.forEach((val, idx) => {
      audioEngine.setEqBand(idx, val);
    });
  }, [eqBands]);

  // Initialize AudioEngine on first click
  const handleInteraction = () => {
    if (audioRef.current) {
      audioEngine.init(audioRef.current);
    }
  };

  useEffect(() => {
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const onTrackEnded = () => {
    handleNext();
  };

  const handlePlayPause = () => {
    handleInteraction();
    if (!currentTrack && queue.length > 0) {
      handlePlayTrack(queue[0], 0);
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const handlePlayTrack = (track, index) => {
    handleInteraction();
    setCurrentIndex(index);
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (queue.length === 0) return;
    const nextIdx = (currentIndex + 1) % queue.length;
    handlePlayTrack(queue[nextIdx], nextIdx);
  };

  const handlePrev = () => {
    if (queue.length === 0) return;
    const prevIdx = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    handlePlayTrack(queue[prevIdx], prevIdx);
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setProgress(val);
    }
  };

  // Perform custom username + age login submission
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginUsername.trim().length < 3) {
      setLoginError(TRANSLATIONS[language].usernameError);
      return;
    }
    if (!loginAge || isNaN(loginAge) || parseInt(loginAge) <= 0) {
      setLoginError(TRANSLATIONS[language].ageError);
      return;
    }
    setLoginError('');
    login(loginUsername.trim(), loginAge);
  };

  // Profile Save handler
  const handleProfileSave = (e) => {
    e.preventDefault();
    updateProfile({
      display_name: editDisplayName,
      bio: editBio,
      avatar_url: editAvatar
    });
  };

  // Dynamic upload song addition
  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadArtist.trim()) return;

    // Use mock values if left empty to make it immediately runnable
    const newTrackObj = {
      id: 'upload-' + Math.random().toString(36).substr(2, 9),
      title: uploadTitle.trim(),
      artist: uploadArtist.trim(),
      album: 'Self Released',
      duration: parseInt(uploadDuration) || 180,
      bpm: parseInt(uploadBpm) || 140,
      genre: uploadGenre,
      cover: uploadCoverUrl.trim() || `https://picsum.photos/300/300?random=${Math.floor(Math.random() * 100)}`,
      plays: 0,
      liked: false,
      audioUrl: uploadAudioUrl.trim() || DEMO_AUDIO_URLS[Math.floor(Math.random() * DEMO_AUDIO_URLS.length)]
    };

    addTrack(newTrackObj);
    setUploadSuccess(`"${newTrackObj.title}" published successfully! Appended to the queue.`);
    
    // Auto-play the uploaded track immediately!
    setTimeout(() => {
      const idx = queue.length; // Will be the last index after appending
      handlePlayTrack(newTrackObj, idx);
    }, 400);

    // Clear inputs
    setUploadTitle('');
    setUploadArtist('');
    setUploadAudioUrl('');
    setUploadCoverUrl('');
  };

  // Chatbot logic engine for Free AI Phonk support
  const handleSendAiMessage = () => {
    if (!aiMessage.trim()) return;

    const userText = aiMessage;
    const userMessageObj = { sender: 'user', text: userText };
    setAiChatHistory(prev => [...prev, userMessageObj]);
    setAiMessage('');

    // Process matching rules in background
    setTimeout(() => {
      const lower = userText.toLowerCase();
      let reply = '';
      
      if (lower.includes('play')) {
        const found = queue.find(t => 
          lower.includes(t.title.toLowerCase()) || 
          lower.includes(t.artist.toLowerCase())
        );

        if (found) {
          const idx = queue.indexOf(found);
          handlePlayTrack(found, idx);
          reply = `🏎️ Vibe matched! Starting playback of "${found.title}" by ${found.artist} instantly. Crank up the bass!`;
        } else {
          const randIdx = Math.floor(Math.random() * queue.length);
          const randTrack = queue[randIdx];
          handlePlayTrack(randTrack, randIdx);
          reply = `🎵 I couldn't find that exact song, so I'm playing a top-tier track: "${randTrack.title}" by ${randTrack.artist}!`;
        }
      } else if (lower.includes('bass') || lower.includes('grave') || lower.includes('басс') || lower.includes('бас')) {
        let level = 100;
        const matches = lower.match(/\d+/);
        if (matches) {
          level = Math.min(parseInt(matches[0]), 100);
        }
        setBassBoost(level);
        reply = `🔊 Boom! Bass boost configured to ${level}%. Subwoofers are officially loaded and pulsing!`;
      } else if (lower.includes('slowed') || lower.includes('slow') || lower.includes('замедлить')) {
        setSpeed(0.8);
        reply = `🌙 Slowed & Reverb mode active! Cruising speed set to 0.8x. Enjoy the dark atmosphere.`;
      } else if (lower.includes('speed') || lower.includes('скорость') || lower.includes('rate')) {
        let factor = 1.25;
        const matches = lower.match(/[\d.]+/);
        if (matches) {
          factor = parseFloat(matches[0]);
        }
        setSpeed(factor);
        reply = `⚡ Speed set to ${factor}x. Hyper-drive mode engaged.`;
      } else if (lower.includes('volume') || lower.includes('громкость') || lower.includes('ampli')) {
        let vol = 3.0; // 300%
        const matches = lower.match(/\d+/);
        if (matches) {
          vol = parseInt(matches[0]) / 100;
        }
        setVolume(vol);
        reply = `🚀 Audio volume set to ${Math.round(vol * 100)}%. Gain amplification activated via the Web Audio booster!`;
      } else if (lower.includes('recommend') || lower.includes('совет') || lower.includes('посоветуй')) {
        const randIdx = Math.floor(Math.random() * queue.length);
        const randTrack = queue[randIdx];
        reply = `🎧 I highly recommend checking out "${randTrack.title}" by ${randTrack.artist}. It features solid sub-bass. Type "play ${randTrack.title.toLowerCase()}" to listen!`;
      } else if (lower.includes('help') || lower.includes('помощь') || lower.includes('ajuda')) {
        reply = `🤖 Here is what you can ask me:\n• "play [song name]" (e.g. "play Metamorphosis")\n• "bass boost [0-100]" (e.g. "bass boost 100")\n• "slowed" (slow down playback)\n• "volume [percentage]" (e.g. "volume 300")\n• "recommend a song"`;
      } else {
        reply = `💀 Phonk engine listening! Ask me to "play [track]", "bass boost 100", "slowed", or "volume 500" for extreme loudness.`;
      }

      setAiChatHistory(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 600);
  };

  // Formatter for time display
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Filtered tracks for search
  const filteredTracks = queue.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const t = TRANSLATIONS[language];

  // ==========================================
  // RENDER: LOGIN OVERLAY SCREEN (If not authenticated)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#020202', justifyContent: 'center', alignItems: 'center', fontFamily: 'Inter, sans-serif', color: '#FFF' }}>
        <form onSubmit={handleLoginSubmit} className="glass-card spotlight-card" style={{ padding: '40px', width: '380px', borderRadius: '20px', border: '1px solid rgba(255, 0, 222, 0.25)', boxShadow: '0 10px 40px rgba(191, 0, 255, 0.15)', background: 'rgba(5, 5, 5, 0.85)', backdropFilter: 'blur(20px)', textAlign: 'center' }}>
          
          <h1 className="neon-text" style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '3px', marginBottom: '8px', color: '#00FFFF' }}>BASS PHONK</h1>
          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', marginBottom: '32px' }}>{t.loginSub}</p>

          {loginError && (
            <div style={{ padding: '10px', background: 'rgba(255, 0, 64, 0.1)', color: '#FF0040', fontSize: '12px', borderRadius: '8px', border: '1px solid rgba(255,0,64,0.2)', marginBottom: '20px', fontWeight: 'bold' }}>
              {loginError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left', marginBottom: '30px' }}>
            <div>
              <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#00FFFF', letterSpacing: '1.5px', display: 'block', marginBottom: '8px' }}>{t.usernameLabel}</label>
              <input 
                type="text" 
                placeholder="e.g. DRIFT_KING"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', outline: 'none', color: '#fff', fontSize: '13px' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#BF00FF', letterSpacing: '1.5px', display: 'block', marginBottom: '8px' }}>{t.ageLabel}</label>
              <input 
                type="number" 
                placeholder="e.g. 18"
                value={loginAge}
                onChange={(e) => setLoginAge(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', outline: 'none', color: '#fff', fontSize: '13px' }}
                required
              />
            </div>
          </div>

          <button type="submit" className="neon-btn" style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #00FFFF 0%, #BF00FF 100%)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 900, fontSize: '13px', cursor: 'pointer', boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)' }}>
            {t.enterBtn}
          </button>
        </form>
      </div>
    );
  }

  // ==========================================
  // RENDER: SECURE MAIN PAGE VIEW (Once logged in)
  // ==========================================
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#020202', color: '#FFFFFF', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HTML5 Audio Node */}
      <audio
        ref={audioRef}
        src={currentTrack ? currentTrack.audioUrl : ''}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onTrackEnded}
        crossOrigin="anonymous"
      />

      {/* 1. SIDEBAR (Collapsible drawer on mobile) */}
      <aside 
        className="glass-bar" 
        style={{ 
          width: '260px', 
          display: isMobile ? (isSidebarOpen ? 'flex' : 'none') : 'flex', 
          flexDirection: 'column', 
          borderRight: '1px solid rgba(255, 255, 255, 0.06)', 
          padding: '24px',
          background: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(20px)',
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          bottom: 90,
          left: 0,
          zIndex: 9999,
          boxShadow: isMobile ? '5px 0 25px rgba(0,0,0,0.8)' : 'none'
        }}
      >
        {/* Logo and drawer close trigger */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 className="neon-text" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: 900, letterSpacing: '2px', cursor: 'pointer', margin: 0 }} onClick={() => { setActivePage('home'); if (isMobile) setIsSidebarOpen(false); }}>
            BASS PHONK
          </h1>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} style={{ fontSize: '20px', color: 'rgba(255,255,255,0.6)', border: 'none', padding: '4px' }}>
              ✕
            </button>
          )}
        </div>
        
        {/* Sidebar Nav Buttons */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
          <button className={`neon-btn ${activePage === 'home' ? 'active' : ''}`} onClick={() => { setActivePage('home'); if (isMobile) setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activePage === 'home' ? 'rgba(191, 0, 255, 0.12)' : 'transparent', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <span style={{ fontSize: '15px' }}>🏎️</span> {t.home}
          </button>
          <button className={`neon-btn ${activePage === 'explore' ? 'active' : ''}`} onClick={() => { setActivePage('explore'); if (isMobile) setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activePage === 'explore' ? 'rgba(191, 0, 255, 0.12)' : 'transparent', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <span style={{ fontSize: '15px' }}>🔥</span> {t.explore}
          </button>
          <button className={`neon-btn ${activePage === 'visualizer' ? 'active' : ''}`} onClick={() => { setActivePage('visualizer'); if (isMobile) setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activePage === 'visualizer' ? 'rgba(191, 0, 255, 0.12)' : 'transparent', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <span style={{ fontSize: '15px' }}>📊</span> {t.visualizer}
          </button>
          <button className={`neon-btn ${activePage === 'car-mode' ? 'active' : ''}`} onClick={() => { setActivePage('car-mode'); if (isMobile) setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activePage === 'car-mode' ? 'rgba(191, 0, 255, 0.12)' : 'transparent', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <span style={{ fontSize: '15px' }}>🏁</span> {t.speedometer}
          </button>
          <button className={`neon-btn ${activePage === 'youtube' ? 'active' : ''}`} onClick={() => { setActivePage('youtube'); if (isMobile) setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activePage === 'youtube' ? 'rgba(255, 0, 0, 0.12)' : 'transparent', border: 'none', color: '#FF0000', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%', fontWeight: 'bold' }}>
            <span style={{ fontSize: '15px' }}>🎥</span> {t.youtubeVideos || 'YouTube Videos'}
          </button>
          <button className={`neon-btn ${activePage === 'wallpapers' ? 'active' : ''}`} onClick={() => { setActivePage('wallpapers'); if (isMobile) setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activePage === 'wallpapers' ? 'rgba(191, 0, 255, 0.12)' : 'transparent', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <span style={{ fontSize: '15px' }}>🖼️</span> {t.wallpapers}
          </button>
          <button className={`neon-btn ${activePage === 'settings' ? 'active' : ''}`} onClick={() => { setActivePage('settings'); if (isMobile) setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activePage === 'settings' ? 'rgba(191, 0, 255, 0.12)' : 'transparent', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <span style={{ fontSize: '15px' }}>🎛️</span> {t.equalizer}
          </button>
          <button className={`neon-btn ${activePage === 'ai-dj' ? 'active' : ''}`} onClick={() => { setActivePage('ai-dj'); if (isMobile) setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activePage === 'ai-dj' ? 'rgba(0, 255, 255, 0.12)' : 'transparent', border: 'none', color: '#00FFFF', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%', fontWeight: 'bold' }}>
            <span style={{ fontSize: '15px' }}>🤖</span> {t.aiDj}
          </button>
          <button className={`neon-btn ${activePage === 'loudly' ? 'active' : ''}`} onClick={() => { setActivePage('loudly'); if (isMobile) setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activePage === 'loudly' ? 'rgba(191, 0, 255, 0.12)' : 'transparent', border: 'none', color: '#BF00FF', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%', fontWeight: 'bold' }}>
            <span style={{ fontSize: '15px' }}>🎵</span> {t.loudly || 'Loudly AI Remix'}
          </button>
          
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />
          
          {/* User-specific tabs (Upload & Profile) */}
          <button className={`neon-btn ${activePage === 'upload' ? 'active' : ''}`} onClick={() => { setActivePage('upload'); if (isMobile) setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activePage === 'upload' ? 'rgba(0, 255, 128, 0.12)' : 'transparent', border: 'none', color: '#00FF88', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%', fontWeight: 'bold' }}>
            <span>📤</span> {t.upload}
          </button>
          <button className={`neon-btn ${activePage === 'profile' ? 'active' : ''}`} onClick={() => { setActivePage('profile'); if (isMobile) setIsSidebarOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: activePage === 'profile' ? 'rgba(191, 0, 255, 0.12)' : 'transparent', border: 'none', color: '#FFF', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <span>👤</span> {t.profile}
          </button>

          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '12px', border: 'none', color: 'rgba(255, 0, 64, 0.65)', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%', marginTop: 'auto', fontSize: '12px' }}>
            {t.logout}
          </button>
        </nav>

        {/* Footer Legal Links */}
        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.35)', display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '15px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => { setActivePage('privacy'); if (isMobile) setIsSidebarOpen(false); }}>{t.privacy}</span>
            <span style={{ cursor: 'pointer' }} onClick={() => { setActivePage('terms'); if (isMobile) setIsSidebarOpen(false); }}>{t.terms}</span>
          </div>
          <span>BASS PHONK © 2026</span>
        </div>
      </aside>
 
      {/* 2. MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto', paddingBottom: '100px' }}>
        
        {/* TOP BAR / NAVBAR (Spotify Style) */}
        <header style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 16px' : '0 40px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: 'rgba(2, 2, 2, 0.85)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isMobile && (
              <button onClick={() => setIsSidebarOpen(true)} style={{ fontSize: '22px', color: '#fff', border: 'none', background: 'transparent', padding: '4px', display: 'flex', alignItems: 'center' }}>
                ☰
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '30px', padding: '6px 16px', width: isMobile ? '160px' : '300px' }}>
              <span style={{ marginRight: '8px', color: 'rgba(255, 255, 255, 0.3)', fontSize: '13px' }}>🔍</span>
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '12px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Multi-language Selector */}
            <div style={{ position: 'relative' }}>
              <button className="neon-btn" onClick={() => setShowLanguageDropdown(!showLanguageDropdown)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', background: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
                🌐 {language.toUpperCase()}
              </button>
              {showLanguageDropdown && (
                <div style={{ position: 'absolute', right: 0, top: '40px', background: '#0e0e0e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '6px', width: '120px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', zIndex: 1001 }}>
                  <button onClick={() => { setLanguage('en'); setShowLanguageDropdown(false); }} style={{ padding: '6px 10px', width: '100%', textAlign: 'left', borderRadius: '4px', fontSize: '12px', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}>🇺🇸 English</button>
                  <button onClick={() => { setLanguage('pt'); setShowLanguageDropdown(false); }} style={{ padding: '6px 10px', width: '100%', textAlign: 'left', borderRadius: '4px', fontSize: '12px', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}>🇧🇷 Português</button>
                  <button onClick={() => { setLanguage('ru'); setShowLanguageDropdown(false); }} style={{ padding: '6px 10px', width: '100%', textAlign: 'left', borderRadius: '4px', fontSize: '12px', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}>🇷🇺 Русский</button>
                </div>
              )}
            </div>

            <button className="neon-btn" onClick={() => setActivePage('premium')} style={{ color: '#FF00DE', borderColor: '#FF00DE', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
              {t.premium}
            </button>
            
            {/* Logged in User Profile Info card */}
            <div onClick={() => setActivePage('profile')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.04)', padding: '6px 12px', borderRadius: '30px', cursor: 'pointer' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: user?.is_premium ? '#FF00DE' : '#BF00FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', overflow: 'hidden' }}>
                {user?.avatar_url && user.avatar_url !== '/artwork/default_avatar.jpg' ? (
                  <img src={user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user?.username?.substring(0, 2).toUpperCase() || 'PH'
                )}
              </div>
              <span style={{ fontSize: '12px', fontWeight: '500' }}>{user?.display_name || user?.username}</span>
            </div>
          </div>
        </header>

        {/* PAGES WRAPPER Container */}
        <div style={{ padding: isMobile ? '20px 16px' : '40px' }}>

          {/* PAGE: HOME */}
          {activePage === 'home' && (
            <div>
              {/* Featured Banner Card */}
              <div className="glass-card spotlight-card" style={{ minHeight: '220px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isMobile ? '24px' : '40px', marginBottom: '32px', background: 'linear-gradient(135deg, rgba(255, 0, 64, 0.18) 0%, rgba(191, 0, 255, 0.18) 100%)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ color: '#00FFFF', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>{t.nowStreaming}</span>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: isMobile ? '26px' : '36px', fontWeight: 900, marginBottom: '12px', margin: 0 }}>XV Drift Essentials</h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', maxWidth: '500px', marginBottom: '20px', marginTop: '6px', lineHeight: '1.4' }}>Maximize your sub-bass. The ultimate heavy cowbell phonk playlist for night rides and workout routines.</p>
                <button className="neon-btn" onClick={() => handlePlayTrack(queue[0], 0)} style={{ width: 'fit-content', background: '#FF0040', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '24px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {t.playNow}
                </button>
              </div>

              {/* Popular Genres Slider */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>{t.popularGenres}</h3>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px', WebkitOverflowScrolling: 'touch' }}>
                  {GENRES.map((g) => (
                    <button key={g.id} className="neon-btn" style={{ borderColor: g.color, color: '#fff', borderRadius: '30px', padding: '8px 18px', fontSize: '12px', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                      <span>{g.emoji}</span> {g.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid: Trending & New Releases (Flex column on mobile, double col on desktop) */}
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '32px' }}>
                {/* Trending */}
                <div style={{ flex: 1.2 }}>
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>{t.trendingSongs}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredTracks.slice(0, 5).map((track, idx) => (
                      <div key={track.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.02)' }} onClick={() => handlePlayTrack(track, idx)}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.3)', width: '18px', textAlign: 'center' }}>{idx + 1}</span>
                        <img src={track.cover} alt={track.title} style={{ width: '40px', height: '40px', borderRadius: '6px' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</h4>
                          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{track.artist}</span>
                        </div>
                        {!isMobile && (
                          <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.3)', marginRight: '16px' }}>{track.bpm} BPM</span>
                        )}
                        <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>{formatTime(track.duration)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* New Releases Grid */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>{t.newReleases}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                    {filteredTracks.slice(2, 6).map((track, idx) => (
                      <div key={track.id} className="glass-card" style={{ padding: '14px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.02)' }} onClick={() => handlePlayTrack(track, idx + 2)}>
                        <img src={track.cover} alt={track.title} style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', marginBottom: '10px' }} />
                        <h4 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</h4>
                        <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artist}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE: EXPLORE */}
          {activePage === 'explore' && (
            <div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: '900', marginBottom: '24px' }}>{t.explore}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px' }}>
                {[
                  { name: 'Gym Phonk', desc: 'Crush your personal records.', emoji: '💪', color: '#FF0040' },
                  { name: 'Gaming Phonk', desc: 'Focus playlist for drift simulations.', emoji: '🎮', color: '#BF00FF' },
                  { name: 'Night Drive', desc: 'Cruising JDM tracks for empty highways.', emoji: '🌃', color: '#00FFFF' },
                  { name: 'Car Meet', desc: 'Sub-bass heavy tracks for car meets.', emoji: '🏎️', color: '#FF00DE' },
                  { name: 'Workout Phonk', desc: '140+ BPM hype beats.', emoji: '🏋️', color: '#FFD600' },
                  { name: 'TikTok Trending', desc: 'The most popular Phonk tracks on TikTok.', emoji: '📱', color: '#00FF88' },
                ].map((playlist, idx) => (
                  <div key={idx} className="glass-card spotlight-card" style={{ padding: '20px', borderRadius: '16px', borderLeft: `4px solid ${playlist.color}`, background: 'rgba(255, 255, 255, 0.02)', cursor: 'pointer' }} onClick={() => handlePlayTrack(queue[idx % queue.length], idx % queue.length)}>
                    <div style={{ fontSize: '28px', marginBottom: '12px' }}>{playlist.emoji}</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '6px', margin: 0 }}>{playlist.name}</h3>
                    <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', margin: '4px 0 0 0', lineHeight: '1.4' }}>{playlist.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGE: SETTINGS (EQUALIZER & FX) */}
          {activePage === 'settings' && (
            <div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: '900', marginBottom: '24px' }}>{t.equalizer}</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* FX Side Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px' }}>
                  {/* Bass Booster */}
                  <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>32-bit Bass Booster</h3>
                      <span className="neon-text" style={{ color: '#FF0040', fontWeight: 'bold', fontSize: '13px' }}>{bassBoost}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={bassBoost} 
                      onChange={(e) => setBassBoost(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: '#FF0040' }}
                    />
                  </div>

                  {/* 8D Audio Toggle */}
                  <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px 0' }}>8D Spatial Audio</h3>
                      <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', margin: 0 }}>Stereo field panning</p>
                    </div>
                    <button className="neon-btn" onClick={() => setIs8D(!is8D)} style={{ background: is8D ? 'rgba(0, 255, 255, 0.15)' : 'transparent', color: '#00FFFF', borderColor: '#00FFFF', padding: '6px 16px', borderRadius: '20px', fontSize: '11px' }}>
                      {is8D ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Playback speed */}
                  <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>Playback Speed</h3>
                      <span style={{ color: '#BF00FF', fontSize: '13px', fontWeight: 'bold' }}>{speed.toFixed(2)}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2.0" 
                      step="0.05"
                      value={speed} 
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#BF00FF' }}
                    />
                  </div>
                </div>

                {/* EQ Graphic Equalizer */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', margin: 0 }}>{t.graphicEq}</h3>
                  
                  {/* Preset list */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
                    {EQ_PRESETS.map((preset) => (
                      <button key={preset.name} className="neon-btn" onClick={() => {
                        preset.values.forEach((val, idx) => setEqBand(idx, val));
                      }} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px' }}>
                        {preset.name}
                      </button>
                    ))}
                  </div>

                  {/* Sliders container (Responsive scrollable) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', height: '180px', padding: '0 8px', overflowX: 'auto', gap: '8px' }}>
                    {eqBands.map((val, idx) => {
                      const frequencies = ['32Hz', '64Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'];
                      return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', minWidth: '28px' }}>
                          <span style={{ fontSize: '10px', color: '#00FFFF', marginBottom: '6px' }}>{val > 0 ? `+${val}` : val}</span>
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                            <input 
                              type="range" 
                              min="-12" 
                              max="12" 
                              value={val}
                              onChange={(e) => setEqBand(idx, parseInt(e.target.value))}
                              style={{ 
                                WebkitAppearance: 'slider-vertical', 
                                width: '4px', 
                                height: '100%', 
                                background: 'rgba(255, 255, 255, 0.08)',
                                accentColor: '#00FFFF'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '8px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '8px' }}>{frequencies[idx]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* PAGE: VISUALIZER */}
          {activePage === 'visualizer' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: '900', margin: 0 }}>3D Visualizer</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="neon-btn" onClick={() => setVisualizerMode('spectrum')} style={{ background: visualizerMode === 'spectrum' ? 'rgba(191, 0, 255, 0.15)' : 'transparent', borderColor: '#BF00FF', fontSize: '11px', padding: '6px 12px' }}>
                    Spectrum Bars
                  </button>
                  <button className="neon-btn" onClick={() => setVisualizerMode('waveform')} style={{ background: visualizerMode === 'waveform' ? 'rgba(0, 255, 255, 0.15)' : 'transparent', borderColor: '#00FFFF', fontSize: '11px', padding: '6px 12px' }}>
                    Waveform
                  </button>
                </div>
              </div>
              <div className="glass-card" style={{ padding: '8px', borderRadius: '16px', background: '#000000', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <canvas 
                  ref={visualizerCanvasRef} 
                  width="800" 
                  height="400" 
                  style={{ width: '100%', display: 'block', borderRadius: '12px', height: isMobile ? '240px' : '400px' }}
                />
              </div>
            </div>
          )}

          {/* PAGE: WALLPAPERS */}
          {activePage === 'wallpapers' && (
            <div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: '900', marginBottom: '24px' }}>{t.wallpapers}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { title: 'Skyline GTR R34', url: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=500&q=80', cat: 'Skyline' },
                  { title: 'Supra MK4 Drift', url: 'https://images.unsplash.com/photo-1605558202076-1682229ab024?auto=format&fit=crop&w=500&q=80', cat: 'Supra' },
                  { title: 'Cyberpunk Skyline', url: 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?auto=format&fit=crop&w=500&q=80', cat: 'Cyberpunk' },
                  { title: 'Dark AE86', url: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=500&q=80', cat: 'Drift' },
                  { title: 'Tokyo Highway', url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=500&q=80', cat: 'Dark aesthetic' },
                  { title: 'Retro Neon Garage', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=500&q=80', cat: 'Cyberpunk' }
                ].map((item, idx) => (
                  <div key={idx} className="glass-card" style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <img src={item.url} alt={item.title} style={{ width: '100%', height: isMobile ? '120px' : '170px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>
                        <h4 style={{ fontSize: '12px', fontWeight: 'bold', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h4>
                        <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>{item.cat}</span>
                      </div>
                      <a href={item.url} target="_blank" rel="noreferrer" className="neon-btn" style={{ padding: '6px 0', fontSize: '11px', textDecoration: 'none', color: '#00FFFF', borderColor: '#00FFFF', borderRadius: '6px', textAlign: 'center', display: 'block' }}>
                        DOWNLOAD
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGE: CAR MODE */}
          {activePage === 'car-mode' && (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: '900', marginBottom: '30px' }}>Speedometer Dashboard</h2>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', gap: isMobile ? '30px' : '60px', alignItems: 'center' }}>
                
                {/* Visualizer speedometer gauge */}
                <div style={{ position: 'relative', width: '240px', height: '240px' }}>
                  <canvas 
                    ref={visualizerCanvasRef} 
                    width="240" 
                    height="240" 
                    style={{ width: '100%', height: '100%', display: 'block', borderRadius: '50%', background: '#050505' }}
                  />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <span style={{ fontSize: '38px', fontWeight: '900', fontFamily: 'Outfit, sans-serif', color: '#00FFFF', textShadow: '0 0 10px #00FFFF' }}>
                      {isPlaying ? '140' : '0'}
                    </span>
                    <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '2px' }}>BPM RPM</p>
                  </div>
                </div>

                {/* Big Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '280px' }}>
                  <div className="glass-card" style={{ padding: '16px 20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', textAlign: 'left' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>{t.currentSong}</h4>
                    <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentTrack ? currentTrack.title : 'No Track Selected'}</h3>
                    <p style={{ fontSize: '12px', color: '#BF00FF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentTrack ? currentTrack.artist : 'Select a song below'}</p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="neon-btn" onClick={handlePrev} style={{ flex: 1, padding: '14px 0', borderRadius: '8px', fontSize: '20px' }}>⏮</button>
                    <button className="neon-btn" onClick={handlePlayPause} style={{ flex: 1.5, padding: '14px 0', borderRadius: '8px', fontSize: '20px', background: 'rgba(0, 255, 64, 0.1)', borderColor: '#00FF88', color: '#00FF88' }}>
                      {isPlaying ? '⏸' : '▶'}
                    </button>
                    <button className="neon-btn" onClick={handleNext} style={{ flex: 1, padding: '14px 0', borderRadius: '8px', fontSize: '20px' }}>⏭</button>
                  </div>

                  <button className="neon-btn" onClick={() => setBassBoost(bassBoost >= 100 ? 50 : 100)} style={{ width: '100%', padding: '12px 0', borderRadius: '8px', fontWeight: 'bold', background: bassBoost >= 80 ? 'rgba(255, 0, 64, 0.2)' : 'transparent', color: '#FF0040', borderColor: '#FF0040', fontSize: '12px' }}>
                    {t.oneTouchBass}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* PAGE: LEGAL - PRIVACY POLICY */}
          {activePage === 'privacy' && (
            <div style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.6', fontSize: '14px' }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: '900', marginBottom: '20px' }}>{t.privacy}</h2>
              <p>Last updated: July 15, 2026</p>
              <p>At BASS PHONK, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by BASS PHONK and how we use it.</p>
              <h3>Information We Collect</h3>
              <p>The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.</p>
              <p>If you register for an Account, we may ask for your contact information, including items such as name, email address, and telephone number.</p>
              <h3>GDPR and CCPA Compliance</h3>
              <p>We make sure that your credentials and profile metadata are securely stored in Supabase under strict Row Level Security (RLS) policies. You have the right to request access to, correction of, or deletion of your personal data at any time.</p>
            </div>
          )}

          {/* PAGE: LEGAL - TERMS OF SERVICE */}
          {activePage === 'terms' && (
            <div style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.6', fontSize: '14px' }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: '900', marginBottom: '20px' }}>{t.terms}</h2>
              <p>Welcome to BASS PHONK!</p>
              <p>These terms and conditions outline the rules and regulations for the use of BASS PHONK's Website. By accessing this website or using our app we assume you accept these terms and conditions. Do not continue to use BASS PHONK if you do not agree to take all of the terms and conditions stated on this page.</p>
              <h3>User Content</h3>
              <p>Parts of this app offer an opportunity for users to post comments, playlists, and audio tracks. BASS PHONK does not filter, edit, publish or review comments or music uploads prior to their presence on the website. Comments and uploads do not reflect the views and opinions of BASS PHONK.</p>
            </div>
          )}

          {/* PAGE: PREMIUM */}
          {activePage === 'premium' && (
            <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
              <h2 className="neon-text" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '32px', fontWeight: '900', marginBottom: '12px', color: '#FF00DE', textShadow: '0 0 10px #FF00DE' }}>{t.premium}</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.65)', marginBottom: '32px', fontSize: '13px' }}>Unlock the full potential of your phonk experience.</p>
              
              <div className="glass-card spotlight-card" style={{ padding: isMobile ? '24px' : '40px', borderRadius: '20px', border: '2px solid #FF00DE', background: 'rgba(255, 255, 255, 0.02)' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>{t.vipPass}</h3>
                <span style={{ fontSize: '30px', fontWeight: '900', color: '#FFFFFF' }}>$4.99</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}> / month</span>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: '1.4' }}>
                  <li>🚫 {t.noAds}</li>
                  <li>📥 {t.unlimitedDownloads}</li>
                  <li>🔊 {t.hiResAudio}</li>
                  <li>🎛️ {t.dolbyEq}</li>
                  <li>🏎️ {t.speedometerThemes}</li>
                  <li>🖼️ {t.download4k}</li>
                </ul>

                <button className="neon-btn" style={{ width: '100%', padding: '14px', background: '#FF00DE', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px' }}>
                  {t.subscribeNow}
                </button>
              </div>
            </div>
          )}

          {/* PAGE: AI PHONK DJ CHAT PANEL */}
          {activePage === 'ai-dj' && (
            <div style={{ maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: isMobile ? 'calc(100vh - 180px)' : 'calc(100vh - 220px)' }}>
              
              {/* Header Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <span style={{ fontSize: '28px' }}>🤖</span>
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '22px', fontWeight: '900', margin: 0, color: '#00FFFF', textShadow: '0 0 10px rgba(0, 255, 255, 0.3)' }}>AI Phonk DJ</h2>
                  <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>Interactive Web-Audio control and song recommendation assistant</p>
                </div>
              </div>

              {/* Chat Message Box */}
              <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(5, 5, 5, 0.4)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
                
                {/* Scrollable messages area */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {aiChatHistory.map((msg, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        alignSelf: msg.sender === 'ai' ? 'flex-start' : 'flex-end',
                        maxWidth: '80%',
                        background: msg.sender === 'ai' ? 'rgba(255, 255, 255, 0.04)' : 'linear-gradient(135deg, #00FFFF 0%, #BF00FF 100%)',
                        border: msg.sender === 'ai' ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                        color: '#FFFFFF',
                        padding: '12px 16px',
                        borderRadius: msg.sender === 'ai' ? '14px 14px 14px 2px' : '14px 14px 2px 14px',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        boxShadow: msg.sender === 'ai' ? 'none' : '0 4px 15px rgba(0, 255, 255, 0.15)',
                        whiteSpace: 'pre-line'
                      }}
                    >
                      {msg.sender === 'ai' && <span style={{ marginRight: '6px' }}>🎧</span>}
                      {msg.text}
                    </div>
                  ))}
                </div>

                {/* Chat Input form */}
                <div style={{ display: 'flex', gap: '10px', padding: '16px', background: 'rgba(0, 0, 0, 0.6)', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <input 
                    type="text" 
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendAiMessage(); }}
                    placeholder={t.aiPlaceholder}
                    style={{ 
                      flex: 1, 
                      background: 'rgba(255, 255, 255, 0.03)', 
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#FFF', 
                      outline: 'none', 
                      padding: '12px 18px', 
                      borderRadius: '24px', 
                      fontSize: '13px'
                    }}
                  />
                  <button 
                    onClick={handleSendAiMessage} 
                    style={{ 
                      background: '#00FFFF', 
                      color: '#000', 
                      border: 'none', 
                      padding: '0 24px', 
                      borderRadius: '24px', 
                      fontWeight: 'bold', 
                      fontSize: '13px',
                      boxShadow: '0 0 10px #00FFFF',
                      cursor: 'pointer'
                    }}
                  >
                    {t.send}
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* PAGE: YOUTUBE VIDEOS */}
          {activePage === 'youtube' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: '900', margin: 0, color: '#FF0000', textShadow: '0 0 10px rgba(255,0,0,0.3)' }}>{t.youtubeVideos || 'YouTube Videos'}</h2>
                  <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)', margin: '4px 0 0 0' }}>Watch and listen to the latest videos, tutorials, and beat showcases from our official YouTube Channel.</p>
                </div>
                <a href="https://youtube.com/@ogfunk808?si=6pcmeey4q8zIfZ96" target="_blank" rel="noopener noreferrer" className="neon-btn" style={{ padding: '8px 16px', background: 'rgba(255,0,0,0.1)', borderColor: '#FF0000', color: '#FF0000', textDecoration: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                  📺 VISIT CHANNEL
                </a>
              </div>
              
              {loadingYoutube ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255, 255, 255, 0.1)', borderTopColor: '#FF0000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Syncing live YouTube channel videos...</span>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '24px' }}>
                  {youtubeVideos.map((video, idx) => (
                    <div key={idx} className="glass-card" style={{ padding: '12px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: '10px', marginBottom: '12px' }}>
                        <iframe 
                          src={`https://www.youtube.com/embed/${video.embedId}`}
                          title={video.title}
                          style={{ width: '100%', height: '100%', border: 'none' }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                          allowFullScreen
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{video.title}</h4>
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>{video.duration}</span>
                        </div>
                        <button 
                          className="neon-btn" 
                          onClick={() => {
                            const customTrack = {
                              id: `yt-${video.embedId}`,
                              title: video.title,
                              artist: 'OG FUNK (YouTube)',
                              genre: 'Phonk',
                              bpm: '140',
                              duration: 180,
                              audioUrl: video.audioUrl,
                              cover: `https://img.youtube.com/vi/${video.embedId}/mqdefault.jpg`
                            };
                            addTrack(customTrack);
                            handlePlayTrack(customTrack, queue.length);
                          }}
                          style={{ width: '100%', padding: '6px 0', fontSize: '11px', color: '#00FF88', borderColor: '#00FF88', background: 'rgba(0,255,136,0.05)', borderRadius: '6px' }}
                        >
                          🎧 PLAY IN AUDIO PLAYER
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PAGE: NOW PLAYING DETAIL (LIKES & COMMENTS) */}
          {activePage === 'now-playing' && (
            <div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: '900', marginBottom: '24px', color: '#BF00FF' }}>{t.nowPlaying || 'Now Playing'}</h2>
              {currentTrack ? (
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '40px', alignItems: 'flex-start' }}>
                  {/* Left Column: Cover art and track info */}
                  <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', width: isMobile ? '100%' : '350px', textAlign: 'center', flexShrink: 0 }}>
                    <img 
                      src={currentTrack.cover} 
                      alt={currentTrack.title} 
                      style={{ 
                        width: '100%', 
                        maxWidth: '280px', 
                        aspectRatio: '1/1', 
                        objectFit: 'cover', 
                        borderRadius: '12px', 
                        boxShadow: '0 8px 30px rgba(191, 0, 255, 0.25)', 
                        marginBottom: '20px',
                        animation: isPlaying ? 'spin 20s linear infinite' : 'none'
                      }} 
                    />
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{currentTrack.title}</h3>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px 0' }}>{currentTrack.artist}</p>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                      <span>BPM: {currentTrack.bpm || '130'}</span>
                      <span>Genre: {currentTrack.genre || 'Phonk'}</span>
                    </div>

                    {/* Like button interaction */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <button 
                        onClick={() => {
                          const trackId = currentTrack.id || '1';
                          const liked = userLikedTracks.has(trackId);
                          const nextLiked = new Set(userLikedTracks);
                          if (liked) {
                            nextLiked.delete(trackId);
                            setLikesByTrack({ ...likesByTrack, [trackId]: Math.max(0, (likesByTrack[trackId] || 0) - 1) });
                          } else {
                            nextLiked.add(trackId);
                            setLikesByTrack({ ...likesByTrack, [trackId]: (likesByTrack[trackId] || 0) + 1 });
                          }
                          setUserLikedTracks(nextLiked);
                        }}
                        style={{ 
                          background: userLikedTracks.has(currentTrack.id || '1') ? '#FF0040' : 'transparent',
                          color: userLikedTracks.has(currentTrack.id || '1') ? '#FFF' : '#FF0040',
                          border: '1px solid #FF0040',
                          padding: '10px 24px', 
                          borderRadius: '24px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: userLikedTracks.has(currentTrack.id || '1') ? '0 0 15px rgba(255, 0, 64, 0.4)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span>❤️</span> 
                        {likesByTrack[currentTrack.id || '1'] || 0} {t.likes || 'Likes'}
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Comments Section */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexDirection: 'column', height: '400px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                        💬 {t.comments || 'Comments'} ({ (commentsByTrack[currentTrack.id || '1'] || []).length })
                      </h3>
                      
                      {/* Comments list scrolling container */}
                      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px', marginBottom: '16px' }}>
                        {(commentsByTrack[currentTrack.id || '1'] || []).map((c) => (
                          <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#00FFFF' }}>@{c.user}</span>
                              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{c.timestamp}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '13px', color: '#FFF' }}>{c.text}</p>
                          </div>
                        ))}
                      </div>

                      {/* Add comment form */}
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!newCommentText.trim()) return;
                          const trackId = currentTrack.id || '1';
                          const trackComments = commentsByTrack[trackId] || [];
                          const updatedComments = [
                            ...trackComments,
                            {
                              id: Date.now(),
                              user: user?.username || 'Guest',
                              text: newCommentText.trim(),
                              timestamp: 'Just now'
                            }
                          ];
                          setCommentsByTrack({
                            ...commentsByTrack,
                            [trackId]: updatedComments
                          });
                          setNewCommentText('');
                        }}
                        style={{ display: 'flex', gap: '10px' }}
                      >
                        <input 
                          type="text" 
                          placeholder={t.commentPlaceholder || 'Write a comment...'}
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '10px 16px', color: '#FFF', outline: 'none', fontSize: '12px' }}
                        />
                        <button 
                          type="submit"
                          style={{ background: '#BF00FF', border: 'none', color: '#FFF', fontWeight: 'bold', padding: '0 20px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', boxShadow: '0 0 10px rgba(191,0,255,0.3)' }}
                        >
                          {t.postComment || 'Comment ⚡'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
                  <h3>Select a song to view lyrics, likes, and comments!</h3>
                </div>
              )}
            </div>
          )}

          {/* PAGE: LOUDLY AI REMIX */}
          {activePage === 'loudly' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: '900', margin: 0, color: '#BF00FF', textShadow: '0 0 10px rgba(191, 0, 255, 0.4)' }}>Loudly AI Remix & Soundtracks</h2>
                  <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)', margin: '4px 0 0 0' }}>Generate, customize, and remix top-tier AI soundtracks and heavy drift phonk beats on the fly.</p>
                </div>
              </div>
              <div className="glass-card" style={{ padding: '4px', borderRadius: '16px', background: '#000000', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                <iframe 
                  src="https://soundtracks.loudly.com/" 
                  title="Loudly AI Soundtracks" 
                  style={{ width: '100%', height: isMobile ? '70vh' : '75vh', border: 'none', display: 'block', borderRadius: '12px' }}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                />
              </div>
            </div>
          )}

          {/* PAGE: PROFILE (CUSTOMIZE PROFILE, TOGGLE VIP) */}
          {activePage === 'profile' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: '900', marginBottom: '24px' }}>{t.profileTitle}</h2>
              
              <form onSubmit={handleProfileSave} className="glass-card" style={{ padding: '30px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Current Avatar display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
                  <img src={editAvatar} alt="avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #BF00FF', boxShadow: '0 0 15px rgba(191,0,255,0.3)' }} onError={(e) => { e.target.src = '/artwork/default_avatar.jpg'; }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>@{user?.username}</h3>
                    <p style={{ margin: '4px 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Age: {user?.age}</p>
                    
                    {/* VIP Status Switcher */}
                    <button 
                      type="button" 
                      onClick={() => updateProfile({ is_premium: !user?.is_premium })}
                      style={{ 
                        marginTop: '8px', 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '10px', 
                        fontWeight: 'bold', 
                        border: '1px solid',
                        background: user?.is_premium ? 'rgba(255, 0, 222, 0.15)' : 'transparent',
                        borderColor: user?.is_premium ? '#FF00DE' : 'rgba(255,255,255,0.2)',
                        color: user?.is_premium ? '#FF00DE' : '#FFF'
                      }}
                    >
                      {user?.is_premium ? '★ VIP PHONK PASS ACTIVE' : 'ACTIVATE FREE VIP'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>{t.displayNameLabel}</label>
                  <input 
                    type="text" 
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', outline: 'none', color: '#FFF' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>{t.bioLabel}</label>
                  <textarea 
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows="3"
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', outline: 'none', color: '#FFF', resize: 'vertical' }}
                    placeholder="Tell Phonk Verse about yourself..."
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>{t.avatarUrlLabel}</label>
                  <input 
                    type="url" 
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', outline: 'none', color: '#FFF' }}
                  />
                </div>

                <button type="submit" className="neon-btn" style={{ width: '100%', padding: '12px', background: '#BF00FF', border: 'none', color: '#FFF', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: '0 0 10px rgba(191,0,255,0.2)' }}>
                  {t.saveProfileBtn}
                </button>

              </form>
            </div>
          )}

          {/* PAGE: UPLOAD TRACK */}
          {activePage === 'upload' && (
            <div style={{ maxWidth: '650px', margin: '0 auto' }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: '900', marginBottom: '24px' }}>{t.uploadTitle}</h2>
              
              {uploadSuccess && (
                <div style={{ padding: '12px', background: 'rgba(0, 255, 128, 0.1)', color: '#00FF88', fontSize: '13px', borderRadius: '8px', border: '1px solid rgba(0, 255, 128, 0.2)', marginBottom: '24px', fontWeight: 'bold' }}>
                  {uploadSuccess}
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="glass-card" style={{ padding: '30px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>{t.songTitleLabel}</label>
                    <input 
                      type="text" 
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="e.g. DRIFT DEMON"
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', outline: 'none', color: '#FFF' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>{t.artistLabel}</label>
                    <input 
                      type="text" 
                      value={uploadArtist}
                      onChange={(e) => setUploadArtist(e.target.value)}
                      placeholder={user?.display_name || user?.username}
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', outline: 'none', color: '#FFF' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>Genre</label>
                    <select 
                      value={uploadGenre}
                      onChange={(e) => setUploadGenre(e.target.value)}
                      style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', outline: 'none', color: '#FFF' }}
                    >
                      {GENRES.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>{t.bpmLabel}</label>
                    <input 
                      type="number" 
                      value={uploadBpm}
                      onChange={(e) => setUploadBpm(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', outline: 'none', color: '#FFF' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>{t.durationLabel}</label>
                    <input 
                      type="number" 
                      value={uploadDuration}
                      onChange={(e) => setUploadDuration(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', outline: 'none', color: '#FFF' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>{t.audioUrlLabel} (Leave empty for random demo source)</label>
                  <input 
                    type="url" 
                    value={uploadAudioUrl}
                    onChange={(e) => setUploadAudioUrl(e.target.value)}
                    placeholder="https://example.com/audio.mp3"
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', outline: 'none', color: '#FFF' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '6px' }}>{t.coverUrlLabel} (Leave empty for random art)</label>
                  <input 
                    type="url" 
                    value={uploadCoverUrl}
                    onChange={(e) => setUploadCoverUrl(e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', outline: 'none', color: '#FFF' }}
                  />
                </div>

                <button type="submit" className="neon-btn" style={{ width: '100%', padding: '14px', background: '#00FF88', border: 'none', color: '#000', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: '0 0 12px rgba(0, 255, 136, 0.25)' }}>
                  {t.publishBtn}
                </button>

              </form>
            </div>
          )}

        </div>

      </main>

      {/* 3. BOTTOM MINI PLAYER (Responsive layout alignment like Spotify) */}
      <footer 
        className="glass-bar" 
        style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          height: '90px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.06)', 
          background: 'rgba(5, 5, 5, 0.95)', 
          backdropFilter: 'blur(20px)', 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: isMobile ? '0 12px' : '0 40px'
        }}
      >
        
        {/* Left side: Track Details */}
        <div 
          onClick={() => setActivePage('now-playing')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', width: isMobile ? '35%' : '25%', minWidth: 0, cursor: 'pointer' }}
          title="Click to view likes & comments!"
        >
          {currentTrack ? (
            <>
              <img src={currentTrack.cover} alt={currentTrack.title} style={{ width: '42px', height: '42px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <h4 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentTrack.title}</h4>
                <p style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentTrack.artist}</p>
              </div>
            </>
          ) : (
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.35)' }}>{t.noSongPlaying}</span>
          )}
        </div>

        {/* Center side: Player Playback Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: isMobile ? '30%' : '45%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '24px' }}>
            <button style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '15px', cursor: 'pointer', display: isMobile ? 'none' : 'block' }} onClick={handlePrev}>⏮</button>
            <button style={{ background: '#FFFFFF', border: 'none', color: '#000000', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }} onClick={handlePlayPause}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '15px', cursor: 'pointer' }} onClick={handleNext}>⏭</button>
          </div>
          
          {/* Progress bar (Hidden on extremely small screens or made sleek) */}
          <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', width: '100%', gap: '10px' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', width: '30px', textAlign: 'right' }}>{formatTime(progress)}</span>
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={progress}
              onChange={handleSeek}
              style={{ flex: 1, height: '3px', accentColor: '#BF00FF' }}
            />
            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', width: '30px' }}>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right side: Volume Booster (Always visible & responsive!) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: isMobile ? '6px' : '16px', width: isMobile ? '35%' : '25%', minWidth: 0 }}>
          
          {/* 8D Status Indicator */}
          {is8D && !isMobile && (
            <span style={{ fontSize: '9px', background: 'rgba(0, 255, 255, 0.1)', color: '#00FFFF', padding: '3px 8px', borderRadius: '4px', border: '1px solid #00FFFF', fontWeight: 'bold', letterSpacing: '1px' }}>
              {t.spatialActive}
            </span>
          )}

          {/* Equalizer Quick Link */}
          {!isMobile && (
            <button style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '15px' }} onClick={() => setActivePage('settings')} title={t.equalizer}>
              🎛️
            </button>
          )}
          
          {/* Volume slider supporting up to 1000% gain */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}>
              <span style={{ fontSize: isMobile ? '11px' : '13px', color: volume > 1.0 ? '#FF0040' : 'rgba(255, 255, 255, 0.5)' }}>🔊</span>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="0.1"
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                style={{ 
                  width: isMobile ? '50px' : '80px', 
                  height: '4px', 
                  accentColor: volume > 1.0 ? '#FF0040' : '#00FFFF'
                }}
              />
              <span style={{ fontSize: isMobile ? '9px' : '10px', fontWeight: 'bold', color: volume > 1.0 ? '#FF0040' : '#FFF', minWidth: isMobile ? '28px' : '40px' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
            
            {volume > 1.0 && !isMobile && (
              <span style={{ fontSize: '7px', color: '#FF0040', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                {t.volumeWarning}
              </span>
            )}
          </div>

        </div>

      </footer>

    </div>
  );
}
