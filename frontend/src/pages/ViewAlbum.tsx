import React, { useState, useEffect } from "react";
import { API_ORIGIN } from "../config/api";
import { PlayIcon, Clock, MoreHorizontal, Download } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAudio, isPremiumSong, isUserPremiumAccount } from "../AudioContext";
import { getAudioUrl, getImageUrl } from "../utils/media";

interface Song {
    id: number;
    name: string;
    artist_name: string;
    duration: number;
    premium: number;
    song_url: string;
    album_img: string;
}

interface Album {
    id: number;
    name: string;
    artist_name: string;
    cover_image: string;
    songs: Song[];
    created_at: string;
    relatedAlbums: {
        name: string;
        songs: string[];
    }[];
}

const ViewAlbum: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [albumData, setAlbumData] = useState<Album | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { handlePlaySong, setSongList } = useAudio();

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    useEffect(() => {
        const fetchAlbumData = async () => {
            try {
                setLoading(true);
                
                const albumResponse = await fetch(`${API_ORIGIN}/api/albums/${id}/`);
                if (!albumResponse.ok) {
                    throw new Error('Failed to fetch album data');
                }
                const albumJson = await albumResponse.json();
                
                const songsResponse = await fetch(`${API_ORIGIN}/api/songs/album/${id}/`);
                if (!songsResponse.ok) {
                    throw new Error('Chưa có bài hát');
                }
                const songsJson = await songsResponse.json();
                console.log("Songs from API (ViewAlbum):", songsJson); // Debug API response
                
                const transformedData: Album = {
                    id: albumJson.id,
                    name: albumJson.name,
                    artist_name: albumJson.artist_name || "Various Artists",
                    cover_image: albumJson.cover_image || "",
                    created_at: albumJson.created_at,
                    songs: songsJson.map((song: any) => ({
                        id: song.id,
                        name: song.name,
                        artist_name: song.artist_name || "Unknown Artist",
                        duration: song.duration || 1,
                        premium: song.premium || 0,
                        song_url: song.song_url || "",
                        image_url: song.album_img
                            ? `/uploads/albums/${song.album_img}`
                            : "/default-cover.png",
                    })),
                    relatedAlbums: albumJson.relatedAlbums || []
                };
                
                setAlbumData(transformedData);
                const mappedSongs = transformedData.songs.map(song => ({
                    id: song.id,
                    name: song.name,
                    artist: song.artist_name,
                    album: transformedData.name,
                    duration: song.duration || 1,
                    song_url: song.song_url,
                    image_url: song.album_img ? `/uploads/albums/${song.album_img}` : (transformedData.cover_image ? `/uploads/albums/${transformedData.cover_image}` : '/default-cover.png'),
                    premium: song.premium
                }));
                setSongList(mappedSongs);
                console.log("Set songList in ViewAlbum:", mappedSongs); // Debug songList
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
                console.error("Error fetching album data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAlbumData();
    }, [id, setSongList]);

    const handleDownload = (song: Song) => {
        if (isPremiumSong(song) && !isUserPremiumAccount()) {
            alert('Bài hát này chỉ dành cho tài khoản Premium!');
            return;
        }
        const songUrl = getAudioUrl(song.song_url);
        const xhr = new XMLHttpRequest();
        xhr.open("GET", songUrl, true);
        xhr.responseType = "blob";
        xhr.onload = () => {
            const blob = xhr.response;
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `${song.name}.mp3`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        };
        xhr.onerror = () => {
            alert("Không thể tải bài hát này.");
        };
        xhr.send();
    };

    const handlePlayAll = () => {
        if (albumData?.songs && albumData.songs.length > 0) {
            const isUserPremium = isUserPremiumAccount();
            const formattedSongs = albumData.songs.map(song => ({
                id: song.id,
                name: song.name,
                artist: song.artist_name,
                album: albumData.name,
                duration: song.duration,
                song_url: song.song_url,
                image_url: getImageUrl(song.album_img || albumData.cover_image),
                premium: song.premium
            }));
            setSongList(formattedSongs);

            const firstPlayableSong = isUserPremium
                ? formattedSongs[0]
                : formattedSongs.find(song => !isPremiumSong(song));
            if (firstPlayableSong) {
                handlePlaySong(firstPlayableSong);
            } else {
                alert('Tất cả bài hát trong album này đều yêu cầu Premium!');
            }
        }
    };

    if (loading) {
        return (
            <div className="bg-[#1a1a1a] text-white min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading album data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#1a1a1a] text-white min-h-screen flex items-center justify-center">
                <div className="text-red-500 text-xl">Error: {error}</div>
            </div>
        );
    }

    if (!albumData) {
        return (
            <div className="bg-[#1a1a1a] text-white min-h-screen flex items-center justify-center">
                <div className="text-xl">No album data found</div>
            </div>
        );
    }

    return (
        <div className="bg-[#1a1a1a] text-white min-h-screen pb-32">
            <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-black p-4 sm:p-8 flex flex-col md:flex-row items-center md:items-end gap-5 md:gap-8 shadow-2xl text-center md:text-left">
                <div className="w-36 h-36 sm:w-52 sm:h-52 md:w-64 md:h-64 bg-[#282828] rounded-xl overflow-hidden shadow-2xl transform transition-all hover:scale-105 flex-shrink-0">
                    <img
                        src={getImageUrl(albumData.cover_image)} 
                        alt={albumData.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = "/default-cover.png";
                        }}
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <span className="uppercase text-[11px] sm:text-xs font-bold tracking-widest text-[#1DB954] mb-1 sm:mb-2 inline-block">
                        Album Chính Thức
                    </span>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold mb-2 sm:mb-3 tracking-tight truncate">{albumData.name}</h1>
                    <p className="text-gray-300 text-xs sm:text-sm mb-1 sm:mb-2">
                        Ngày phát hành: {new Date(albumData.created_at).toLocaleDateString('vi-VN')} • {albumData.songs?.length || 0} bài hát
                    </p>
                    <p className="text-white text-base sm:text-lg font-semibold">{albumData.artist_name}</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-3 sm:p-6">
                <div className="flex items-center space-x-4 mb-6">
                    <button 
                        className="bg-green-500 hover:bg-green-600 rounded-full p-3.5 sm:p-4 transition-colors duration-200 shadow-lg hover:scale-105"
                        onClick={handlePlayAll}
                        title="Phát tất cả album"
                    >
                        <PlayIcon size={24} fill="black" />
                    </button>
                    <button className="text-gray-400 hover:text-white transition-colors duration-200">
                        <MoreHorizontal size={24} />
                    </button>
                </div>

                <div className="bg-[#282828]/50 rounded-xl p-3 sm:p-4 border border-[#333]">
                    <div className="grid grid-cols-12 gap-2 sm:gap-4 text-gray-400 text-xs sm:text-sm border-b border-gray-700 pb-3 mb-3">
                        <div className="col-span-1 font-semibold text-center">#</div>
                        <div className="col-span-8 sm:col-span-5 font-semibold">Title</div>
                        <div className="hidden sm:block sm:col-span-3 font-semibold">Album</div>
                        <div className="col-span-2 font-semibold flex justify-end">Duration</div>
                        <div className="col-span-1 font-semibold text-right"></div>
                    </div>

                    {albumData.songs.map((song, index) => {
                        const isSongPremium = isPremiumSong(song);
                        const isUserPremium = isUserPremiumAccount();
                        return (
                            <div
                                key={song.id}
                                className="grid grid-cols-12 gap-2 sm:gap-4 items-center py-2.5 sm:py-3 hover:bg-[#383838] rounded-lg px-2 sm:px-3 transition-colors duration-200 cursor-pointer group"
                                onClick={() => {
                                    if (isSongPremium && !isUserPremium) {
                                        alert("Bài hát này chỉ dành cho tài khoản Premium! Vui lòng nâng cấp tài khoản để thưởng thức.");
                                        return;
                                    }
                                    const formattedSongs = albumData.songs.map(s => ({
                                        id: s.id,
                                        name: s.name,
                                        artist: s.artist_name,
                                        album: albumData.name,
                                        duration: s.duration,
                                        song_url: s.song_url,
                                        image_url: getImageUrl(s.album_img || albumData.cover_image),
                                        premium: s.premium
                                    }));
                                    setSongList(formattedSongs);

                                    handlePlaySong({
                                        id: song.id,
                                        name: song.name,
                                        artist: song.artist_name,
                                        album: albumData.name,
                                        duration: song.duration,
                                        song_url: song.song_url,
                                        image_url: getImageUrl(song.album_img || albumData.cover_image),
                                        premium: song.premium
                                    });
                                }}
                            >
                                <div className="col-span-1 text-gray-400 text-xs sm:text-sm text-center">{index + 1}</div>
                                <div className="col-span-8 sm:col-span-5 flex items-center gap-2.5 sm:gap-3 min-w-0">
                                    <img
                                        src={getImageUrl(song.album_img || albumData.cover_image)}
                                        alt={song.name}
                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                                        onError={(e) => {
                                            e.currentTarget.src = "/default-cover.png";
                                        }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-white truncate text-xs sm:text-sm group-hover:text-[#1DB954] transition">{song.name}</p>
                                            {isSongPremium && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white flex-shrink-0">
                                                    VIP
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] sm:text-xs text-gray-400 truncate mt-0.5">{song.artist_name}</p>
                                    </div>
                                </div>
                                <div className="hidden sm:block sm:col-span-3 text-xs sm:text-sm text-gray-400 truncate">
                                    {albumData.relatedAlbums[0]?.name || albumData.name}
                                </div>
                                <div className="col-span-2 text-xs sm:text-sm text-gray-400 flex justify-end tabular-nums font-mono">
                                    {formatDuration(song.duration)}
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <button
                                        className={`p-1.5 rounded-lg transition-colors duration-200 ${
                                            isSongPremium && !isUserPremium
                                                ? 'text-gray-600 cursor-not-allowed' 
                                                : 'text-gray-400 hover:text-white hover:bg-[#444]'
                                        }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(song);
                                        }}
                                        disabled={isSongPremium && !isUserPremium}
                                        title="Tải về"
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ViewAlbum;