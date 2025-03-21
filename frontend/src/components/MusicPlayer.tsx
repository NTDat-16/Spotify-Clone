import React, { useState, useEffect, useRef } from "react";
import {
  PlayIcon,
  PauseIcon,
  SkipBackIcon,
  SkipForwardIcon,
  RepeatIcon,
  ShuffleIcon,
  VolumeIcon,
} from "lucide-react";
import { Song } from "../types";

// interface Song {
//   cover: string;
//   title: string;
//   artist: string;
//   audioUrl: string; // Thêm URL của file audio
// }

interface MusicPlayerProps {
  currentSong: Song;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ currentSong }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.75); // Volume từ 0 đến 1
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Khởi tạo audio khi component mount hoặc currentSong thay đổi
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = currentSong.audio_url;
      audioRef.current.volume = volume;

      audioRef.current.addEventListener("loadedmetadata", () => {
        setDuration(audioRef.current?.duration || 0);
      });

      audioRef.current.addEventListener("timeupdate", updateProgress);

      if (isPlaying) {
        audioRef.current.play();
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener("timeupdate", updateProgress);
      }
    };
  }, [currentSong]);

  // Cập nhật tiến độ phát
  const updateProgress = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      setCurrentTime(current);
      setProgress((current / audioRef.current.duration) * 100);
    }
  };

  // Xử lý play/pause
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Xử lý thay đổi volume
  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const newVolume = Math.max(0, Math.min(1, clickPosition));
      setVolume(newVolume);
      audioRef.current.volume = newVolume;
    }
  };

  // Xử lý tua bài hát
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const newTime = clickPosition * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(clickPosition * 100);
    }
  };

  // Format thời gian
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  };

  return (
    <div className="h-20 bg-white border-t border-gray-200 px-4 flex items-center">
      <div className="w-1/4 flex items-center gap-3">
        <img
          src={currentSong.image_url}
          alt={currentSong.title}
          className="h-12 w-12 rounded object-cover"
        />
        <div>
          <h4 className="text-sm font-medium">{currentSong.title}</h4>
          <p className="text-xs text-gray-500">{currentSong.artist}</p>
        </div>
      </div>
      <div className="w-2/4 flex flex-col items-center">
        <div className="flex items-center gap-4">
          <button className="text-gray-500 hover:text-gray-700">
            <ShuffleIcon size={18} />
          </button>
          <button className="text-gray-500 hover:text-gray-700">
            <SkipBackIcon size={20} />
          </button>
          <button
            className="h-8 w-8 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700"
            onClick={togglePlay}
          >
            {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
          </button>
          <button className="text-gray-500 hover:text-gray-700">
            <SkipForwardIcon size={20} />
          </button>
          <button className="text-gray-500 hover:text-gray-700">
            <RepeatIcon size={18} />
          </button>
        </div>
        <div className="w-full mt-2 flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {formatTime(currentTime)}
          </span>
          <div
            className="flex-1 h-1 bg-gray-200 rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gray-800 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{formatTime(duration)}</span>
        </div>
      </div>
      <div className="w-1/4 flex justify-end items-center gap-2">
        <VolumeIcon size={18} className="text-gray-500" />
        <div
          className="w-24 h-1 bg-gray-200 rounded-full cursor-pointer"
          onClick={handleVolumeChange}
        >
          <div
            className="h-full bg-gray-800 rounded-full"
            style={{ width: `${volume * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
