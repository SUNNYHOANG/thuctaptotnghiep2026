from django.urls import path
from . import views

urlpatterns = [
    path('admin/dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('giangvien/dashboard/', views.giangvien_dashboard, name='giangvien_dashboard'),
    path('sinhvien/dashboard/', views.sinhvien_dashboard, name='sinhvien_dashboard'),
    path('users/', views.UserListView.as_view(), name='user_list'),
]
