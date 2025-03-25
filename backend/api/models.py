from django.db import models
# Create your models here.

# Song model
class Song(models.Model):
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    image_url = models.URLField(blank=True)
    audio_url = models.CharField(max_length=255, blank=True)
    duration = models.DurationField(blank=True)
    
    class Meta:
        db_table = "songs"

# Album model
class Album(models.Model):
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    release_year = models.IntegerField(blank=True, null=True)
    songs = models.ManyToManyField(Song, related_name="albums", blank=True)
    
    class Meta:
        db_table = "albums"

# User model
class User(models.Model):
    username = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    
    class Meta:
        db_table = "users"
        
# Loved Songs model
class LovedSongs(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="loved_songs")
    songs = models.ForeignKey(Song, on_delete=models.CASCADE, related_name="loved_by")

    class Meta:
        db_table = "loved_songs"
        unique_together = ("user", "songs") # Đảm bảo một user không thích một bài hát nhiều lần

        