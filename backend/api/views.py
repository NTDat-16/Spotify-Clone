from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Album, Song, User, LovedSongs
from .serializer import AlbumSerializer, SongSerializer, UserSerializer, LovedSongsSerializer

#                               Create your views here.

# Album API
class AlbumListView(APIView):
    def get(self, request):
        albums = Album.objects.all()
        serializer = AlbumSerializer(albums, many = True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        album = AlbumSerializer(data = request.data)
        if album.is_valid():
            album.save()
            return Response(album.data, status=status.HTTP_201_CREATED)
        return Response(album.data, status=status.HTTP_400_BAD_REQUEST)
    
class AlbumDetailView(APIView):
    def get(self, request, pk):
        try:
            album = Album.objects.get(id=pk)
            serializer = AlbumSerializer(album)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except album.DoesNotExist:
            return Response({"error": "Album does not exist"}, status=status.HTTP_404_NOT_FOUND)
        
    def put(self, request, pk):
        try:
            album = Album.objects.get(id=pk)
            serializer = AlbumSerializer(instance=album, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except album.DoesNotExist:
            return Response({"error": "Album does not exist"}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, pk):
        try:
            album = Album.objects.get(id=pk)
            album.delete()
            return Response({"message": "Album deleted successfully"}, status=status.HTTP_200_OK)
        except album.DoesNotExist:
            return Response({"error": "Album does not exist"}, status=status.HTTP_404_NOT_FOUND)

# Song API
class SongListView(APIView):
    def get(self, request):
        songs = Song.objects.all()
        serializer = SongSerializer(songs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        song = SongSerializer(data = request.data)
        if song.is_valid():
            song.save()
            return Response(song.data, status=status.HTTP_201_CREATED)
        return Response(song.errors, status=status.HTTP_400_BAD_REQUEST)

class SongDetailView(APIView):
    def get(self, request, pk):
        try:
            song = Song.objects.get(id=pk)
            serializer = SongSerializer(song)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except song.DoesNotExist:
            return Response({"error": "Song does not exist"}, status=status.HTTP_404_NOT_FOUND)
        
    def put(self, request, pk):
        try:
            song = Song.objects.get(id=pk)
            serializer = SongSerializer(instance=song, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except song.DoesNotExist:
            return Response({"error": "Song does not exist"}, status=status.HTTP_404_NOT_FOUND)

# User API
class UserListView(APIView):
    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        user = UserSerializer(data = request.data)
        if user.is_valid():
            user.save()
            return Response(user.data, status=status.HTTP_201_CREATED)
        return Response(user.error, status=status.HTTP_400_BAD_REQUEST)

class UserDetailView(APIView):
    def get(self, request, pk):
        try:
            user = User.objects.get(id = pk)
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except user.DoesNotExist:
            return Response({"error": "User does not exist"}, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, pk):
        try:
            user = User.objects.get(id = pk)
            serializer = UserSerializer(instance = user, data = request.data)
            if serializer.is_valid():
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except user.DoesNotExist:
            return Response({"error": "User does not exist"}, status=status.HTTP_404_NOT_FOUND)
        
    def delete(self, request, pk):
        try:
            user = User.objects.get(id = pk)
            user.delete()
            return Response({"message": "User deleted successfully"}, status=status.HTTP_200_OK)
        except user.DoesNotExist:
            return Response({"error": "User does not exist"}, status=status.HTTP_404_NOT_FOUND)
        
# Loved Songs API
class LovedSongsListView(APIView):
    # Thêm permission cho người dùng
    
    def get(self, request):
        loved_songs = LovedSongs.objects.all()
        serializer = LovedSongsSerializer(loved_songs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = LovedSongsSerializer(data = request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LovedSongsDetailView(APIView):
    # Thêm permission cho người dùng
    
    def get(self, request, song_id):
        exists = LovedSongs.objects.filter(user = request.user, song_id = song_id).exists()
        return Response({'is loved song': exists}, status=status.HTTP_200_OK)
    
    def delete(self, request, pk):
        try:
            loved_song = LovedSongs.objects.get(id = pk)
            loved_song.delete()
            return Response({"message": "Loved song deleted successfully"}, status=status.HTTP_200_OK)
        except loved_song.DoesNotExist:
            return Response({"error": "Loved song does not exist"}, status=status.HTTP_404_NOT_FOUND)