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

  // Gắn các sự kiện HTML5 audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (playbackSource === "audio") {
        setCurrentTime(audio.currentTime);
      }
    };
    const updateDuration = () => {
      if (playbackSource === "audio" && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      if (playbackSource === "audio") {
        playNext();
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", (e) => {
      if (playbackSource === "audio") {
        console.error("Audio error:", e);
        setIsPlaying(false);
      }
    });

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", () => {});
    };
  }, [currentSong, songList, playbackSource]);

  const playNext = useCallback(() => {
    if (!currentSong || songList.length === 0) return;

    const isUserPremium = isUserPremiumAccount();

    let currentIndex = songList.findIndex((song) => String(song.id) === String(currentSong.id));
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
  }, [currentSong, songList]);

  const playPrevious = useCallback(() => {
    if (!currentSong || songList.length === 0) return;
    const isUserPremium = isUserPremiumAccount();

    let currentIndex = songList.findIndex((song) => String(song.id) === String(currentSong.id));
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
  }, [currentSong, songList]);

  const handlePlaySong = async (song: Song, forceMvMode: boolean = false) => {
    const isUserPremium = isUserPremiumAccount();
    if (isPremiumSong(song) && !isUserPremium) {
      alert("Bài hát này chỉ dành cho tài khoản Premium! Vui lòng nâng cấp tài khoản để thưởng thức trọn vẹn.");
      if (isPlaying) {
        if (playbackSource === "audio" && audioRef.current) {
          audioRef.current.pause();
        } else if (playbackSource === "youtube" && ytPlayerRef.current) {
          ytPlayerRef.current.pauseVideo();
        }
        setIsPlaying(false);
      }
      return;
    }

    const isSpotifyOrExternal = song.source === "spotify" || !song.song_url;

    // Trường hợp 1: Phát qua YouTube IFrame API (Cho bài hát Spotify hoặc khi forceMvMode)
    if (isSpotifyOrExternal || forceMvMode) {
      try {
        // Tắt HTML5 audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }

        setPlaybackSource("youtube");
        setCurrentSong(song);
        setPlaybackHistory((prev) => [...prev, song].slice(-10));
        setCurrentTime(0);
        setDuration(song.duration || 210);

        if (forceMvMode) {
          setIsMvMode(true);
        }

        // Tìm YouTube Video ID
        setIsLoadingExternal(true);
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
          alert(`Không tìm thấy video / luồng phát YouTube cho bài hát "${song.name}".`);
          setIsPlaying(false);
        }
      } catch (err) {
        console.error("Lỗi khi phát nhạc từ YouTube API:", err);
        setIsLoadingExternal(false);
        setIsPlaying(false);
      }
      return;
    }

    // Trường hợp 2: Bài hát local trong thư viện (HTML5 audio)
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

    setPlaybackSource("audio");
    const audio = audioRef.current;
    const audioUrl = getAudioUrl(song.song_url);

    try {
      if (String(currentSong?.id) === String(song.id) && playbackSource === "audio") {
        if (isPlaying) {
          audio.pause();
          setIsPlaying(false);
        } else {
          await audio.play();
          setIsPlaying(true);
        }
      } else {
        audio.pause();
        setCurrentSong(song);
        setPlaybackHistory((prev) => [...prev, song].slice(-10));
        audio.src = audioUrl;
        audio.volume = volume;
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    }
  };

  const togglePlayPause = async () => {
    if (!currentSong) return;

    const isUserPremium = isUserPremiumAccount();
    if (isPremiumSong(currentSong) && !isUserPremium) {
      alert("Bài hát này chỉ dành cho tài khoản Premium! Vui lòng nâng cấp tài khoản để thưởng thức trọn vẹn.");
      return;
    }

    try {
      if (playbackSource === "youtube") {
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

    if (playbackSource === "youtube") {
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
    // Nếu đang tắt chế độ MV và muốn mở
    if (!isMvMode) {
      if (!currentSong) {
        alert("Vui lòng chọn một bài hát để xem MV.");
        return;
      }

      // Nếu đang phát qua YouTube thì chỉ cần mở dock
      if (playbackSource === "youtube" && activeVideoId) {
        setIsMvMode(true);
        return;
      }

      // Nếu đang phát nhạc local, tìm YouTube video và chuyển sang MV
      setIsLoadingExternal(true);
      const ytResult = await getYouTubeVideoForSong(currentSong.name, currentSong.artist);
      setIsLoadingExternal(false);

      if (ytResult?.video_id) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setPlaybackSource("youtube");
        setActiveVideoId(ytResult.video_id);
        setIsMvMode(true);
        setIsPlaying(true);

        if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
          ytPlayerRef.current.loadVideoById({
            videoId: ytResult.video_id,
            startSeconds: Math.floor(currentTime),
          });
          ytPlayerRef.current.setVolume(Math.round(volume * 100));
          ytPlayerRef.current.playVideo();
        }
      } else {
        alert(`Không tìm thấy MV chính thức cho "${currentSong.name}" trên YouTube.`);
      }
    } else {
      // Đang mở -> Thu nhỏ MV về chế độ phát ngầm
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