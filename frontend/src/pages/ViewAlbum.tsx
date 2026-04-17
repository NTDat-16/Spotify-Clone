import React, { useState, useEffect } from "react";
import { PlayIcon, Clock, MoreHorizontal, Download } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAudio } from "../AudioContext";

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
                
                const albumResponse = await fetch(`http://localhost:8000/api/albums/${id}/`);
                if (!albumResponse.ok) {
                    throw new Error('Failed to fetch album data');
                }
                const albumJson = await albumResponse.json();
                
                const songsResponse = await fetch(`http://localhost:8000/api/songs/album/${id}/`);
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
                    image_url: song.album_img ? `/Uploads/albums/${song.album_img}` : (transformedData.cover_image ? `/Uploads/albums/${transformedData.cover_image}` : '/default-cover.png'),
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
        if (song.premium === 1) {
            alert('Bài hát này chỉ dành cho Premium!');
            return;
        }
        alert(`Đang tải ${song.name}...`);
        // Thêm logic tải file thực tế tại đây
    };

    const handlePlayAll = () => {
        if (albumData?.songs && albumData.songs.length > 0) {
            const firstNonPremiumSong = albumData.songs.find(song => song.premium !== 1);
            if (firstNonPremiumSong) {
                handlePlaySong({
                    id: firstNonPremiumSong.id,
                    name: firstNonPremiumSong.name,
                    artist: firstNonPremiumSong.artist_name,
                    album: albumData.name,
                    duration: firstNonPremiumSong.duration,
                    song_url: firstNonPremiumSong.song_url,
                    image_url: firstNonPremiumSong.album_img ? `/Uploads/albums/${firstNonPremiumSong.album_img}` : (albumData.cover_image ? `/Uploads/albums/${albumData.cover_image}` : '/default-cover.png'),
                    premium: firstNonPremiumSong.premium
                });
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
        <div className="bg-[#1a1a1a] text-white min-h-screen">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 flex items-center space-x-8 shadow-lg">
                <div className="w-64 h-64 bg-[#282828] rounded-lg overflow-hidden shadow-xl transform transition-all hover:scale-105">
                    <img
                        src={albumData.cover_image ? `/Uploads/albums/${albumData.cover_image}` : '/default-cover.png'} 
                        alt={albumData.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="flex-1">
                    <h1 className="text-5xl font-bold mb-3">{albumData.name}</h1>
                    <p className="text-gray-200 text-lg mb-2">
                        Release Date: {new Date(albumData.created_at).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="text-gray-200 text-xl font-medium">{albumData.artist_name}</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                <div className="flex items-center space-x-4 mb-8">
                    <button 
                        className="bg-green-500 hover:bg-green-600 rounded-full p-4 transition-colors duration-200"
                        onClick={handlePlayAll}
                    >
                        <PlayIcon size={28} fill="black" />
                    </button>
                    <button className="text-gray-400 hover:text-white transition-colors duration-200">
                        <MoreHorizontal size={24} />
                    </button>
                </div>

                <div className="bg-[#282828]/50 rounded-lg p-4">
                    <div className="grid grid-cols-12 gap-4 text-gray-400 text-sm border-b border-gray-700 pb-3 mb-4">
                        <div className="col-span-1 font-semibold">#</div>
                        <div className="col-span-5 font-semibold">Title</div>
                        <div className="col-span-3 font-semibold">Album</div>
                        <div className="col-span-2 font-semibold flex justify-end">Duration</div>
                        <div className="col-span-1 font-semibold"></div>
                    </div>

                    {albumData.songs.map((song, index) => (
                        <div
                            key={song.id}
                            className="grid grid-cols-12 gap-4 items-center py-3 hover:bg-[#383838] rounded-md px-3 transition-colors duration-200 cursor-pointer group"
                            onClick={() => handlePlaySong({
                                id: song.id,
                                name: song.name,
                                artist: song.artist_name,
                                album: albumData.name,
                                duration: song.duration,
                                song_url: song.song_url,
                                image_url: song.album_img ? `/Uploads/albums/${song.album_img}` : (albumData.cover_image ? `/Uploads/albums/${albumData.cover_image}` : '/default-cover.png'),
                                premium: song.premium
                            })}
                        >
                            <div className="col-span-1 text-gray-400">{index + 1}</div>
                            <div className="col-span-5 flex items-center gap-3">
                                <img
                                    src={song.album_img ? `/Uploads/albums/${song.album_img}` : (albumData.cover_image ? `/Uploads/albums/${albumData.cover_image}` : '/default-cover.png')}
                                    alt={song.name}
                                    className="w-12 h-12 rounded-md object-cover"
                                />
                                <div>
                                    <div className="flex items-center gap-3">
                                        <p className="font-medium text-white">{song.name}</p>
                                        {song.premium === 1 && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                                                Premium
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1">{song.artist_name}</p>
                                </div>
                            </div>
                            <div className="col-span-3 text-gray-400">
                                {albumData.relatedAlbums[0]?.name || albumData.name}
                            </div>
                            <div className="col-span-2 text-gray-400 flex justify-end">
                                {formatDuration(song.duration)}
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <button
                                    className={`p-2 rounded-full transition-colors duration-200 ${
                                        song.premium === 1 
                                            ? 'text-gray-600 cursor-not-allowed' 
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(song);
                                    }}
                                    disabled={song.premium === 1}
                                >
                                    <Download size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ViewAlbum;