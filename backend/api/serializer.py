from rest_framework import serializers
from .models import Song, Album, User, LovedSongs

# Song Serializer
class SongSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = '__all__'

# Album Serializer
class AlbumSerializer(serializers.ModelSerializer):
    # Dùng PrimaryKeyRelatedField cho input (POST)
    songs = serializers.PrimaryKeyRelatedField(
        queryset=Song.objects.all(),
        many=True,
        required=False # cho phép không gửi song
    )

    class Meta:
        model = Album
        fields = "__all__"

    def create(self, validated_data):
        songs = validated_data.pop('songs', []) # Lấy danh sách ID bài hát
        album = Album.objects.create(**validated_data)
        album.songs.set(songs) # Gán bài hát bằng ID
        return album

    def to_representation(self, instance):
        # Override để trả về chi tiết bài hát trong response
        representation = super().to_representation(instance)   
        representation['songs'] = SongSerializer(instance.songs.all(), many=True).data
        return representation

# User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
    
# Loved Songs Serializer
class LovedSongsSerializer(serializers.ModelSerializer):
    songs = serializers.PrimaryKeyRelatedField(queryset=Song.objects.all()) # Nhận input bằng id song
    
    class Meta:
        model = LovedSongs
        fields = '__all__'
    
    def create(self, validated_data):
        # validated_data['user'] = self.context['request'].user
        return LovedSongs.objects.create(**validated_data)
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['songs'] = SongSerializer(instance.songs).data
        representation['user'] = UserSerializer(instance.user).data
        return representation