from django.urls import path
from services import views

app_name = 'services'

urlpatterns = [
    path('', 
         views.services_list, 
         name='services_list'),
    
    path('category/<slug:category_slug>/', 
         views.category_services, 
         name='category_services'),
    
    path('<slug:slug>/', 
         views.service_detail, 
         name='service_detail'),

    path(
        '<slug:service_slug>/inquiry/',
        views.service_inquiry_submit,
        name='inquiry_submit'
    ),
    
    # Success page after inquiry submission
    path(
        'inquiry/success/',
        views.service_inquiry_success,
        name='inquiry_success'
    ),
    
    path(
        'inquiry/success/',
        views.service_inquiry_success,
        name='inquiry_success'
    ),
]