from django.urls import path
from blog import views

app_name = 'blog'

urlpatterns = [
    # Blog list page
    path('',
         views.post_list,
         name='post_list'),

    # Category-specific posts
    path('category/<slug:slug>/',
         views.category_posts,
         name='category_posts'),

    # Tag-specific posts
    path('tag/<slug:slug>/',
         views.tag_posts,
         name='tag_posts'),

    # Post detail page (must be last to avoid conflicts)
    path('<slug:slug>/',
         views.post_detail,
         name='post_detail'),
]
