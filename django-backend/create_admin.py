"""
Script để tạo tài khoản admin mặc định
Chạy: python create_admin.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User

def create_admin():
    username = 'admin'
    email = 'admin@example.com'
    password = 'admin123'
    
    # Kiểm tra xem admin đã tồn tại chưa
    if User.objects.filter(username=username).exists():
        print(f'Tài khoản admin với username "{username}" đã tồn tại!')
        print('Để đổi mật khẩu, hãy xóa tài khoản cũ và chạy lại script này.')
        return
    
    # Tạo admin
    admin = User.objects.create_superuser(
        username=username,
        email=email,
        password=password,
        hoten='Administrator',
        role='admin'
    )
    
    print('=' * 50)
    print('Tài khoản admin đã được tạo thành công!')
    print('=' * 50)
    print(f'Username: {username}')
    print(f'Password: {password}')
    print(f'Email: {email}')
    print('=' * 50)
    print('LƯU Ý: Hãy đổi mật khẩu sau lần đăng nhập đầu tiên!')
    print('=' * 50)

if __name__ == '__main__':
    create_admin()
