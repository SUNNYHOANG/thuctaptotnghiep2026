@extends('layouts.main')

@section('title', 'Đăng ký học phần')

@section('content')

    <div id="loading"
        style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.1); z-index: 1000;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
            <img src="{{ asset('loading.gif') }}" alt="Loading..." />
        </div>
    </div>
    <div class="container mx-auto py-10 px-4">
        <!-- Error Notification -->
        @if (session('error'))
            <script>
                Swal.fire({
                    icon: 'error',
                    title: 'Có lỗi xảy ra!',
                    text: '{{ session('error') }}',
                    showConfirmButton: true,
                });
                <?php session()->forget('error'); ?>
            </script>
        @endif

        <!-- Success Notification -->
        @if (session('success'))
            <script>
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công!',
                    text: '{{ session('success') }}',
                    showConfirmButton: false,
                    timer: 2000
                });
                <?php session()->forget('success'); ?>
            </script>
        @endif

        <!-- Title and Student Info -->
        <div class="text-center mb-8">
            <h1 class="text-3xl font-semibold mb-4">Đăng Ký Học Phần</h1>
            <p class="text-lg">Họ tên: <strong>{{ $sinhvien->hoten }}</strong></p>
            <p class="text-lg">Mã Sinh Viên: <strong>{{ $sinhvien->mssv }}</strong> - Lớp:
                <strong>{{ $sinhvien->lop->tenlop }}</strong>
            </p>
        </div>

        <!-- Search Section -->
        <div class="text-center mb-6">
            <h2 class="text-xl font-bold mb-4">Danh Sách Học Phần - Khoa: <span
                    class="text-blue-600">{{ $sinhvien->lop->khoa->tenkhoa }}</span></h2>
            <form class="inline-block" action="{{ route('dangky.search') }}" method="post">
                @csrf
                <div class="flex items-center space-x-4">
                    <input class="border border-gray-300 rounded-lg px-3 py-2 focus:ring focus:ring-blue-300" type="text"
                        name="search" placeholder="Tìm kiếm...">
                    <input type="submit"
                        class="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg cursor-pointer hover:bg-blue-600 transition"
                        value="Tìm kiếm">
                </div>
            </form>
        </div>

        <div class="mb-6 text-center">
            <form id="studyForm" method="GET" action="{{ route('dangky') }}" class="space-y-4">
                <!-- Học kỳ Selection -->
                <div class="mb-4">
                    <label class="block text-lg font-medium mb-2">Chọn học kỳ:</label>
                    <select id="hocKySelect" name="hocky"
                        class="border rounded-lg px-3 py-2 focus:ring focus:ring-blue-300"
                        onchange="document.getElementById('studyForm').submit()">
                        @foreach ($hockyList as $index => $hocky)
                            <option value="{{ $hocky->mahocky }}"
                                {{ (empty($selectedHocKy) && $index == 2) || $selectedHocKy == $hocky->mahocky ? 'selected' : '' }}>
                                {{ $hocky->tenhocky }} - {{ $hocky->namhoc }}
                            </option>
                        @endforeach
                    </select>
                </div>

                <!-- Study Type Radio Buttons -->
                <div class="space-x-6">
                    <label class="inline-flex items-center">
                        <input type="radio" name="study_type" value="new"
                            {{ $selectedType == 'new' ? 'checked' : '' }}
                            onchange="document.getElementById('studyForm').submit()"
                            class="form-radio h-4 w-4 text-blue-600">
                        <span class="ml-2">Học mới</span>
                    </label>
                    <label class="inline-flex items-center">
                        <input type="radio" name="study_type" value="improve"
                            {{ $selectedType == 'improve' ? 'checked' : '' }} class="form-radio h-4 w-4 text-blue-600">
                        <span class="ml-2">Học cải thiện</span>
                    </label>
                </div>
            </form>
        </div>

        <!-- Course List -->
        <div class="overflow-x-auto mx-auto max-w-screen-lg">
            <table class="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead class="text-white" style="background-color: #002244">
                    <tr>
                        <th class="py-2 px-4 text-center">STT</th>
                        <th class="py-2 px-4 text-center">Mã MH</th>
                        <th class="py-2 px-4 text-center">Môn Học</th>
                        <th class="py-2 px-4">Giảng Viên</th>
                        <th class="py-2 px-4 text-center">TC</th>
                        <th class="py-2 px-4">Lịch Học</th>
                        <th class="py-2 px-4">Số Lượng Sinh Viên</th>
                        <th class="py-2 px-4">Đăng Ký</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($monHocList as $index => $monhoc)
                        <tr class="text-center border-t">
                            <td class="py-2 px-2">{{ $index + 1 }}</td>
                            <td class="py-2 px-4">{{ $monhoc->mamonhoc }}</td>
                            <td class="py-2 px-4">{{ $monhoc->tenmonhoc }}</td>
                            <td class="py-2 px-4">{{ $monhoc->giangvien }}</td>
                            <td class="py-2 px-2">{{ $monhoc->sotinchi }}</td>
                            <td class="py-2 px-4">{{ $monhoc->lichhoc }}</td>
                            <td class="py-2 px-4">{{ $monhoc->dadangky }} / {{ $monhoc->soluongsinhvien }}</td>
                            <td class="py-2 px-4"
                                style="background: {{ $monhoc->dadangky < $monhoc->soluongsinhvien ? '' : '#ff0000' }};">
                                @if ($monhoc->dadangky < $monhoc->soluongsinhvien)
                                    <button
                                        class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition-all duration-200 cursor-pointer btn-register"
                                        data-mamonhoc="{{ $monhoc->mamonhoc }}" style="text-decoration: none">Đăng
                                        ký</button>
                                @else
                                    Hết chỗ
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- jQuery and Ajax for Registration -->
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

        <script></script>

        <script>
            $(document).ready(function() {
                // Xử lý khi chọn radio button "Học cải thiện"
                $('input[name="study_type"]').change(function() {
                    if ($(this).val() === 'improve') {
                        Swal.fire({
                            icon: 'info',
                            title: 'Thông báo',
                            text: 'Chức năng này hiện đang được phát triển.',
                            showConfirmButton: true,
                        }).then(() => {
                            // Chuyển lại radio button về "Học mới" sau khi đóng thông báo
                            $('input[name="study_type"][value="new"]').prop('checked', true);
                        });
                    }
                });

                $('.btn-register').click(function() {
                    var mamonhoc = $(this).data('mamonhoc');

                    $('#loading').show();

                    $.ajax({
                        url: '{{ route('dangkyhocphan.add') }}',
                        type: 'POST',
                        data: {
                            _token: '{{ csrf_token() }}',
                            mamonhoc: mamonhoc
                        },
                        success: function(response) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Thành công!',
                                text: response.message,
                                showConfirmButton: false,
                                timer: 1000
                            }).then(() => {
                                window.location.href = response.redirect;
                            });
                        },
                        error: function(xhr) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Có lỗi xảy ra!',
                                text: xhr.responseJSON.message,
                                showConfirmButton: true,
                            });
                        },
                        complete: function() {
                            // Ẩn biểu tượng loading
                            $('#loading').hide();
                        }
                    });
                });
            });
        </script>
    </div>
@endsection
