import { Album, Song } from "./../types/index";
import { create } from "zustand";
import axios from "axios";

interface MusicStore {
  songs: Song[];
  albums: Album[];
  currentAlbum: Album | null;
  currentSong: Song | null;
  loading: boolean;
  error: string | null;

  fetchAlbums: () => Promise<void>;
  fetchAlbumById: (id: number) => Promise<void>;
  fetchSongs: () => Promise<void>;
  fetchSongById: (id: number) => Promise<void>;
  addSongToAlbum: (albumId: number, songId: number) => Promise<void>;
  removeSongFromAlbum: (albumId: number, songId: number) => Promise<void>;
  updateAlbum: (albumId: number, data: Partial<Album>) => Promise<void>;
  deleteAlbum: (albumId: number) => Promise<void>;
}

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

export const useMusicStore = create<MusicStore>((set) => ({
  songs: [],
  albums: [],
  currentAlbum: null,
  currentSong: null,
  loading: false,
  error: null,

  fetchAlbums: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("albums/");
      set({ albums: response.data, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch albums", loading: false });
      console.error("Error fetching albums:", error);
    }
  },

  fetchAlbumById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`albums/${id}/`);
      set({ currentAlbum: response.data, loading: false });
    } catch (error) {
      set({ error: `Failed to fetch album ${id}`, loading: false });
      console.error(`Error fetching album ${id}:`, error);
    }
  },

  fetchSongs: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("songs/");
      set({ songs: response.data, loading: false });
    } catch (error) {
      set({ error: "Failed to fetch songs", loading: false });
      console.error("Error fetching songs:", error);
    }
  },

  fetchSongById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`songs/${id}/`);
      set({ currentSong: response.data, loading: false });
    } catch (error) {
      set({ error: `Failed to fetch song ${id}`, loading: false });
      console.error(`Error fetching song ${id}:`, error);
    }
  },

  addSongToAlbum: async (albumId: number, songId: number) => {
    set({ loading: true, error: null });
    try {
      await api.post(`albums/${albumId}/`, { song_id: songId });
      set((state) => {
        const song = state.songs.find((s) => s.id === songId);
        if (!song || !state.currentAlbum || state.currentAlbum.id !== albumId)
          return state;
        return {
          currentAlbum: {
            ...state.currentAlbum,
            songs: state.currentAlbum.songs.some((s) => s.id === songId)
              ? state.currentAlbum.songs
              : [...state.currentAlbum.songs, song],
          },
        };
      });
      set({ loading: false });
    } catch (error) {
      set({ error: "Failed to add song to album", loading: false });
      console.error("Error adding song to album:", error);
    }
  },

  removeSongFromAlbum: async (albumId: number, songId: number) => {
    set({ loading: true, error: null });
    try {
      await api.post(`albums/${albumId}/`, { song_id: songId });
      set((state) =>
        state.currentAlbum && state.currentAlbum.id === albumId
          ? {
              currentAlbum: {
                ...state.currentAlbum,
                songs: state.currentAlbum.songs.filter((s) => s.id !== songId),
              },
            }
          : state
      );
      set({ loading: false });
    } catch (error) {
      set({ error: "Failed to remove song from album", loading: false });
      console.error("Error removing song from album:", error);
    }
  },

  updateAlbum: async (albumId: number, data: Partial<Album>) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`albums/${albumId}/`, data);
      set((state) =>
        state.currentAlbum && state.currentAlbum.id === albumId
          ? { currentAlbum: { ...state.currentAlbum, ...response.data } }
          : state
      );
      set({ loading: false });
    } catch (error) {
      set({ error: "Failed to update album", loading: false });
      console.error("Error updating album:", error);
    }
  },

  deleteAlbum: async (albumId: number) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`albums/${albumId}/`);
      set((state) => ({
        albums: state.albums.filter((album) => album.id !== albumId),
        currentAlbum:
          state.currentAlbum?.id === albumId ? null : state.currentAlbum,
      }));
      set({ loading: false });
    } catch (error) {
      set({ error: "Failed to delete album", loading: false });
      console.error("Error deleting album:", error);
    }
  },
}));
