# from django.db import models

# class User(models.Model):
#     id = models.AutoField(primary_key=True)
#     username = models.CharField(max_length=50, unique=True)
#     email = models.CharField(max_length=100, unique=True)
#     password_hash = models.CharField(max_length=255)
#     created_at = models.DateTimeField(auto_now_add=True)
#     status = models.IntegerField(default=1)

#     def __str__(self):
#         return self.username

#     class Meta:
#         db_table = 'taikhoan'
#         managed = True


# class Artist(models.Model):
#     id = models.AutoField(primary_key=True)
#     name = models.CharField(max_length=255)
#     status = models.IntegerField(default=1)

#     def __str__(self):
#         return self.name

#     class Meta:
#         db_table = 'artists'
#         managed = True


# class Album(models.Model):
#     id = models.AutoField(primary_key=True)
#     name = models.CharField(max_length=255)
#     created_at = models.DateField()
#     artist = models.ForeignKey(Artist, on_delete=models.CASCADE)
#     cover_image = models.CharField(max_length=255, blank=True, null=True)  # Lưu chuỗi tên file ảnh
#     status = models.IntegerField(default=1)
    
#     def __str__(self):
#         return self.name

#     class Meta:
#         db_table = 'albums'
#         managed = True


# class Song(models.Model):
#     id = models.AutoField(primary_key=True)
#     name = models.CharField(max_length=255)
#     artist = models.ForeignKey(Artist, on_delete=models.CASCADE)
#     album = models.ForeignKey(Album, on_delete=models.SET_NULL, null=True, blank=True)
#     duration = models.IntegerField()  # Thời gian tính bằng giây
#     song_url = models.CharField(max_length=500)  # Lưu URL dưới dạng chuỗi
#     status = models.IntegerField(default=1)

#     def __str__(self):
#         return f"{self.name} - {self.artist.name}"

#     class Meta:
#         db_table = 'songs'
#         managed = True


# class Playlist(models.Model):
#     id = models.AutoField(primary_key=True)
#     name = models.CharField(max_length=255)
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     created_at = models.DateTimeField(auto_now_add=True)
#     status = models.IntegerField(default=1)

#     def __str__(self):
#         return self.name

#     class Meta:
#         db_table = 'playlists'
#         managed = True


# class PlaylistSong(models.Model):
#     id = models.AutoField(primary_key=True)
#     playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE)
#     song = models.ForeignKey(Song, on_delete=models.CASCADE)

#     def __str__(self):
#         return f"{self.playlist.name} - {self.song.name}"

#     class Meta:
#         db_table = 'playlist_songs'
#         managed = Truez
# backend/app/models.py
from django.db import models

class Message(models.Model):
    id = models.AutoField(primary_key=True)
    sender = models.ForeignKey("User", on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey("User", on_delete=models.CASCADE, related_name='received_messages')
    content = models.CharField(max_length=1000)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username}: {self.content[:30]}..."

    class Meta:
        db_table = 'messages'
        managed = True


class User(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    email = models.CharField(max_length=100, unique=True)
    password_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.IntegerField(default=1)
    isPremium = models.BooleanField(default=False)
    def __str__(self):
        return self.username

    class Meta:
        db_table = 'taikhoan'
        managed = True

class Artist(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    status = models.IntegerField(default=1)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'artists'
        managed = True

class Album(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    created_at = models.DateField()
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE)
    cover_image = models.CharField(max_length=255, blank=True, null=True)
    status = models.IntegerField(default=1)
    
    def __str__(self):
        return self.name

    class Meta:
        db_table = 'albums'
        managed = True

class Song(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE)
    album = models.ForeignKey(Album, on_delete=models.SET_NULL, null=True, blank=True)
    duration = models.IntegerField()
    song_url = models.CharField(max_length=500)
    status = models.IntegerField(default=1)
    premium = models.IntegerField(default=0)  # ← thêm dòng này
    play_count = models.IntegerField(default=0)
    lyrics = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.artist.name}"

    class Meta:
        db_table = 'songs'
        managed = True

class Playlist(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    cover_image = models.CharField(max_length=255, blank=True, null=True)  # Thêm trường cover_image
    description = models.TextField(blank=True, null=True)  # Thêm trường description
    status = models.IntegerField(default=1)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'playlists'
        managed = True

class PlaylistSong(models.Model):
    id = models.AutoField(primary_key=True)
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE)
    song = models.ForeignKey(Song, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.playlist.name} - {self.song.name}"

    class Meta:
        db_table = 'playlist_songs'
        managed = True