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
    path('about/', views.about, name='about'),
    path('finance/', views.finance, name='finance'),
    path('data-platforms/', views.data_platforms, name='data-platforms'),
    path('privacy/', views.privacy_policy, name='privacy-policy'),
    path('support-center/', views.support, name='support-center'),
    
]