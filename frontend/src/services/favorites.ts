export interface LovedSong {
  id: number;
  name: string;
  artist: string;
  album: string | null;
  duration: number;
  song_url: string;
  image_url: string;
  premium?: number;
}

const STORAGE_KEY = "spotify_loved_songs";

export const getLovedSongs = (): LovedSong[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const isSongLoved = (songId: number): boolean => {
  const songs = getLovedSongs();
  return songs.some((s) => s.id === songId);
};

export const toggleLovedSong = (song: LovedSong): boolean => {
  const songs = getLovedSongs();
  const exists = songs.some((s) => s.id === song.id);
  let updated: LovedSong[];
  if (exists) {
    updated = songs.filter((s) => s.id !== song.id);
  } else {
    updated = [song, ...songs];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("loved-songs-updated", { detail: updated }));
  return !exists;
};

export const removeLovedSong = (songId: number) => {
  const songs = getLovedSongs();
  const updated = songs.filter((s) => s.id !== songId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("loved-songs-updated", { detail: updated }));
};
