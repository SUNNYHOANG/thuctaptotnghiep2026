from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager"""
    
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError('Người dùng phải có tên đăng nhập')
        if not email:
            raise ValueError('Người dùng phải có email')
        
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User Model"""
    
    ROLE_CHOICES = [
        ('sinhvien', 'Sinh viên'),
        ('giangvien', 'Giảng viên'),
        ('admin', 'Quản trị viên'),
    ]
    
    username = models.CharField(max_length=50, unique=True, db_index=True)
    email = models.EmailField(unique=True)
    hoten = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='sinhvien')
    
    # Thông tin sinh viên
    mssv = models.CharField(max_length=50, unique=True, null=True, blank=True)
    malop = models.CharField(max_length=50, null=True, blank=True)
    
    # Thông tin giảng viên
    magiangvien = models.CharField(max_length=50, unique=True, null=True, blank=True)
    
    # Thông tin chung
    makhoa = models.CharField(max_length=50, null=True, blank=True)
    
    # Django fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'hoten']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'Người dùng'
        verbose_name_plural = 'Người dùng'
    
    def __str__(self):
        return f'{self.username} ({self.get_role_display()})'
    
    def has_perm(self, perm, obj=None):
        return self.is_superuser
    
    def has_module_perms(self, app_label):
        return self.is_superuser
    
    @property
    def is_admin(self):
        return self.role == 'admin' or self.is_superuser
    
    @property
    def is_giangvien(self):
        return self.role == 'giangvien'
    
    @property
    def is_sinhvien(self):
        return self.role == 'sinhvien'
