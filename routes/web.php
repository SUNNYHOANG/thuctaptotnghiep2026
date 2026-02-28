<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\DangKyController;
use App\Http\Controllers\MonHocController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SinhVienController;
use App\Http\Controllers\KhoaController;
use App\Http\Controllers\LopController;
use Symfony\Component\HttpKernel\Profiler\Profile;

Route::middleware([\App\Http\Middleware\CheckLoginCookie::class])->group(function () {
    Route::get('/trangchu', [HomeController::class, 'getHome'])->name('trangchu');

    Route::get('/dangky', [DangKyController::class, 'index'])->name('dangky');
    Route::post('/dangkyhocphan', [DangKyController::class, 'addMonHoc'])->name('dangkyhocphan.add');
    Route::post('/dangkyhocphan-no-transaction', [DangKyController::class, 'addMonHocWithoutTransaction'])->name('dangkyhocphan.no_transaction');


    Route::post('/dangky/find', [DangKyController::class, 'search'])->name('dangky.search');

    Route::get('/ketqua-dangky', [DangKyController::class, 'ketQuaDangKy'])->name('ketquadangky');
    Route::delete('/delete-dangky/{mamonhoc}', [DangKyController::class, 'deleteDangKy'])->name('delete_dangky');

    Route::get('/profile', [ProfileController::class, 'showProfile'])->name('profile');
    Route::get('/profile/{mssv}/edit', [ProfileController::class, 'editProfile'])->name('profile.edit');
    Route::post('/profile/{mssv}/update', [ProfileController::class, 'updateProfile'])->name('profile.update');
});

Route::get('/', [AuthController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AuthController::class, 'login']);

Route::get('/register', [AuthController::class, 'showRegisterForm'])->name('register');
Route::post('/register', [AuthController::class, 'register']);

Route::post('logout', [AuthController::class, 'logout'])->name('logout');
Route::get('/admin', [HomeController::class, 'getAdminHome'])->name('admin.home');

// Quản lý sinh vien
Route::get('/quanly-sinhvien', [SinhVienController::class, 'index'])->name('sinhvien.index');
Route::get('quanly-sinhvien/create', [SinhVienController::class, 'create'])->name('sinhvien.create');
Route::post('quanly-sinhvien', [SinhVienController::class, 'store'])->name('sinhvien.store');
Route::get('quanly-sinhvien/{id}/edit', [SinhVienController::class, 'edit'])->name('sinhvien.edit');
Route::put('quanly-sinhvien/{id}', [SinhVienController::class, 'update'])->name('sinhvien.update');
Route::delete('quanly-sinhvien/{id}', [SinhVienController::class, 'destroy'])->name('sinhvien.destroy');

Route::get('/getLops/{makhoa}', [SinhVienController::class, 'getLops'])->name('getLops');

// Quản lý môn học
Route::get('/quanly-monhoc', [MonHocController::class, 'index'])->name('monhoc.index');
Route::get('quanly-monhoc/create', [MonHocController::class, 'create'])->name('monhoc.create');
Route::post('quanly-monhoc', [MonHocController::class, 'store'])->name('monhoc.store');
Route::get('quanly-monhoc/{id}/edit', [MonHocController::class, 'edit'])->name('monhoc.edit');
Route::put('quanly-monhoc/{id}', [MonHocController::class, 'update'])->name('monhoc.update');
Route::delete('quanly-monhoc/{id}', [MonHocController::class, 'destroy'])->name('monhoc.destroy');
Route::get('monhoc/{mamonhoc}/sinhvien', [MonHocController::class, 'showStudents'])->name('monhoc.sinhviens');
Route::delete('monhoc/{mamonhoc}/sinhvien/{dangKyId}', [MonHocController::class, 'deleteStudent'])->name('monhoc.deleteStudent');


// Transaction concurrency
Route::post('quanly-sinhvien/{mssv}/update', [ProfileController::class, 'updateWithTransaction'])->name('transaction.update');


// Quản lý khoa
Route::get('/quanly-khoa', [KhoaController::class, 'index'])->name('khoa.index');
Route::get('quanly-khoa/create', [KhoaController::class, 'create'])->name('khoa.create');
Route::post('quanly-khoa', [KhoaController::class, 'store'])->name('khoa.store');
Route::get('quanly-khoa/{id}/edit', [KhoaController::class, 'edit'])->name('khoa.edit');
Route::put('quanly-khoa/{id}', [KhoaController::class, 'update'])->name('khoa.update');
Route::delete('quanly-khoa/{id}', [KhoaController::class, 'destroy'])->name('khoa.destroy');
Route::get('khoa/{makhoa}/lophoc', [KhoaController::class, 'showLopHoc'])->name('khoa.lophocs');
Route::delete('khoa/{makhoa}/lophoc/{malop}', [KhoaController::class, 'deleteLopHoc'])->name('khoa.deleteLopHoc');


// Quản lý lớp học
Route::get('/quanly-lop', [LopController::class, 'index'])->name('lophoc.index');
Route::get('quanly-lop/create', [LopController::class, 'create'])->name('lophoc.create');
Route::post('quanly-lop', [LopController::class, 'store'])->name('lophoc.store');
Route::get('quanly-lop/{id}/edit', [LopController::class, 'edit'])->name('lophoc.edit');
Route::put('quanly-lop/{id}', [LopController::class, 'update'])->name('lophoc.update');
Route::delete('quanly-lop/{id}', [LopController::class, 'destroy'])->name('lophoc.destroy');
Route::get('lop/{malop}/sinhvien', [LopController::class, 'showSinhVien'])->name('lop.sinhviens');
Route::delete('lop/{malop}/sinhvien/{mssv}', [LopController::class, 'deleteSinhVien'])->name('lop.deleteSinhVien');