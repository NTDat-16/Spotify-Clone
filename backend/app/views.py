import os
import time
from django.conf import settings
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from .models import Song, Playlist, PlaylistSong, Album, Artist, User, Message
from django.db.models import Q
from .serializers import (
    SongSerializer,
    PlaylistSerializer,
    PlaylistSongSerializer,
    AlbumsSerializer,
    ArtistSerializer,
    UserSerializer,
    MessageSerializer,
)

# Lấy danh sách tất cả bài hát
@api_view(['GET'])
def get_songs(request):
    search_query = request.GET.get('search', '').strip()
    songs = Song.objects.all()
    if search_query:
        songs = songs.filter(
            Q(name__icontains=search_query) |
            Q(artist__name__icontains=search_query)
        )
    serializer = SongSerializer(songs, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_songs_by_album(request, album_id):
    # Lọc các bài hát có album_id khớp với album_id truyền vào
    songs = Song.objects.filter(album_id=album_id)
    
    if not songs.exists():
        return Response({'message': 'Không có bài hát nào thuộc album này'}, status=status.HTTP_404_NOT_FOUND)
    
    # Serialize danh sách bài hát
    serializer = SongSerializer(songs, many=True)
    
    return Response(serializer.data, status=status.HTTP_200_OK)

# Thêm bài hát mới
@api_view(['POST'])
def add_song(request):
    name = request.data.get('name')
    artist_id = request.data.get('artist')
    album_id = request.data.get('album')
    duration = request.data.get('duration', 1)
    status_value = request.data.get('status', 1)
    song_url = request.FILES.get('song')
    premium = request.data.get('premium')
    lyrics = request.data.get('lyrics')

    if not all([name, artist_id, duration, song_url]):
        return Response({'error': 'Thiếu thông tin bắt buộc'}, status=status.HTTP_400_BAD_REQUEST)

    file_name = song_url.name
    song_dir = os.path.join(settings.BASE_DIR, 'audio')

    try:
        os.makedirs(song_dir, exist_ok=True)
    except Exception as e:
        return Response({'error': f'Lỗi tạo thư mục audio: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if not os.access(song_dir, os.W_OK):
        return Response({'error': 'Không có quyền ghi vào thư mục audio'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    file_path = os.path.join(song_dir, file_name)
    if os.path.exists(file_path):
        base, ext = os.path.splitext(file_name)
        file_name = f"{base}_{int(time.time())}{ext}"
        file_path = os.path.join(song_dir, file_name)

    try:
        with open(file_path, 'wb+') as destination:
            for chunk in song_url.chunks():
                destination.write(chunk)
    except Exception as e:
        return Response({'error': f'Lỗi khi lưu file nhạc: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        artist = Artist.objects.get(id=artist_id)
        album = Album.objects.get(id=album_id) if album_id else None

        song = Song.objects.create(
            name=name,
            artist=artist,
            album=album,
            duration=duration,
            song_url=file_name,
            status=status_value,
            premium=premium,
            lyrics=lyrics
        )
    except Artist.DoesNotExist:
        return Response({'error': 'Artist không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
    except Album.DoesNotExist:
        return Response({'error': 'Album không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Lỗi tạo bài hát: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    serializer = SongSerializer(song)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

# Sửa thông tin bài hát
@api_view(['PUT'])
def update_song(request, song_id):
    name = request.data.get('name')
    artist_id = request.data.get('artist')
    album_id = request.data.get('album')
    duration = request.data.get('duration', 1)
    status_value = request.data.get('status', 1)
    premium = request.data.get('premium')
    song_url = request.FILES.get('song')
    lyrics = request.data.get('lyrics')

    if not all([name, artist_id, duration]):
        return Response({'error': 'Thiếu thông tin bắt buộc'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        premium = int(premium)
        if premium not in [0, 1]:
            return Response({'error': 'Giá trị premium phải là 0 hoặc 1'}, status=status.HTTP_400_BAD_REQUEST)
    except (TypeError, ValueError):
        return Response({'error': 'Giá trị premium không hợp lệ'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        song = Song.objects.get(id=song_id)
    except Song.DoesNotExist:
        return Response({'error': 'Bài hát không tồn tại'}, status=status.HTTP_404_NOT_FOUND)

    # Xử lý file âm thanh mới (nếu có)
    file_name = None
    if song_url:
        file_name = song_url.name
        song_dir = os.path.join(settings.BASE_DIR, 'audio')

        try:
            os.makedirs(song_dir, exist_ok=True)
        except Exception as e:
            return Response({'error': f'Lỗi tạo thư mục audio: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not os.access(song_dir, os.W_OK):
            return Response({'error': 'Không có quyền ghi vào thư mục audio'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Xóa file âm thanh cũ nếu tồn tại
        if song.song_url:
            old_file_path = os.path.join(song_dir, song.song_url)
            if os.path.exists(old_file_path):
                try:
                    os.remove(old_file_path)
                except Exception as e:
                    return Response({'error': f'Lỗi xóa file âm thanh cũ: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Kiểm tra và tạo tên file mới
        file_path = os.path.join(song_dir, file_name)
        if os.path.exists(file_path):
            base, ext = os.path.splitext(file_name)
            file_name = f"{base}_{int(time.time())}{ext}"
            file_path = os.path.join(song_dir, file_name)

        # Lưu file âm thanh mới
        try:
            with open(file_path, 'wb+') as destination:
                for chunk in song_url.chunks():
                    destination.write(chunk)
        except Exception as e:
            return Response({'error': f'Lỗi khi lưu file nhạc: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        artist = Artist.objects.get(id=artist_id)
        album = Album.objects.get(id=album_id) if album_id else None

        # Cập nhật thông tin bài hát
        song.name = name
        song.artist = artist
        song.album = album
        song.duration = duration
        song.status = status_value
        song.premium = premium
        song.lyrics=lyrics
        if file_name:
            song.song_url = file_name
        song.save()

    except Artist.DoesNotExist:
        return Response({'error': 'Artist không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
    except Album.DoesNotExist:
        return Response({'error': 'Album không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Lỗi cập nhật bài hát: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    serializer = SongSerializer(song)
    return Response(serializer.data, status=status.HTTP_200_OK)

#Lấy thông tin của một bài hát bằng id
@api_view(['GET'])
def get_song_by_id(request, song_id):
    try:
        # Tìm bài hát theo id
        song = Song.objects.get(id=song_id)
    except Song.DoesNotExist:
        return Response({'message': 'Không tìm thấy bài hát'}, status=status.HTTP_404_NOT_FOUND)
    
    # Serialize bài hát
    serializer = SongSerializer(song)
    
    return Response(serializer.data, status=status.HTTP_200_OK)

#Update lượt nghe của bài hát
@api_view(['POST'])
def increment_play_count(request, song_id):
    try:
        song = Song.objects.get(id=song_id)
        song.play_count += 1
        song.save()
        return Response({'message': 'Play count updated successfully.', 'play_count': song.play_count})
    except Song.DoesNotExist:
        return Response({'error': 'Song not found.'}, status=404)
    
# Lấy danh sách playlist (chỉ của user đăng nhập hoặc rỗng nếu chưa đăng nhập)
@api_view(['GET'])
def get_playlists(request):
    user_id = request.GET.get('user_id')
    search_query = request.GET.get('search', '').strip()
    playlists = Playlist.objects.filter(user_id=user_id) if user_id else Playlist.objects.none()
    if search_query:
        playlists = playlists.filter(name__icontains=search_query)
    serializer = PlaylistSerializer(playlists, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

# Thêm playlist mới
@api_view(['POST'])
def add_playlist(request):
    serializer = PlaylistSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Lấy chi tiết một playlist
@api_view(['GET'])
def get_playlist(request, pk):
    try:
        playlist = Playlist.objects.get(pk=pk)
    except Playlist.DoesNotExist:
        return Response({'error': 'Playlist không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
    serializer = PlaylistSerializer(playlist)
    return Response(serializer.data)

# Cập nhật playlist
@api_view(['PUT'])
def update_playlist(request, pk):
    try:
        playlist = Playlist.objects.get(pk=pk)
    except Playlist.DoesNotExist:
        return Response({'error': 'Playlist không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
    serializer = PlaylistSerializer(playlist, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Xóa playlist
@api_view(['DELETE'])
def delete_playlist(request, pk):
    try:
        playlist = Playlist.objects.get(pk=pk)
    except Playlist.DoesNotExist:
        return Response({'error': 'Playlist không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
    playlist.delete()
    return Response({'message': 'Xóa playlist thành công'}, status=status.HTTP_204_NO_CONTENT)

# Lấy danh sách bài hát trong playlist
@api_view(['GET'])
def get_playlist_songs(request, playlist_id):
    playlist_songs = PlaylistSong.objects.filter(playlist_id=playlist_id)
    serializer = PlaylistSongSerializer(playlist_songs, many=True)
    return Response(serializer.data)

# Thêm bài hát vào playlist
@api_view(['POST'])
def add_song_to_playlist(request):
    playlist_id = request.data.get('playlist_id')
    song_id = request.data.get('song_id')
    if not all([playlist_id, song_id]):
        return Response({'error': 'Thiếu thông tin playlist_id hoặc song_id'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        playlist = Playlist.objects.get(id=playlist_id)
        song = Song.objects.get(id=song_id)
    except Playlist.DoesNotExist:
        return Response({'error': 'Playlist không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
    except Song.DoesNotExist:
        return Response({'error': 'Bài hát không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
    if PlaylistSong.objects.filter(playlist=playlist, song=song).exists():
        return Response({'error': 'Bài hát đã có trong playlist'}, status=status.HTTP_400_BAD_REQUEST)
    playlist_song = PlaylistSong.objects.create(playlist=playlist, song=song)
    serializer = PlaylistSongSerializer(playlist_song)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

# Xóa bài hát khỏi playlist
@api_view(['DELETE'])
def remove_song_from_playlist(request, playlist_id, song_id):
    try:
        playlist_song = PlaylistSong.objects.get(playlist_id=playlist_id, song_id=song_id)
    except PlaylistSong.DoesNotExist:
        return Response({'error': 'Bài hát không có trong playlist'}, status=status.HTTP_404_NOT_FOUND)
    playlist_song.delete()
    return Response({'message': 'Xóa bài hát khỏi playlist thành công'}, status=status.HTTP_204_NO_CONTENT)

# Lấy danh sách album
@api_view(['GET'])
def get_albums(request):
    albums = Album.objects.all()
    serializer = AlbumsSerializer(albums, many=True)
    return Response(serializer.data)

# Thêm album mới
@api_view(['POST'])
def add_album(request):
    name = request.data.get('name')
    created_at = request.data.get('created_at')
    artist_id = request.data.get('artist')
    status_value = request.data.get('status', 1)
    image_file = request.FILES.get('cover_image')
    if not all([name, created_at, artist_id]):
        return Response({'error': 'Thiếu thông tin bắt buộc'}, status=status.HTTP_400_BAD_REQUEST)
    file_name = None
    if image_file:
        project_root = os.path.dirname(settings.BASE_DIR)
        upload_dir = os.path.join(project_root, 'frontend', 'uploads', 'albums')
        try:
            os.makedirs(upload_dir, exist_ok=True)
        except Exception as e:
            return Response({'error': f'Lỗi khi tạo thư mục: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        if not os.access(upload_dir, os.W_OK):
            return Response({'error': 'Không có quyền ghi vào thư mục frontend/uploads/albums'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        file_name = image_file.name
        file_path = os.path.join(upload_dir, file_name)
        if os.path.exists(file_path):
            base, ext = os.path.splitext(file_name)
            file_name = f"{base}_{int(time.time())}{ext}"
            file_path = os.path.join(upload_dir, file_name)
        try:
            with open(file_path, 'wb+') as destination:
                for chunk in image_file.chunks():
                    destination.write(chunk)
        except Exception as e:
            return Response({'error': f'Lỗi khi lưu file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    try:
        artist = Artist.objects.get(id=artist_id)
        album = Album.objects.create(
            name=name,
            created_at=created_at,
            artist=artist,
            cover_image=file_name,
            status=status_value
        )
    except Artist.DoesNotExist:
        return Response({'error': 'Artist không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Lỗi khi tạo album: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    serializer = AlbumsSerializer(album)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

# Cập nhật album
@api_view(['PUT'])
def update_album(request, album_id):
    name = request.data.get('name')
    created_at = request.data.get('created_at')
    artist_id = request.data.get('artist')
    status_value = request.data.get('status')
    image_file = request.FILES.get('cover_image')
    try:
        album = Album.objects.get(id=album_id)
    except Album.DoesNotExist:
        return Response({'error': 'Album không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
    if name:
        album.name = name
    if created_at:
        album.created_at = created_at
    if artist_id:
        try:
            artist = Artist.objects.get(id=artist_id)
            album.artist = artist
        except Artist.DoesNotExist:
            return Response({'error': 'Artist không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
    if status_value is not None:
        album.status = status_value
    if image_file:
        project_root = os.path.dirname(settings.BASE_DIR)
        upload_dir = os.path.join(project_root, 'frontend', 'uploads', 'albums')
        try:
            os.makedirs(upload_dir, exist_ok=True)
        except Exception as e:
            return Response({'error': f'Lỗi khi tạo thư mục: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        if not os.access(upload_dir, os.W_OK):
            return Response({'error': 'Không có quyền ghi vào thư mục frontend/uploads/albums'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        if album.cover_image:
            old_file_path = os.path.join(upload_dir, album.cover_image)
            if os.path.exists(old_file_path):
                try:
                    os.remove(old_file_path)
                except Exception as e:
                    return Response({'error': f'Lỗi khi xóa file cũ: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        file_name = image_file.name
        file_path = os.path.join(upload_dir, file_name)
        if os.path.exists(file_path):
            base, ext = os.path.splitext(file_name)
            file_name = f"{base}_{int(time.time())}{ext}"
            file_path = os.path.join(upload_dir, file_name)
        try:
            with open(file_path, 'wb+') as destination:
                for chunk in image_file.chunks():
                    destination.write(chunk)
            album.cover_image = file_name
        except Exception as e:
            return Response({'error': f'Lỗi khi lưu file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    try:
        album.save()
    except Exception as e:
        return Response({'error': f'Lỗi khi cập nhật album: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    serializer = AlbumsSerializer(album)
    return Response(serializer.data, status=status.HTTP_200_OK)

# Thay đổi trạng thái album
@api_view(['PUT'])
def change_album_status(request, pk):
    try:
        album = Album.objects.get(pk=pk)
    except Album.DoesNotExist:
        return Response({'message': 'Album không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
    album.status = 0 if album.status == 1 else 1
    album.save()
    return Response({'message': 'Cập nhật trạng thái thành công', 'trangThai': album.status}, status=status.HTTP_200_OK)

#Lấy chi tiết của một album
@api_view(['GET'])
def get_album_details(request, pk):
    try:
        # Fetch the album by its primary key (id)
        album = Album.objects.get(pk=pk)
    except Album.DoesNotExist:
        # If the album doesn't exist, return a 404 response
        return Response({'message': 'Album không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
    
    # Serialize the album and include its songs
    serializer = AlbumsSerializer(album)
    
    # Return the album details with its songs
    return Response(serializer.data, status=status.HTTP_200_OK)

# Lấy danh sách nghệ sĩ
@api_view(['GET'])
def get_artists(request):
    artists = Artist.objects.all()
    serializer = ArtistSerializer(artists, many=True)
    return Response(serializer.data)

# Thêm nghệ sĩ mới
@api_view(['POST'])
def add_artist(request):
    serializer = ArtistSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Cập nhật nghệ sĩ
@api_view(['PUT'])
def update_artist(request, pk):
    try:
        artist = Artist.objects.get(pk=pk)
    except Artist.DoesNotExist:
        return Response({'message': 'Nghệ sĩ không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
    serializer = ArtistSerializer(artist, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Thay đổi trạng thái nghệ sĩ
@api_view(['PUT'])
def change_artist_status(request, pk):
    try:
        artist = Artist.objects.get(pk=pk)
    except Artist.DoesNotExist:
        return Response({'message': 'Nghệ sĩ không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
    artist.status = 0 if artist.status == 1 else 1
    artist.save()
    return Response({'message': 'Cập nhật trạng thái thành công', 'trangThai': artist.status}, status=status.HTTP_200_OK)

# Lấy danh sách người dùng
@api_view(['GET'])
def get_users(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    users_data = serializer.data
    for user_data in users_data:
        user_data['isPremium'] = bool(user_data['isPremium'])  # Chuyển 0/1 thành false/true
    return Response(users_data)

# Thêm người dùng mới
@api_view(['POST'])
def add_user(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        new_user_data = serializer.data
        new_user_data['isPremium'] = bool(new_user_data['isPremium'])  # Chuyển 0/1 thành false/true
        return Response(new_user_data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Đăng nhập người dùng
@api_view(['POST'])
def login_user(request):
    email = request.data.get('email')
    password = request.data.get('password')
    if not email or not password:
        return Response({'error': 'Vui lòng cung cấp email và password'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'Sai email hoặc mật khẩu'}, status=status.HTTP_401_UNAUTHORIZED)
    if password != user.password_hash:
        return Response({'error': 'Sai email hoặc mật khẩu'}, status=status.HTTP_401_UNAUTHORIZED)
    if hasattr(user, 'status') and user.status != 1:
        return Response({'error': 'Tài khoản đã bị khóa hoặc chưa kích hoạt'}, status=status.HTTP_403_FORBIDDEN)
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'created_at': user.created_at.isoformat(),
            'isPremium': bool(user.isPremium)  # Chuyển 0/1 thành false/true
        }
    }, status=status.HTTP_200_OK)

# Cập nhật thông tin người dùng
@api_view(['PUT'])
def update_user(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"error": "Người dùng không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
    serializer = UserSerializer(user, data=request.data)
    if serializer.is_valid():
        serializer.save()
        updated_data = serializer.data
        updated_data['isPremium'] = bool(updated_data['isPremium'])  # Chuyển 0/1 thành false/true
        return Response(updated_data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Thay đổi trạng thái người dùng
@api_view(['PUT'])
def changestatus_user(request, pk):
    try:
        user = User.objects.get(pk=pk)
        user.status = 0 if user.status == 1 else 1
        user.save()
        return Response({
            "message": "Trạng thái người dùng đã được cập nhật.",
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "status": user.status,
        }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "Không tìm thấy người dùng."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": f"Lỗi khi cập nhật trạng thái: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Xóa người dùng
@api_view(['DELETE'])
def delete_user(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"error": "Người dùng không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
    user.delete()
    return Response({"message": "Đã xóa người dùng thành công."}, status=status.HTTP_204_NO_CONTENT)

# Lấy tin nhắn giữa 2 người dùng
@api_view(['GET'])
def get_messages_between_users(request):
    sender_id = request.GET.get('sender_id')
    receiver_id = request.GET.get('receiver_id')

    if not sender_id or not receiver_id:
        return Response({"error": "sender_id và receiver_id là bắt buộc."}, status=400)

    try:
        sender = User.objects.get(id=sender_id)
        receiver = User.objects.get(id=receiver_id)
    except User.DoesNotExist:
        return Response({"error": "Người dùng không tồn tại."}, status=404)

    messages = Message.objects.filter(
        Q(sender=sender, receiver=receiver) | Q(sender=receiver, receiver=sender)
    ).order_by("timestamp")

    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data)

# Gửi tin nhắn giữa 2 người dùng
@api_view(['POST'])
def send_message(request):
    sender_id = request.data.get('sender_id')
    receiver_id = request.data.get('receiver_id')
    content = request.data.get('content')

    if not sender_id or not receiver_id or not content:
        return Response(
            {"error": "sender_id, receiver_id, and content are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        sender = User.objects.get(id=sender_id)
        receiver = User.objects.get(id=receiver_id)
    except User.DoesNotExist:
        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        message = Message.objects.create(
            sender=sender,
            receiver=receiver,
            content=content
        )
        serializer = MessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {"error": f"Failed to send message: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    