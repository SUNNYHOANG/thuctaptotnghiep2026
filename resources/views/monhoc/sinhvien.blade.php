@extends('layouts.main-admin')

@section('title', 'Danh sách sinh viên')

@section('content')

<div class="container mx-auto p-4">
    <h2 class="text-2xl font-semibold">Danh Sách Sinh Viên Đăng Ký Môn: {{ $monhoc->tenmonhoc }}</h2>
    
    <table class="table table-bordered mt-4">
        <thead>
            <tr>
                <th>STT</th>
                <th>MSSV</th>
                <th>Tên Sinh Viên</th>
                <th>Hành Động</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($monhoc->dsDangKy as $index => $dangKy)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $dangKy->mssv }}</td>
                    <td>{{ $dangKy->sinhvien->hoten }}</td>
                    <td>
                        <form action="{{ route('monhoc.deleteStudent', [$monhoc->mamonhoc, $dangKy->id]) }}" method="POST">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="btn btn-danger" onclick="return confirm('Bạn có chắc chắn muốn xoá sinh viên này không?')">Xóa</button>
                        </form>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" class="text-center">Không có sinh viên nào đăng ký.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</div>
@endsection