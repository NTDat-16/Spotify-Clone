import { PlayIcon, Clock3Icon, TrashIcon } from "lucide-react";
const LovedSongs = ({
  setCurrentSong
}) => {
  const lovedSongs = [{
    id: 1,
    title: "Dreams",
    artist: "Fleetwood Mac",
    album: "Rumours",
    duration: "4:17",
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
  }, {
    id: 2,
    title: "Billie Jean",
    artist: "Michael Jackson",
    album: "Thriller",
    duration: "4:54",
    cover: "https://images.unsplash.com/photo-1598387993211-5c4c0fda1248?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=776&q=80"
  }, {
    id: 3,
    title: "Bohemian Rhapsody",
    artist: "Queen",
    album: "A Night at the Opera",
    duration: "5:55",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
  }];
  const handlePlaySong = song => {
    setCurrentSong({
      title: song.title,
      artist: song.artist,
      cover: song.cover
    });
  };
  return <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Loved Songs</h1>
          <p className="text-gray-600">{lovedSongs.length} songs</p>
        </div>
        <button className="px-6 py-2 bg-gray-800 text-white rounded-full flex items-center gap-2 hover:bg-gray-700">
          <PlayIcon size={18} />
          Play All
        </button>
      </div>
      <div className="bg-white rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                #
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Album
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
                <Clock3Icon size={14} />
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lovedSongs.map((song, index) => <tr key={song.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handlePlaySong(song)}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img src={song.cover} alt={song.title} className="h-10 w-10 rounded object-cover mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {song.title}
                      </div>
                      <div className="text-sm text-gray-500">{song.artist}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {song.album}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {song.duration}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-gray-400 hover:text-red-500" onClick={e => {
                e.stopPropagation();
                // In a real app, this would remove the song from loved songs
              }}>
                    <TrashIcon size={18} />
                  </button>
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
};
export default LovedSongs;