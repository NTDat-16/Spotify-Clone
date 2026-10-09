import React, { useState } from "react";
import { API_ORIGIN } from "../config/api";
import { 
  X, 
  Sparkles, 
  DownloadCloud, 
  Music, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Layers, 
  Flame, 
  Globe2, 
  Mic2,
  Search
} from "lucide-react";

interface CatalogImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ImportResult {
  success: boolean;
  message: string;
  pack: string;
  imported_count: number;
  skipped_count: number;
  total_catalog_count: number;
  sample_tracks: Array<{
    id: number;
    name: string;
    artist: string;
    album: string;
    image_url: string;
  }>;
}

const PRESET_PACKS = [
  {
    id: "mega",
    title: "🚀 Siêu Kho Nhạc (MEGA PACK)",
    badge: "Khuyên Dùng",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    desc: "Nạp đồng loạt ~150 bài hát tuyển chọn: Top V-Pop, US-UK, K-Pop, Rap Việt và Ballad.",
    icon: Layers,
    color: "from-emerald-900/60 to-[#181818]",
  },
  {
    id: "vpop_top",
    title: "🇻🇳 Top 100 V-Pop Thịnh Hành",
    badge: "BXH Việt Nam",
    badgeColor: "bg-red-500/20 text-red-400 border-red-500/40",
    desc: "Các ca khúc hot nhất trên Apple Music Việt Nam hiện nay với hình ảnh bìa 600x600 HD.",
    icon: Flame,
    color: "from-red-950/60 to-[#181818]",
  },
  {
    id: "usuk_top",
    title: "🌎 Top Hits US-UK & Billboard",
    badge: "Quốc Tế",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    desc: "Taylor Swift, Bruno Mars, Lady Gaga, The Weeknd, Billie Eilish, Sabrina Carpenter...",
    icon: Globe2,
    color: "from-blue-950/60 to-[#181818]",
  },
  {
    id: "rap_viet",
    title: "⚡ Rap Việt & Gen Z Bắt Tai",
    badge: "Xu Hướng",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    desc: "Low G, tlinh, Wren Evans, MCK, HIEUTHUHAI, Double2T, 24k.Right...",
    icon: Mic2,
    color: "from-amber-950/60 to-[#181818]",
  },
  {
    id: "kpop_top",
    title: "🇰🇷 K-Pop Trending Chart",
    badge: "K-Pop",
    badgeColor: "bg-pink-500/20 text-pink-400 border-pink-500/40",
    desc: "BLACKPINK, NewJeans, BTS, aespa, BABYMONSTER, IVE...",
    icon: Music,
    color: "from-pink-950/60 to-[#181818]",
  },
  {
    id: "sontung_jack",
    title: "🎤 Tuyển Tập Sơn Tùng & Jack J97",
    badge: "Top Artists",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    desc: "Các bài hit lớn của Sơn Tùng M-TP và Jack J97 chuẩn tác giả & album.",
    icon: Sparkles,
    color: "from-purple-950/60 to-[#181818]",
  },
];

export const CatalogImportModal: React.FC<CatalogImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedPack, setSelectedPack] = useState<string>("mega");
  const [customQuery, setCustomQuery] = useState<string>("");
  const [limit, setLimit] = useState<number>(50);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async (packId?: string) => {
    const packToRun = packId || selectedPack;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let endpoint = `${API_ORIGIN}/api/external/import-catalog/`;
      let payload: any = { limit };

      if (customQuery.trim()) {
        payload.query = customQuery.trim();
      } else if (packToRun === "vpop_top") {
        endpoint = `${API_ORIGIN}/api/external/import-trending/`;
        payload = { chart: "vn", limit };
      } else if (packToRun === "usuk_top") {
        endpoint = `${API_ORIGIN}/api/external/import-trending/`;
        payload = { chart: "global", limit };
      } else if (packToRun === "kpop_top") {
        endpoint = `${API_ORIGIN}/api/external/import-trending/`;
        payload = { chart: "kpop", limit };
      } else if (packToRun === "mega") {
        endpoint = `${API_ORIGIN}/api/external/import-trending/`;
        payload = { chart: "all", limit };
      } else {
        payload.pack = packToRun;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể nạp bài hát từ API ngoài.");
      }

      setResult({
        ...data,
        sample_tracks: data.sample_tracks || data.tracks || []
      });
      // Notify other components (like Home, AllSongs) to refresh their lists
      window.dispatchEvent(new Event("catalog-updated"));
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Import error:", err);
      setError(err.message || "Đã xảy ra lỗi khi tải nhạc.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-[#181818] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-[#202020]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30 flex-shrink-0">
              <DownloadCloud size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>Nạp Bài Hát Thịnh Hành</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1DB954] text-black font-extrabold uppercase">
                  Top Charts
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 truncate sm:whitespace-normal">
                Bảng xếp hạng Top Thịnh Hành chính thức (Apple Music & Billboard). Đĩa đơn (Single) sẽ để trống mục Album.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1">
          {/* Result Banner */}
          {result && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 space-y-3">
              <div className="flex items-center gap-2 font-bold text-base text-emerald-400">
                <CheckCircle2 size={20} />
                <span>{result.message}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-black/30">
                  <div className="text-lg font-black text-white">{result.imported_count}</div>
                  <div className="text-gray-400">Bài mới thêm</div>
                </div>
                <div className="p-2 rounded-lg bg-black/30">
                  <div className="text-lg font-black text-gray-300">{result.skipped_count}</div>
                  <div className="text-gray-400">Đã có sẵn</div>
                </div>
                <div className="p-2 rounded-lg bg-black/30">
                  <div className="text-lg font-black text-[#1DB954]">{result.total_catalog_count}</div>
                  <div className="text-gray-400">Tổng kho nhạc</div>
                </div>
              </div>

              {result.sample_tracks && result.sample_tracks.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-semibold text-gray-400 mb-2">Một số bài hát vừa nạp:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {result.sample_tracks.slice(0, 6).map((tr) => (
                      <div key={tr.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-black/40 text-xs">
                        <img
                          src={tr.image_url || "/default-cover.png"}
                          alt={tr.name}
                          className="w-8 h-8 rounded object-cover flex-shrink-0"
                          onError={(e) => { e.currentTarget.src = "/default-cover.png"; }}
                        />
                        <div className="truncate">
                          <div className="font-semibold text-white truncate">{tr.name}</div>
                          <div className="text-gray-400 truncate">{tr.artist}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
              <div className="text-xs">{error}</div>
            </div>
          )}

          {/* Option 1: Preset Packs */}
          <div>
            <div className="text-sm font-bold text-gray-200 mb-3 flex items-center justify-between">
              <span>Chọn danh mục nhạc có sẵn:</span>
              <span className="text-xs text-gray-400 font-normal">Tự động lấy bảng xếp hạng mới nhất</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_PACKS.map((pack) => {
                const Icon = pack.icon;
                const isSelected = selectedPack === pack.id && !customQuery;
                return (
                  <div
                    key={pack.id}
                    onClick={() => {
                      setSelectedPack(pack.id);
                      setCustomQuery("");
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between bg-gradient-to-br ${pack.color} ${
                      isSelected
                        ? "border-[#1DB954] shadow-lg shadow-green-950/40 ring-1 ring-[#1DB954]"
                        : "border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 font-bold text-sm text-white">
                          <Icon size={16} className="text-white" />
                          <span>{pack.title}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${pack.badgeColor}`}>
                          {pack.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{pack.desc}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Khoảng 30-50 bài</span>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPack(pack.id);
                          setCustomQuery("");
                          handleImport(pack.id);
                        }}
                        className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#1DB954] text-black hover:bg-[#1ed760] transition"
                      >
                        Nạp ngay
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Option 2: Custom Search Term */}
          <div className="pt-2 border-t border-white/10">
            <label className="text-sm font-bold text-gray-200 block mb-2">
              Hoặc nhập ca sĩ / ban nhạc bạn yêu thích:
            </label>
            <div className="relative flex items-center">
              <Search size={18} className="absolute left-3.5 text-gray-400" />
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="VD: Taylor Swift, Đen Vâu, Vũ., Ariana Grande, Maroon 5..."
                className="w-full pl-10 pr-28 py-2.5 bg-[#252525] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#1DB954]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customQuery.trim()) {
                    handleImport();
                  }
                }}
              />
              <button
                type="button"
                disabled={isLoading || !customQuery.trim()}
                onClick={() => handleImport()}
                className="absolute right-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1DB954] text-black hover:bg-[#1ed760] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Tìm & Nạp
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-white/10 bg-[#202020] flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {isLoading ? (
              <span className="flex items-center gap-2 text-amber-400">
                <Loader2 size={16} className="animate-spin" />
                Đang kết nối API và đồng bộ CSDL Neon...
              </span>
            ) : (
              <span>Bài hát mới nạp sẽ tự động phát bằng trình phát YouTube IFrame.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition"
            >
              Đóng
            </button>
            <button
              disabled={isLoading}
              onClick={() => handleImport()}
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#1DB954] text-black hover:bg-[#1ed760] hover:scale-105 active:scale-95 disabled:opacity-50 transition shadow-lg flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang nạp...</span>
                </>
              ) : (
                <>
                  <DownloadCloud size={14} />
                  <span>{customQuery ? `Nạp "${customQuery}"` : "Bắt Đầu Nạp"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogImportModal;
