from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """User Serializer"""
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'hoten', 'role', 'mssv', 
                  'magiangvien', 'makhoa', 'malop', 'date_joined')
        read_only_fields = ('id', 'date_joined')


class UserRegistrationSerializer(serializers.ModelSerializer):
    """User Registration Serializer"""
    
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'hoten', 'role',
                  'mssv', 'magiangvien', 'makhoa', 'malop')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Mật khẩu xác nhận không khớp"})
        
        # Validate role-specific fields
        role = attrs.get('role')
        if role == 'sinhvien' and not attrs.get('mssv'):
            raise serializers.ValidationError({"mssv": "Sinh viên phải có mã sinh viên"})
        if role == 'giangvien' and not attrs.get('magiangvien'):
            raise serializers.ValidationError({"magiangvien": "Giảng viên phải có mã giảng viên"})
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserDetailSerializer(serializers.ModelSerializer):
    """User Detail Serializer"""
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'hoten', 'role', 'mssv',
                  'magiangvien', 'makhoa', 'malop', 'date_joined', 'last_login')
        read_only_fields = ('id', 'date_joined', 'last_login')
