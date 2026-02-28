@echo off
REM Script tạo lại database

echo.
echo ===================================
echo THIẾT LẬP DATABASE TOÀN BỘ HỆ THỐNG
echo ===================================
echo.

REM Lấy mật khẩu MySQL
set /p DB_PASSWORD="Nhập mật khẩu MySQL root: "

REM Chạy script SQL
echo.
echo Đang tạo database và các bảng...
echo.

mysql -u root -p%DB_PASSWORD% < database\setup-complete.sql

if %errorlevel% equ 0 (
    echo.
    echo ✅ Database đã được tạo thành công!
    echo.
    echo Thông tin đăng nhập mẫu:
    echo.
    echo --- ADMIN ---
    echo Username: admin
    echo Password: admin123
    echo.
    echo --- GIẢNG VIÊN ---
    echo Username: nguyenvanc
    echo Password: password123
    echo.
    echo --- SINH VIÊN ---
    echo MSSV: 20123456
    echo Password: 123456
    echo.
) else (
    echo.
    echo ❌ Lỗi khi tạo database!
    echo Vui lòng kiểm tra:
    echo 1. MySQL đã chạy chưa?
    echo 2. Mật khẩu MySQL có đúng không?
    echo.
)

pause
