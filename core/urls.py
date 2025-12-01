from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('portfolio/', views.portfolio, name='portfolio'),
    path('ecommerce/', views.ecommerce, name='ecommerce'),
    path('contact/', views.contact, name='contact'),
    path('contact/success/', views.contact_success, name='contact_success'),
    path('education/', views.education, name='education'),
    path('healthcare/', views.healthcare, name='healthcare'),
]