export interface Song {
  id: number;
  title: string;
  artist: string;
  image_url: string;
  audio_url: string;
  duration: string;
}

export interface Album {
  id: number;
  title: string;
  artist: string;
  description: string;
  image_url: string;
  release_year: number;
  songs: Song[];
}
