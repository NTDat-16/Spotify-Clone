import {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { getAudioUrl } from "./utils/media";
import { getYouTubeVideoForSong } from "./services/youtube";

export type Song = {
  id: number | string;
  name: string;
  artist: string;
  album: string | null;
  duration: number;
  song_url: string;
  image_url: string;
  premium?: number | boolean | string;
  source?: "local" | "spotify" | "youtube";
  spotify_id?: string;
  youtubeVideoId?: string;
};

export const isPremiumSong = (song?: Partial<Song> | null): boolean => {
  if (!song) return false;
  return (
    Number(song.premium) === 1 ||
    song.premium === true ||
    (song as any).premium === "1"
  );
};

export const isUserPremiumAccount = (): boolean => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return false;
    const user = JSON.parse(raw);
    return Boolean(
      user?.isPremium === true ||
      Number(user?.isPremium) === 1 ||
      user?.isPremium === "true" ||
      user?.is_premium === true ||
      Number(user?.is_premium) === 1
    );
  } catch {
    return false;
  }
};

type AudioContextType = {
  currentSong: Song | null;
  handlePlaySong: (song: Song, forceMvMode?: boolean) => Promise<void>;
  isPlaying: boolean;
  togglePlayPause: () => Promise<void>;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  currentTime: number;
  duration: number;
  setSongList: (songs: Song[]) => void;
  songList: Song[];
  playbackHistory: Song[];
  // Quản lý YouTube IFrame & chế độ MV
  playbackSource: "audio" | "youtube";
  activeVideoId: string | null;
  isMvMode: boolean;
  toggleMvMode: () => void;
  setMvMode: (open: boolean) => void;
  isLoadingExternal: boolean;
  volume: number;
  setVolume: (v: number) => void;
  registerYtPlayer: (player: any) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (dur: number) => void;
  setIsPlaying: (playing: boolean) => void;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [songList, setSongList] = useState<Song[]>([]);
  const [playbackHistory, setPlaybackHistory] = useState<Song[]>([]);

  // Nguồn phát hiện tại: "audio" (HTML5 audio local) hoặc "youtube" (YouTube IFrame API)
  const [playbackSource, setPlaybackSource] = useState<"audio" | "youtube">("audio");
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isMvMode, setIsMvMode] = useState<boolean>(false);
  const [isLoadingExternal, setIsLoadingExternal] = useState<boolean>(false);

  const [volume, setVolumeState] = useState<number>(() => {
    return Number(localStorage.getItem("volume")) || 0.75;
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const ytPlayerRef = useRef<any>(null);

  // Synchronization refs to eliminate stale closures and recursive listener loops
  const playbackSourceRef = useRef<"audio" | "youtube">("audio");
  const currentSongRef = useRef<Song | null>(null);
  const isTransitioningRef = useRef<boolean>(false);

  // Keep refs in sync with state
  playbackSourceRef.current = playbackSource;
  currentSongRef.current = currentSong;

  const registerYtPlayer = useCallback((player: any) => {
    ytPlayerRef.current = player;
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    localStorage.setItem("volume", clamped.toString());

    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === "function") {
      ytPlayerRef.current.setVolume(Math.round(clamped * 100));
    }
  }, []);

  // Helper to safely stop HTML5 audio without triggering invalid-source error events
  const stopAudioElementSafely = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.pause();
      if (audio.hasAttribute("src")) {
        audio.removeAttribute("src");
        audio.load();
      }
    } catch {
      // ignore
    }
  }, []);

  // Centralized YouTube playback dispatcher
  const handlePlayViaYouTube = useCallback(async (song: Song, forceMvMode: boolean = false) => {
    // 1. Immediately switch playbackSource ref to 'youtube' so any audio element events are ignored
    playbackSourceRef.current = "youtube";
    setPlaybackSource("youtube");
    currentSongRef.current = song;
    setCurrentSong(song);
    setPlaybackHistory((prev) => [...prev, song].slice(-10));
    setCurrentTime(0);
    setDuration(song.duration || 210);

    // 2. Safely stop and detach HTML5 audio
    stopAudioElementSafely();

    if (forceMvMode) {
      setIsMvMode(true);
    }

    // 3. Resolve YouTube Video ID
    setIsLoadingExternal(true);
    try {
      let vid = song.youtubeVideoId;
      if (!vid) {
        const ytResult = await getYouTubeVideoForSong(song.name, song.artist);
        vid = ytResult?.video_id;
      }
      setIsLoadingExternal(false);

      if (vid) {
        setActiveVideoId(vid);
        setIsPlaying(true);
        if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
          ytPlayerRef.current.loadVideoById({
            videoId: vid,
            startSeconds: 0,
          });
          ytPlayerRef.current.setVolume(Math.round(volume * 100));
          ytPlayerRef.current.playVideo();
        }
      } else {
        alert(`Không tìm thấy luồng phát YouTube cho bài hát "${song.name}".`);
        setIsPlaying(false);
      }
    } catch (err) {
      console.error("Lỗi khi phát nhạc từ YouTube API:", err);
      setIsLoadingExternal(false);
      setIsPlaying(false);
    } finally {
      isTransitioningRef.current = false;
    }
  }, [volume, stopAudioElementSafely]);

  // Handle play song (HTML5 local audio or YouTube stream)
  const handlePlaySong = useCallback(async (song: Song, forceMvMode: boolean = false) => {
    const isUserPremium = isUserPremiumAccount();
    if (isPremiumSong(song) && !isUserPremium) {
      alert("Bài hát này chỉ dành cho tài khoản Premium! Vui lòng nâng cấp tài khoản để thưởng thức trọn vẹn.");
      if (isPlaying) {
        if (playbackSourceRef.current === "audio" && audioRef.current) {
          audioRef.current.pause();
        } else if (playbackSourceRef.current === "youtube" && ytPlayerRef.current) {
          ytPlayerRef.current.pauseVideo();
        }
        setIsPlaying(false);
      }
      return;
    }

    // Check if song can be played via HTML5 audio
    const hasValidLocalAudio = Boolean(
      song.song_url &&
      (song.song_url.startsWith("http://") ||
       song.song_url.startsWith("https://") ||
       song.source === "local" ||
       (!song.source && (song.song_url.endsWith(".mp3") || song.song_url.endsWith(".mp4"))))
    );

    const isExternalStream = forceMvMode || song.source === "spotify" || song.source === "youtube" || !hasValidLocalAudio;

    // Trường hợp 1: Phát qua YouTube IFrame API (cho Spotify, YouTube, không có audio local, hoặc MV)
    if (isExternalStream) {
      await handlePlayViaYouTube(song, forceMvMode);
      return;
    }

    // Trường hợp 2: Phát qua HTML5 audio
    if (!audioRef.current) {
      console.error("Audio element not found");
      return;
    }

    // Tắt YouTube nếu đang phát
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
      try {
        ytPlayerRef.current.pauseVideo();
      } catch {
        // ignore
      }
    }

    playbackSourceRef.current = "audio";
    setPlaybackSource("audio");
    const audio = audioRef.current;
    const audioUrl = getAudioUrl(song.song_url);

    try {
      if (String(currentSongRef.current?.id) === String(song.id) && playbackSourceRef.current === "audio") {
        if (isPlaying) {
          audio.pause();
          setIsPlaying(false);
        } else {
          await audio.play();
          setIsPlaying(true);
        }
      } else {
        audio.pause();
        currentSongRef.current = song;
        setCurrentSong(song);
        setPlaybackHistory((prev) => [...prev, song].slice(-10));
        audio.src = audioUrl;
        audio.volume = volume;
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.warn("Lỗi phát audio local HTML5, tự động chuyển sang YouTube:", error);
      if (!isTransitioningRef.current) {
        isTransitioningRef.current = true;
        await handlePlayViaYouTube(song, false);
      }
    }
  }, [isPlaying, volume, handlePlayViaYouTube]);

  const playNext = useCallback(() => {
    if (!currentSongRef.current || songList.length === 0) return;

    const isUserPremium = isUserPremiumAccount();

    let currentIndex = songList.findIndex((song) => String(song.id) === String(currentSongRef.current?.id));
    if (currentIndex === -1) currentIndex = 0;

    let nextIndex = (currentIndex + 1) % songList.length;
    let attempts = 0;
    while (attempts < songList.length) {
      const nextSong = songList[nextIndex];
      if (!isPremiumSong(nextSong) || isUserPremium) {
        handlePlaySong(nextSong);
        return;
      }
      currentIndex = nextIndex;
      nextIndex = (currentIndex + 1) % songList.length;
      attempts++;
    }
    alert("Không có bài hát tiếp theo phù hợp để phát.");
  }, [songList, handlePlaySong]);

  const playPrevious = useCallback(() => {
    if (!currentSongRef.current || songList.length === 0) return;
    const isUserPremium = isUserPremiumAccount();

    let currentIndex = songList.findIndex((song) => String(song.id) === String(currentSongRef.current?.id));
    if (currentIndex === -1) currentIndex = 0;

    let prevIndex = (currentIndex - 1 + songList.length) % songList.length;
    let attempts = 0;
    while (attempts < songList.length) {
      const prevSong = songList[prevIndex];
      if (!isPremiumSong(prevSong) || isUserPremium) {
        handlePlaySong(prevSong);
        return;
      }
      currentIndex = prevIndex;
      prevIndex = (currentIndex - 1 + songList.length) % songList.length;
      attempts++;
    }
    alert("Không có bài hát trước đó phù hợp để phát.");
  }, [songList, handlePlaySong]);

  // Gắn các sự kiện HTML5 audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (playbackSourceRef.current === "audio" && audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };
    const updateDuration = () => {
      if (playbackSourceRef.current === "audio" && audioRef.current && Number.isFinite(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    };
    const handleEnded = () => {
      if (playbackSourceRef.current === "audio") {
        playNext();
      }
    };
    const handleAudioError = (e: Event) => {
      // Bỏ qua nếu đã chuyển sang luồng YouTube hoặc đang trong quá trình chuyển
      if (playbackSourceRef.current !== "audio" || isTransitioningRef.current) return;
      const curAudio = audioRef.current;
      // Bỏ qua lỗi rỗng do reset src hoặc dọn dẹp audio element
      if (!curAudio || !curAudio.currentSrc || curAudio.src === "" || curAudio.src === window.location.href) {
        return;
      }

      console.warn("Audio HTML5 error, tự động chuyển sang luồng YouTube:", e);
      const songToFallback = currentSongRef.current;
      if (songToFallback) {
        isTransitioningRef.current = true;
        handlePlayViaYouTube(songToFallback, false);
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleAudioError);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleAudioError);
    };
  }, [playNext, handlePlayViaYouTube]);

  const togglePlayPause = async () => {
    if (!currentSongRef.current) return;

    const isUserPremium = isUserPremiumAccount();
    if (isPremiumSong(currentSongRef.current) && !isUserPremium) {
      alert("Bài hát này chỉ dành cho tài khoản Premium! Vui lòng nâng cấp tài khoản để thưởng thức trọn vẹn.");
      return;
    }

    try {
      if (playbackSourceRef.current === "youtube") {
        if (isPlaying) {
          ytPlayerRef.current?.pauseVideo();
          setIsPlaying(false);
        } else {
          ytPlayerRef.current?.playVideo();
          setIsPlaying(true);
        }
      } else {
        if (!audioRef.current) return;
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error);
      setIsPlaying(false);
    }
  };

  const seek = (time: number) => {
    if (!Number.isFinite(time)) return;

    if (playbackSourceRef.current === "youtube") {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
        ytPlayerRef.current.seekTo(time, true);
        setCurrentTime(time);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
    }
  };

  const toggleMvMode = async () => {
    if (!isMvMode) {
      if (!currentSongRef.current) {
        alert("Vui lòng chọn một bài hát để xem MV.");
        return;
      }

      if (playbackSourceRef.current === "youtube" && activeVideoId) {
        setIsMvMode(true);
        return;
      }

      // Nếu đang phát nhạc local, chuyển sang MV YouTube
      await handlePlayViaYouTube(currentSongRef.current, true);
    } else {
      setIsMvMode(false);
    }
  };

  const setMvMode = (open: boolean) => {
    setIsMvMode(open);
  };

  return (
    <AudioContext.Provider
      value={{
        currentSong,
        handlePlaySong,
        isPlaying,
        togglePlayPause,
        playNext,
        playPrevious,
        seek,
        currentTime,
        duration,
        setSongList,
        songList,
        playbackHistory,
        playbackSource,
        activeVideoId,
        isMvMode,
        toggleMvMode,
        setMvMode,
        isLoadingExternal,
        volume,
        setVolume,
        registerYtPlayer,
        setCurrentTime,
        setDuration,
        setIsPlaying,
      }}
    >
      <audio ref={audioRef} />
      {children}
    </AudioContext.Provider>
  );
};