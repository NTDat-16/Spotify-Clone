from django.urls import path

from .views import SongListView, SongDetailView, AlbumListView, AlbumDetailView, UserDetailView, UserListView, LovedSongsDetailView, LovedSongsListView

urlpatterns = [
    path('albums/', AlbumListView.as_view()),
    path('albums/<int:pk>/', AlbumDetailView.as_view()),
    
    path('songs/', SongListView.as_view()),
    path('songs/<int:pk>/', SongDetailView.as_view()),
    
    path('users/', UserListView.as_view()),
    path('users/<int:pk>/', UserDetailView.as_view()),
    
    path('loved_songs/', LovedSongsListView.as_view()),
    path('loved_songs/<int:pk>/', LovedSongsDetailView.as_view()),
    
]