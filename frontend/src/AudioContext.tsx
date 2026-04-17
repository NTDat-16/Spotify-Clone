import { createContext, useContext, useState, useRef, ReactNode, useEffect } from "react";

type Song = {
  id: number;
  name: string;
  artist: string;
  album: string | null;
  duration: number;
  song_url: string;
  image_url: string;
  premium: number;
};

type AudioContextType = {
  currentSong: Song | null;
  handlePlaySong: (song: Song) => void;
  isPlaying: boolean;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  currentTime: number;
  duration: number;
  setSongList: (songs: Song[]) => void;
  songList: Song[];
  playbackHistory: Song[];
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
  const audioRef = useRef<HTMLAudioElement>(null);

  // Gắn các sự kiện audio để cập nhật trạng thái
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => playNext();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', (e) => {
      console.error("Audio error:", e);
      setIsPlaying(false);
    });

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', () => {});
    };
  }, [currentSong, songList]);

  const playNext = () => {
    if (!currentSong || songList.length === 0) return;

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isUserPremium = user?.isPremium === true;

    let currentIndex = songList.findIndex((song) => song.id === currentSong.id);
    let nextIndex = (currentIndex + 1) % songList.length;
    let attempts = 0;
    while (attempts < songList.length) {
      const nextSong = songList[nextIndex];
      if (nextSong.premium !== 1 || isUserPremium) {
        handlePlaySong(nextSong);
        return;
      }
      currentIndex = nextIndex;
      nextIndex = (currentIndex + 1) % songList.length;
      attempts++;
    }
    alert("Không có bài hát không premium nào để phát.");
  };

  const handlePlaySong = async (song: Song) => {
    if (!audioRef.current) {
      console.error("Audio element not found");
      alert("Không tìm thấy trình phát audio.");
      return;
    }

    if (song.premium === 1) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const isUserPremium = user?.isPremium === true;
      if (!isUserPremium) {
        alert("Bạn cần tài khoản Premium để phát bài hát này.");
        return;
      }
    }

    const audio = audioRef.current;
    const audioUrl = `http://127.0.0.1:8000/audio/${song.song_url}`;
    console.log("Playing audio URL:", audioUrl); // Debug URL

    try {
      if (currentSong?.id === song.id) {
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
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current || !currentSong) return;

    if (currentSong.premium === 1) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const isUserPremium = user?.isPremium === true;
      if (!isUserPremium) {
        alert("Bạn cần tài khoản Premium để phát bài hát này.");
        return;
      }
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error);
      setIsPlaying(false);
      alert("Lỗi khi chuyển trạng thái phát. Vui lòng thử lại.");
    }
  };

  const playPrevious = () => {
    if (!currentSong || songList.length === 0) return;
    const currentIndex = songList.findIndex((song) => song.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + songList.length) % songList.length;
    handlePlaySong(songList[prevIndex]);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
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
      }}
    >
      <audio ref={audioRef} />
      {children}
    </AudioContext.Provider>
  );
};