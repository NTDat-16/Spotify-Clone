# # backend/app/serializers.py
# from rest_framework import serializers
# from .models import User, Song, Playlist, PlaylistSong, Album, Artist

# class UserSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = '__all__'

# class SongSerializer(serializers.ModelSerializer):
#     artist_name = serializers.CharField(source='artist.name', read_only=True)
#     album_name = serializers.CharField(source='album.name', read_only=True, allow_null=True)

#     class Meta:
#         model = Song
#         fields = ['id', 'name', 'artist', 'artist_name', 'album', 'album_name', 'duration', 'song_url', 'status']

# class PlaylistSongSerializer(serializers.ModelSerializer):
#     song = SongSerializer(read_only=True)

#     class Meta:
#         model = PlaylistSong
#         fields = ['id', 'playlist', 'song']

# class PlaylistSerializer(serializers.ModelSerializer):
#     user = UserSerializer(read_only=True)  # Chỉ dùng để serialize
#     user_id = serializers.PrimaryKeyRelatedField(
#         queryset=User.objects.all(), source='user', write_only=True
#     )  # Dùng để deserialize (nhận user_id từ request)
#     songs = serializers.SerializerMethodField()

#     def get_songs(self, obj):
#         playlist_songs = PlaylistSong.objects.filter(playlist=obj)
#         return PlaylistSongSerializer(playlist_songs, many=True).data

#     class Meta:
#         model = Playlist
#         fields = ['id', 'name', 'user', 'user_id', 'created_at', 'cover_image', 'description', 'status', 'songs']

# class AlbumsSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Album
#         fields = '__all__'

# class ArtistSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Artist
#         fields = '__all__'

from rest_framework import serializers
from .models import User, Song, Playlist, PlaylistSong, Album, Artist, Message

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class SongSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source='artist.name', read_only=True)
    album_name = serializers.CharField(source='album.name', read_only=True, allow_null=True)
    album_img = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    def get_album_img(self, obj):
        # Nếu bài hát có cover_image riêng (đối với đĩa đơn/single không thuộc album)
        if hasattr(obj, 'cover_image') and obj.cover_image:
            return obj.cover_image
        # Nếu bài hát thuộc album và album có ảnh
        if obj.album and obj.album.cover_image:
            return obj.album.cover_image
        return None

    def get_image_url(self, obj):
        img = self.get_album_img(obj)
        return img if img else "/default-cover.png"

    class Meta:
        model = Song
        fields = ['id', 'name', 'artist', 'artist_name', 'album', 'album_name', 'album_img', 'image_url', 'cover_image', 'duration', 'song_url', 'status', 'premium', 'play_count', 'lyrics']

class PlaylistSongSerializer(serializers.ModelSerializer):
    song = SongSerializer(read_only=True)
    class Meta:
        model = PlaylistSong
        fields = ['id', 'playlist', 'song']

class PlaylistSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='user', write_only=True)
    songs = serializers.SerializerMethodField()
    def get_songs(self, obj):
        playlist_songs = PlaylistSong.objects.filter(playlist=obj)
        return PlaylistSongSerializer(playlist_songs, many=True).data
    class Meta:
        model = Playlist
        fields = ['id', 'name', 'user', 'user_id', 'created_at', 'cover_image', 'description', 'status', 'songs']

class AlbumsSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source='artist.name', read_only=True)
    class Meta:
        model = Album
        fields = '__all__'

class ArtistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = '__all__'

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'