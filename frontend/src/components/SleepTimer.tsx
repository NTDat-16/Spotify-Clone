// frontend/src/components/SleepTimer.tsx
import React, { useState, useEffect } from "react";
import { XIcon } from "lucide-react";
import { useAudio } from "../AudioContext";

interface SleepTimerProps {
  onClose: () => void;
  onTimerSet: (minutes: number) => void; // Callback để thông báo thời gian hẹn giờ
  onTimerStop: () => void; // Callback khi dừng hẹn giờ
}

const SleepTimer: React.FC<SleepTimerProps> = ({ onClose, onTimerSet, onTimerStop }) => {
  const { togglePlayPause } = useAudio();
  const [time, setTime] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  // Xử lý khi kích hoạt hẹn giờ
  const handleActivate = () => {
    setIsActive(true);
    onTimerSet(time); // Gửi thời gian hẹn giờ lên MusicPlayer
    const id = setTimeout(() => {
      togglePlayPause(); // Tạm dừng phát nhạc
      setIsActive(false);
      setTimerId(null);
      onTimerStop(); // Thông báo dừng hẹn giờ
      onClose(); // Đóng popup
    }, time * 60 * 1000); // Chuyển phút thành mili giây
    setTimerId(id);
  };

  // Xử lý khi dừng hẹn giờ
  const handleStop = () => {
    if (timerId) {
      clearTimeout(timerId);
      setTimerId(null);
    }
    setIsActive(false);
    onTimerStop(); // Thông báo dừng hẹn giờ
  };

  // Dọn dẹp khi component unmount
  useEffect(() => {
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [timerId]);

  return (
    <div className="fixed top-16 right-6 w-72 bg-[#181818] border border-[#282828] rounded-lg shadow-lg p-4 z-50 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Hẹn giờ tắt nhạc</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <XIcon size={18} />
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Tắt nhạc sau
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={time}
              onChange={(e) => setTime(parseInt(e.target.value))}
              className="w-full"
              disabled={isActive}
            />
            <span className="text-sm font-medium w-12">{time} phút</span>
          </div>
        </div>
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-600 rounded-lg hover:bg-[#282828] text-gray-300"
          >
            Hủy
          </button>
          {isActive ? (
            <button
              onClick={handleStop}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Dừng hẹn giờ
            </button>
          ) : (
            <button
              onClick={handleActivate}
              className="px-4 py-2 text-sm bg-[#1DB954] text-black rounded-lg hover:bg-[#1ED760]"
            >
              Bắt đầu
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SleepTimer;