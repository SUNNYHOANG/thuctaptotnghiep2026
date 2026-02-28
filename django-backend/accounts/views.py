from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User
from .serializers import UserSerializer, UserRegistrationSerializer, UserDetailSerializer


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    """Đăng ký tài khoản mới"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Đăng ký thành công',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """Đăng nhập"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Vui lòng nhập tên đăng nhập và mật khẩu'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response(
            {'error': 'Tên đăng nhập hoặc mật khẩu không đúng'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        return Response(
            {'error': 'Tài khoản đã bị vô hiệu hóa'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    refresh = RefreshToken.for_user(user)
    return Response({
        'message': 'Đăng nhập thành công',
        'access_token': str(refresh.access_token),
        'refresh_token': str(refresh),
        'user': UserDetailSerializer(user).data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Đăng xuất"""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Đăng xuất thành công'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user_view(request):
    """Lấy thông tin user hiện tại"""
    serializer = UserDetailSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


class UserListView(generics.ListAPIView):
    """Danh sách tất cả users (chỉ admin)"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if not (user.is_admin or user.is_superuser):
            return User.objects.none()
        return User.objects.all()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_dashboard(request):
    """Dashboard admin"""
    if not (request.user.is_admin or request.user.is_superuser):
        return Response(
            {'error': 'Bạn không có quyền truy cập'},
            status=status.HTTP_403_FORBIDDEN
        )
    return Response({
        'message': 'Chào mừng đến trang quản trị',
        'data': 'Admin dashboard data'
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def giangvien_dashboard(request):
    """Dashboard giảng viên"""
    if not request.user.is_giangvien:
        return Response(
            {'error': 'Bạn không có quyền truy cập'},
            status=status.HTTP_403_FORBIDDEN
        )
    return Response({
        'message': 'Chào mừng giảng viên',
        'data': 'Giảng viên dashboard data'
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def sinhvien_dashboard(request):
    """Dashboard sinh viên"""
    if not request.user.is_sinhvien:
        return Response(
            {'error': 'Bạn không có quyền truy cập'},
            status=status.HTTP_403_FORBIDDEN
        )
    return Response({
        'message': 'Chào mừng sinh viên',
        'data': 'Sinh viên dashboard data'
    })
