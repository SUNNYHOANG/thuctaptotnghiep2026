<?php

namespace App\Http\Controllers;

use App\Models\HocKy_SinhVien;
use App\Models\LopHoc;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Hash;
use App\Models\SinhVien;
use App\Models\Khoa;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;



class AuthController extends Controller
{
    public function showLoginForm()
    {
        if (Auth::check()) {
            return redirect()->route('trangchu');
        }

        return view('auth.login');
    }

    public function showRegisterForm()
    {
        if (Auth::check()) {
            return redirect()->route('trangchu');
        }

        $khoas = Khoa::all();
        $lops = LopHoc::all();

        return view('auth.register', compact('khoas', 'lops'));
    }

    public function register(Request $request)
    {
        $request->validate([
            'mssv' => 'required|string|unique:sinhvien,mssv',
            'password' => 'required|string|min:3',
            'hoten' => 'required|string',
            'ngaysinh' => 'required|date',
            'gioitinh' => 'required|string',
            'malop' => 'required|string',
            'makhoa' => 'required|string',
            'quequan' => 'required|string',
        ]);

        $sinhvien = new SinhVien();
        $sinhvien->mssv = $request->mssv;
        $sinhvien->password = Hash::make($request->password); // Mã hóa mật khẩu
        $sinhvien->hoten = $request->hoten;
        $sinhvien->ngaysinh = $request->ngaysinh;
        $sinhvien->gioitinh = $request->gioitinh;
        $sinhvien->malop = $request->malop;
        $sinhvien->makhoa = $request->makhoa;
        $sinhvien->quequan = $request->quequan;
        $sinhvien->save();

        $hocky_sinhvien = new HocKy_SinhVien();
        $hocky_sinhvien->mssv = $request->mssv;
        $hocky_sinhvien->mahocky = "HK1-2024";
        $hocky_sinhvien->trangthai_hocky_sinhvien = "Đang học";
        $hocky_sinhvien->save();

        return redirect()->route('login')->with('success', 'Đăng ký thành công! Vui lòng đăng nhập.'); // Thông báo thành công
    }

    public function getLops($makhoa)
    {
        $lops = LopHoc::where('makhoa', $makhoa)->get(); // Lấy danh sách lớp theo khoa
        return response()->json($lops);
    }

    public function login(Request $request)
    {
        $credentials = $request->only('username', 'password');

        if ($credentials['username'] === 'admin' && $credentials['password'] === 'admin') {
            $request->session()->put('isAdmin', true);
            return redirect()->route('admin.home');
        }

        if (empty($credentials['username']) || empty($credentials['password'])) {
            return redirect()->back()->with('error', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
        }

        $user = SinhVien::where('mssv', $credentials['username'])->first();
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return redirect()->back()->with('error', 'Tên đăng nhập hoặc mật khẩu không đúng.');
        }

        Auth::login($user);
        // Regenerate session để đảm bảo rằng Laravel cập nhật ID phiên và duy trì trạng thái đăng nhập
        $request->session()->regenerate();

        if (Auth::check()) {
            // Tạo cookie với thời gian tồn tại 30 ngày
            $minutes = 60 * 24 * 30; // 30 ngày

            // Thêm cookie vào hàng đợi
            $cookie = Cookie::make('login_token', $user->mssv, $minutes);
            Cookie::queue($cookie);

            return redirect()->intended('trangchu')->with('hoten', $user->hoten);
        }

        return redirect()->back()->with('error', 'Đăng nhập không thành công.');
    }


    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Xóa cookie khi đăng xuất
        Cookie::queue(Cookie::forget('login_token'));

        Session::flash('message', 'Đăng xuất thành công!');
        return redirect()->route('login');
    }
}
