-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th3 21, 2026 lúc 06:43 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `dkhp1`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `bangdiem`
--

CREATE TABLE `bangdiem` (
  `mabangdiem` int(11) NOT NULL,
  `malophocphan` int(11) NOT NULL,
  `mssv` varchar(50) NOT NULL,
  `diemchuyencan` decimal(4,2) DEFAULT NULL COMMENT 'Điểm chuyên cần',
  `diemgiuaky` decimal(4,2) DEFAULT NULL COMMENT 'Điểm giữa kỳ',
  `diemcuoiky` decimal(4,2) DEFAULT NULL COMMENT 'Điểm cuối kỳ',
  `diemtongket` decimal(4,2) DEFAULT NULL COMMENT 'Điểm tổng kết (tính tự động)',
  `gpa` decimal(3,2) DEFAULT NULL COMMENT 'GPA môn (thang 4)',
  `trangthai` enum('dangnhap','dakhoa') DEFAULT 'dangnhap',
  `canhbao` varchar(100) DEFAULT NULL COMMENT 'Cảnh báo học vụ',
  `ghichu` text DEFAULT NULL,
  `nguoinhap` varchar(50) DEFAULT NULL,
  `ngaynhap` timestamp NOT NULL DEFAULT current_timestamp(),
  `ngaykhoa` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `config`
--

CREATE TABLE `config` (
  `id` int(11) NOT NULL,
  `config_key` varchar(100) NOT NULL,
  `config_value` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `config`
--

INSERT INTO `config` (`id`, `config_key`, `config_value`, `updated_at`) VALUES
(1, 'hocky_dang_mo_dang_ky', '1', '2026-03-14 04:57:59');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `dichvu_sinhvien`
--

CREATE TABLE `dichvu_sinhvien` (
  `madon` int(11) NOT NULL,
  `mssv` varchar(50) NOT NULL,
  `maloaidichvu` int(11) NOT NULL,
  `trangthai` enum('cho','dangxuly','duyet','tuchoi') DEFAULT 'cho',
  `noidung_yeucau` text DEFAULT NULL,
  `ketqua` text DEFAULT NULL,
  `file_ketqua` varchar(500) DEFAULT NULL,
  `ngaygui` timestamp NOT NULL DEFAULT current_timestamp(),
  `ngayduyet` datetime DEFAULT NULL,
  `nguoiduyet` varchar(50) DEFAULT NULL,
  `ghichu` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `dichvu_sinhvien`
--

INSERT INTO `dichvu_sinhvien` (`madon`, `mssv`, `maloaidichvu`, `trangthai`, `noidung_yeucau`, `ketqua`, `file_ketqua`, `ngaygui`, `ngayduyet`, `nguoiduyet`, `ghichu`) VALUES
(1, '20123457', 2, 'duyet', 'xuất bản điểm giúp tôi', 'ok', NULL, '2026-03-08 01:47:00', '2026-03-08 08:47:27', '2', 'heheheh'),
(2, '20123456', 3, 'tuchoi', 'Xin yêu cầu ở KTX', 'Chưa thể đăng ký được em nhé', NULL, '2026-03-14 03:52:15', '2026-03-14 10:54:30', '1', ''),
(3, '20123459', 1, 'duyet', 'heheh', 'ok', NULL, '2026-03-21 04:34:13', '2026-03-21 11:38:23', '1', 'adsasdads');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `diemrenluyen`
--

CREATE TABLE `diemrenluyen` (
  `madiemrenluyen` int(11) NOT NULL,
  `mssv` varchar(50) NOT NULL,
  `mahocky` int(11) NOT NULL,
  `diemhoatdong` int(11) DEFAULT 0,
  `diemhoctap` int(11) DEFAULT 0,
  `diemkyluat` int(11) DEFAULT 0,
  `diemtong` int(11) DEFAULT 0,
  `xeploai` varchar(50) DEFAULT NULL,
  `ghichu` text DEFAULT NULL,
  `nguoitao` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `diemrenluyen`
--

INSERT INTO `diemrenluyen` (`madiemrenluyen`, `mssv`, `mahocky`, `diemhoatdong`, `diemhoctap`, `diemkyluat`, `diemtong`, `xeploai`, `ghichu`, `nguoitao`, `created_at`, `updated_at`) VALUES
(1, '20123456', 1, 0, 0, 20, 20, 'Chưa đạt', 'Điểm chính thức (CTSV duyệt). Tổng điểm: 39', NULL, '2026-03-01 04:52:48', '2026-03-20 18:29:51'),
(5, '20123456', 3, 10, 6, 19, 79, 'Khá', 'CTSV: tốt', NULL, '2026-03-20 17:32:40', '2026-03-20 18:38:10'),
(6, '20123456', 4, 0, 0, 0, 95, 'Xuất sắc', 'CTSV: tốt', NULL, '2026-03-20 18:02:56', '2026-03-20 18:27:37'),
(8, '20123456', 2, 0, 0, 20, 20, 'Chưa đạt', NULL, NULL, '2026-03-20 18:29:29', '2026-03-20 18:29:29'),
(9, '20123459', 3, 0, 0, 0, 45, 'Chưa đạt', 'CTSV: fail', NULL, '2026-03-20 18:56:59', '2026-03-20 18:56:59');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `drl_tudanhgia`
--

CREATE TABLE `drl_tudanhgia` (
  `id` int(11) NOT NULL,
  `mssv` varchar(50) NOT NULL,
  `mahocky` int(11) NOT NULL,
  `diem_ythuc_hoc_tap` int(11) DEFAULT 0,
  `diem_noi_quy` int(11) DEFAULT 0,
  `diem_hoat_dong` int(11) DEFAULT 0,
  `diem_cong_dong` int(11) DEFAULT 0,
  `diem_khen_thuong_ky_luat` int(11) DEFAULT 0,
  `tong_diem` int(11) DEFAULT 0,
  `nhan_xet_sv` text DEFAULT NULL,
  `diem_cvht` int(11) DEFAULT NULL,
  `nhan_xet_cvht` text DEFAULT NULL,
  `nguoi_duyet_cvht` varchar(50) DEFAULT NULL,
  `ngay_duyet_cvht` datetime DEFAULT NULL,
  `diem_ctsv` int(11) DEFAULT NULL,
  `nhan_xet_ctsv` text DEFAULT NULL,
  `nguoi_duyet_ctsv` varchar(50) DEFAULT NULL,
  `ngay_duyet_ctsv` datetime DEFAULT NULL,
  `trangthai` enum('choduyet','daduyet','bituchoi','chokhoaduyet') NOT NULL DEFAULT 'choduyet',
  `ngay_tao` timestamp NOT NULL DEFAULT current_timestamp(),
  `diem_khoa` int(11) DEFAULT NULL,
  `nhan_xet_khoa` text DEFAULT NULL,
  `nguoi_duyet_khoa` varchar(50) DEFAULT NULL,
  `ngay_duyet_khoa` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `drl_tudanhgia`
--

INSERT INTO `drl_tudanhgia` (`id`, `mssv`, `mahocky`, `diem_ythuc_hoc_tap`, `diem_noi_quy`, `diem_hoat_dong`, `diem_cong_dong`, `diem_khen_thuong_ky_luat`, `tong_diem`, `nhan_xet_sv`, `diem_cvht`, `nhan_xet_cvht`, `nguoi_duyet_cvht`, `ngay_duyet_cvht`, `diem_ctsv`, `nhan_xet_ctsv`, `nguoi_duyet_ctsv`, `ngay_duyet_ctsv`, `trangthai`, `ngay_tao`, `diem_khoa`, `nhan_xet_khoa`, `nguoi_duyet_khoa`, `ngay_duyet_khoa`) VALUES
(5, '20123456', 3, 9, 25, 11, 22, 7, 74, '......................', 79, 'tốt', 'nguyenvanc', '2026-03-21 01:36:39', 79, 'tốt', 'ctsv', '2026-03-21 01:38:10', 'daduyet', '2026-03-20 18:35:57', 67, 'jjjjjjjj', 'khoa_cntt', '2026-03-21 01:37:16'),
(6, '20123459', 3, 9, 6, 12, 24, 10, 61, '......................', 78, 'tốt mà', 'tranthid', '2026-03-21 01:55:35', 45, 'fail', 'ctsv', '2026-03-21 01:56:59', 'daduyet', '2026-03-20 18:55:02', 88, 'gggg', 'khoa_qtkd', '2026-03-21 01:56:17');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `giangvien`
--

CREATE TABLE `giangvien` (
  `magiaovien` int(11) NOT NULL,
  `hoten` varchar(255) NOT NULL,
  `makhoa` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `sodienthoai` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `giangvien`
--

INSERT INTO `giangvien` (`magiaovien`, `hoten`, `makhoa`, `email`, `sodienthoai`, `created_at`, `updated_at`) VALUES
(1, 'TS. Nguyễn Văn C', 'CNTT', 'nguyenvanc@hva.edu.vn', '0912345678', '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
(2, 'TS. Trần Thị D', 'CNTT', 'tranthid@hva.edu.vn', '0987654321', '2026-03-01 04:27:39', '2026-03-01 04:27:39');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `hoatdong`
--

CREATE TABLE `hoatdong` (
  `mahoatdong` int(11) NOT NULL,
  `tenhoatdong` varchar(255) NOT NULL,
  `maloaihoatdong` int(11) NOT NULL,
  `mota` text DEFAULT NULL,
  `ngaybatdau` datetime NOT NULL,
  `ngayketthuc` datetime NOT NULL,
  `diadiem` varchar(255) DEFAULT NULL,
  `magiaovien_pt` int(11) DEFAULT NULL COMMENT 'Giảng viên phụ trách',
  `soluongtoida` int(11) DEFAULT 100,
  `soluongdadangky` int(11) DEFAULT 0,
  `trangthai` enum('dangmo','dangdienra','daketthuc','huy','dachot') DEFAULT 'dangmo',
  `nguoitao` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `hoatdong`
--

INSERT INTO `hoatdong` (`mahoatdong`, `tenhoatdong`, `maloaihoatdong`, `mota`, `ngaybatdau`, `ngayketthuc`, `diadiem`, `magiaovien_pt`, `soluongtoida`, `soluongdadangky`, `trangthai`, `nguoitao`, `created_at`, `updated_at`) VALUES
(6, 'TOÁN CC', 6, NULL, '2026-03-02 00:00:00', '2026-03-05 23:59:59', 'F100', NULL, 1, 1, 'dachot', NULL, '2026-03-03 17:49:16', '2026-03-03 18:02:20'),
(8, 'Ngày Lao Động', 6, 'Trả làm gì', '2026-03-08 00:00:00', '2026-03-10 23:59:59', 'F100', 1, 100, 1, 'dangmo', NULL, '2026-03-08 01:39:10', '2026-03-08 01:40:09');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `hocbong`
--

CREATE TABLE `hocbong` (
  `mahocbong` int(11) NOT NULL,
  `tenhocbong` varchar(255) NOT NULL,
  `mahocky` int(11) NOT NULL,
  `giatri` decimal(12,0) DEFAULT 0,
  `dieukien` text DEFAULT NULL COMMENT 'Điều kiện xét học bổng',
  `soluong` int(11) DEFAULT 0,
  `hanchot` date DEFAULT NULL,
  `trangthai` enum('mo','dong') DEFAULT 'mo',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `hocky`
--

CREATE TABLE `hocky` (
  `mahocky` int(11) NOT NULL,
  `tenhocky` varchar(100) NOT NULL,
  `namhoc` varchar(20) NOT NULL,
  `kyhoc` int(11) DEFAULT NULL COMMENT '1 hoặc 2',
  `ngaybatdau` date DEFAULT NULL,
  `ngayketthuc` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `hocky`
--

INSERT INTO `hocky` (`mahocky`, `tenhocky`, `namhoc`, `kyhoc`, `ngaybatdau`, `ngayketthuc`, `created_at`, `updated_at`) VALUES
(1, 'HK1 2023-2024', '2023-2024', 1, '2023-09-01', '2023-12-31', '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
(2, 'HK2 2023-2024', '2023-2024', 2, '2024-01-01', '2024-05-31', '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
(3, 'HK1 2024-2025', '2024-2025', 1, '2024-09-01', '2024-12-31', '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
(4, 'HK2 2024-2025', '2024-2025', 2, '2025-01-01', '2025-05-31', '2026-03-01 04:27:39', '2026-03-01 04:27:39');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `hocphi_payments`
--

CREATE TABLE `hocphi_payments` (
  `id` int(11) NOT NULL,
  `mssv` varchar(50) NOT NULL,
  `malophocphan` int(11) NOT NULL,
  `amount` decimal(12,0) NOT NULL,
  `paid_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `khenthuong_kyluat`
--

CREATE TABLE `khenthuong_kyluat` (
  `id` int(11) NOT NULL,
  `mssv` varchar(50) NOT NULL,
  `mahocky` int(11) NOT NULL,
  `loai` enum('khenthuong','kyluat','canhcao') NOT NULL,
  `noidung` text NOT NULL,
  `hinhthuc` varchar(255) DEFAULT NULL,
  `soquyetdinh` varchar(100) DEFAULT NULL,
  `ngayquyetdinh` date DEFAULT NULL,
  `nguoilap` varchar(50) DEFAULT NULL,
  `ghichu` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `khenthuong_kyluat`
--

INSERT INTO `khenthuong_kyluat` (`id`, `mssv`, `mahocky`, `loai`, `noidung`, `hinhthuc`, `soquyetdinh`, `ngayquyetdinh`, `nguoilap`, `ghichu`, `created_at`) VALUES
(1, '20123458', 1, 'canhcao', 'Nợ môn trên 10 tín', 'kiểm điểm', '124', '2026-03-12', NULL, '', '2026-03-13 15:59:17'),
(2, '20123456', 3, 'khenthuong', 'KHEN THUONG HK1', 'HK1', '23', '2026-02-20', NULL, '', '2026-03-14 07:36:25');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `khoa`
--

CREATE TABLE `khoa` (
  `makhoa` varchar(50) NOT NULL,
  `tenkhoa` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `khoa`
--

INSERT INTO `khoa` (`makhoa`, `tenkhoa`) VALUES
('CNTT', 'Công nghệ Thông tin'),
('KTCS', 'Kỹ thuật Cơ khí'),
('QTKD', 'Quản trị Kinh doanh');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `loaihoatdong`
--

CREATE TABLE `loaihoatdong` (
  `maloaihoatdong` int(11) NOT NULL,
  `tenloai` varchar(255) NOT NULL,
  `mota` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `loaihoatdong`
--

INSERT INTO `loaihoatdong` (`maloaihoatdong`, `tenloai`, `mota`, `created_at`, `updated_at`) VALUES
(1, 'Hoạt động tình nguyện', 'Các hoạt động tình nguyện, từ thiện', '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
(2, 'Hoạt động văn nghệ', 'Các hoạt động văn nghệ, biểu diễn', '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
(3, 'Hoạt động thể thao', 'Các hoạt động thể thao, thi đấu', '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
(4, 'Hoạt động học thuật', 'Các hoạt động nghiên cứu, học thuật', '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
(5, 'Hoạt động xã hội', 'Các hoạt động xã hội khác', '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
(6, 'CLB', 'Câu lạc bộ', '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
(7, 'Thi đua', 'Các cuộc thi, thi đua', '2026-03-01 04:27:39', '2026-03-01 04:27:39');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `loai_dichvu`
--

CREATE TABLE `loai_dichvu` (
  `maloaidichvu` int(11) NOT NULL,
  `tendichvu` varchar(255) NOT NULL,
  `mota` text DEFAULT NULL,
  `thutu` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `loai_dichvu`
--

INSERT INTO `loai_dichvu` (`maloaidichvu`, `tendichvu`, `mota`, `thutu`, `created_at`) VALUES
(1, 'Giấy xác nhận sinh viên', 'Xác nhận đang theo học tại trường', 1, '2026-03-01 04:27:40'),
(2, 'Bảng điểm', 'Xin bảng điểm học tập', 2, '2026-03-01 04:27:40'),
(3, 'Đăng ký ở KTX', 'Đăng ký nội trú Ký túc xá', 3, '2026-03-01 04:27:40'),
(4, 'Nghỉ học tạm thời', 'Đơn xin nghỉ học tạm thời', 4, '2026-03-01 04:27:40'),
(5, 'Bảo lưu', 'Đơn xin bảo lưu kết quả học tập', 5, '2026-03-01 04:27:40'),
(6, 'Tốt nghiệp', 'Đơn đăng ký tốt nghiệp', 6, '2026-03-01 04:27:40'),
(7, 'Xin chuyển điểm tiếng Anh', 'Đơn xin chuyển kết quả tiếng Anh', 7, '2026-03-01 04:27:40'),
(8, 'Xin chuyển ngành', 'Đơn xin chuyển ngành học', 8, '2026-03-01 04:27:40'),
(9, 'Xin học vượt', 'Đơn xin học vượt lên lớp cao hơn', 9, '2026-03-01 04:27:40'),
(10, 'Xin nghỉ ốm', 'Đơn xin nghỉ học do ốm đau', 10, '2026-03-01 04:27:40');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `log_suadiem`
--

CREATE TABLE `log_suadiem` (
  `id` int(11) NOT NULL,
  `mabangdiem` int(11) NOT NULL,
  `loaidiem` varchar(30) NOT NULL,
  `giatricu` decimal(4,2) DEFAULT NULL,
  `giatrimoi` decimal(4,2) DEFAULT NULL,
  `nguoisua` varchar(50) NOT NULL,
  `ngaysua` timestamp NOT NULL DEFAULT current_timestamp(),
  `lydo` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `lophanhchinh`
--

CREATE TABLE `lophanhchinh` (
  `malop` varchar(50) NOT NULL,
  `tenlop` varchar(255) NOT NULL,
  `makhoa` varchar(50) DEFAULT NULL,
  `namtuyensinh` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `lophanhchinh`
--

INSERT INTO `lophanhchinh` (`malop`, `tenlop`, `makhoa`, `namtuyensinh`) VALUES
('CNTT01', 'CNTT K17 Lớp 1', 'CNTT', 2017),
('CNTT02', 'CNTT K17 Lớp 2', 'CNTT', 2017),
('QTKD01', 'QTKD K17 Lớp 1', 'QTKD', 2017);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `lophocphan`
--

CREATE TABLE `lophocphan` (
  `malophocphan` int(11) NOT NULL,
  `mamonhoc` int(11) NOT NULL,
  `mahocky` int(11) NOT NULL,
  `magiaovien` int(11) DEFAULT NULL,
  `maphong` varchar(50) DEFAULT NULL,
  `lichhoc` varchar(255) NOT NULL,
  `sogiohoc` int(11) DEFAULT NULL,
  `soluongtoida` int(11) DEFAULT 60,
  `soluongdadangky` int(11) DEFAULT 0,
  `trangthai` enum('dangmo','dong','huy') DEFAULT 'dangmo',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ngaymodangky` datetime DEFAULT NULL COMMENT 'Th???i ??i???m m??? ????ng k??',
  `ngaykhoadangky` datetime DEFAULT NULL COMMENT 'H???t h???n ????ng k??'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `lophocphan`
--

INSERT INTO `lophocphan` (`malophocphan`, `mamonhoc`, `mahocky`, `magiaovien`, `maphong`, `lichhoc`, `sogiohoc`, `soluongtoida`, `soluongdadangky`, `trangthai`, `created_at`, `updated_at`, `ngaymodangky`, `ngaykhoadangky`) VALUES
(6, 2, 3, 1, 'A101', 'T2 9h', NULL, 60, 0, 'dangmo', '2026-03-14 04:57:48', '2026-03-14 04:57:48', NULL, NULL),
(7, 1, 3, 2, 'B201', 't7 9h', NULL, 60, 0, 'dangmo', '2026-03-14 04:59:18', '2026-03-14 04:59:18', NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `monhoc`
--

CREATE TABLE `monhoc` (
  `mamonhoc` int(11) NOT NULL,
  `tenmonhoc` varchar(255) NOT NULL,
  `sotinchi` int(11) NOT NULL DEFAULT 3,
  `makhoa` varchar(50) DEFAULT NULL,
  `mota` text DEFAULT NULL,
  `hocphi` decimal(12,0) DEFAULT 0 COMMENT 'Học phí (VND)',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `monhoc`
--

INSERT INTO `monhoc` (`mamonhoc`, `tenmonhoc`, `sotinchi`, `makhoa`, `mota`, `hocphi`, `created_at`, `updated_at`) VALUES
(1, 'Lập Trình C++', 3, 'CNTT', 'Học lập trình C++', 2220000, '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
(2, 'Cơ Sở Dữ Liệu', 3, 'CNTT', 'Học cơ sở dữ liệu', 2220000, '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
(3, 'Lập Trình Web', 3, 'CNTT', 'Học lập trình Web', 2220000, '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
(4, 'Hệ Điều Hành', 3, 'CNTT', 'Học hệ điều hành', 2220000, '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
(5, 'Kỹ Năng Mềm', 2, 'CNTT', 'Phát triển kỹ năng mềm', 1480000, '2026-03-01 04:27:39', '2026-03-01 04:27:39');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `phonghoc`
--

CREATE TABLE `phonghoc` (
  `maphong` varchar(50) NOT NULL,
  `tenphong` varchar(100) NOT NULL,
  `succhua` int(11) DEFAULT 60,
  `toanha` varchar(100) DEFAULT NULL,
  `ghichu` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `phonghoc`
--

INSERT INTO `phonghoc` (`maphong`, `tenphong`, `succhua`, `toanha`, `ghichu`, `created_at`, `updated_at`) VALUES
('A101', 'Phòng A101', 60, 'A', NULL, '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
('A102', 'Phòng A102', 60, 'A', NULL, '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
('B201', 'Phòng B201', 40, 'B', NULL, '2026-03-01 04:27:39', '2026-03-01 04:27:39');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `phuckhao`
--

CREATE TABLE `phuckhao` (
  `maphuckhao` int(11) NOT NULL,
  `mabangdiem` int(11) NOT NULL,
  `mssv` varchar(50) NOT NULL,
  `malophocphan` int(11) NOT NULL,
  `lydo` text NOT NULL,
  `trangthai` enum('cho','dangxuly','chapnhan','tuchoi') DEFAULT 'cho',
  `ketqua` text DEFAULT NULL,
  `nguoiduyet` varchar(50) DEFAULT NULL,
  `ngayduyet` datetime DEFAULT NULL,
  `ngaygui` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `sinhvien`
--

CREATE TABLE `sinhvien` (
  `mssv` varchar(50) NOT NULL,
  `hoten` varchar(255) NOT NULL,
  `malop` varchar(50) DEFAULT NULL,
  `makhoa` varchar(50) DEFAULT NULL,
  `diachi` varchar(255) DEFAULT NULL,
  `ngaysinh` date DEFAULT NULL,
  `quequan` varchar(255) DEFAULT NULL,
  `tinhtrang` varchar(100) DEFAULT 'Đang học',
  `gioitinh` varchar(20) DEFAULT NULL,
  `khoahoc` varchar(50) DEFAULT NULL,
  `bacdaotao` varchar(100) DEFAULT NULL,
  `nganh` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT '123456',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `sinhvien`
--

INSERT INTO `sinhvien` (`mssv`, `hoten`, `malop`, `makhoa`, `diachi`, `ngaysinh`, `quequan`, `tinhtrang`, `gioitinh`, `khoahoc`, `bacdaotao`, `nganh`, `password`, `created_at`, `updated_at`) VALUES
('20123456', 'Trần Minh Quân', 'CNTT01', 'CNTT', 'HCM', '2004-08-02', 'HCM', 'Đang học', 'Nam', '2022', 'Đại học', 'CNTT', '123456', '2026-03-01 04:27:39', '2026-03-17 09:34:49'),
('20123457', 'Lê Thị Hà', 'CNTT01', 'CNTT', NULL, NULL, NULL, 'Đang học', NULL, NULL, NULL, NULL, '123456', '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
('20123458', 'Nguyễn Văn A', 'CNTT02', 'CNTT', NULL, NULL, NULL, 'Đang học', NULL, NULL, NULL, NULL, '123456', '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
('20123459', 'Phạm Thị B', 'QTKD01', 'QTKD', NULL, NULL, NULL, 'Đang học', NULL, NULL, NULL, NULL, '123456', '2026-03-01 04:27:39', '2026-03-01 04:27:39'),
('2254810304', 'LYLY', 'CNTT01', 'CNTT', 'TÂN BÌNH', '2004-11-29', 'VĨNH LONG', 'Đang học', 'Nữ', '2022', 'ĐẠI HỌC', 'CÔNG NGHỆ THÔNG TIN', '123456', '2026-03-13 16:54:42', '2026-03-13 17:00:21');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `sinhvien_hocbong`
--

CREATE TABLE `sinhvien_hocbong` (
  `id` int(11) NOT NULL,
  `mssv` varchar(50) NOT NULL,
  `mahocbong` int(11) NOT NULL,
  `trangthai` enum('duyet','tuchoi') DEFAULT 'duyet',
  `ngayxet` date DEFAULT NULL,
  `nguoixet` varchar(50) DEFAULT NULL,
  `ghichu` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `thamgiahoatdong`
--

CREATE TABLE `thamgiahoatdong` (
  `mathamgia` int(11) NOT NULL,
  `mahoatdong` int(11) NOT NULL,
  `mssv` varchar(50) NOT NULL,
  `vaitro` enum('thamgia','tochuc','truongnhom') DEFAULT 'thamgia',
  `trangthai` enum('dangky','duocduyet','tuchoi','hoanthanh') DEFAULT 'dangky',
  `diemcong` int(11) DEFAULT 0,
  `ghichu` text DEFAULT NULL,
  `ngaydangky` timestamp NOT NULL DEFAULT current_timestamp(),
  `ngayduyet` datetime DEFAULT NULL,
  `nguoiduyet` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `thamgiahoatdong`
--

INSERT INTO `thamgiahoatdong` (`mathamgia`, `mahoatdong`, `mssv`, `vaitro`, `trangthai`, `diemcong`, `ghichu`, `ngaydangky`, `ngayduyet`, `nguoiduyet`, `created_at`, `updated_at`) VALUES
(4, 6, '20123456', 'thamgia', 'duocduyet', 0, NULL, '2026-03-03 18:01:31', '2026-03-04 01:02:20', 'ctsv', '2026-03-03 18:01:31', '2026-03-03 18:02:20'),
(5, 6, '20123457', 'thamgia', 'dangky', 0, NULL, '2026-03-03 18:01:58', NULL, NULL, '2026-03-03 18:01:58', '2026-03-03 18:01:58'),
(7, 8, '20123457', 'thamgia', 'duocduyet', 0, NULL, '2026-03-08 01:39:20', '2026-03-08 08:40:09', 'ctsv', '2026-03-08 01:39:20', '2026-03-08 01:40:09'),
(8, 8, '2254810304', 'thamgia', 'dangky', 0, NULL, '2026-03-13 17:16:11', NULL, NULL, '2026-03-13 17:16:11', '2026-03-13 17:16:11'),
(9, 8, '20123456', 'thamgia', 'dangky', 0, NULL, '2026-03-14 03:50:46', NULL, NULL, '2026-03-14 03:50:46', '2026-03-14 03:50:46');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `thongbao`
--

CREATE TABLE `thongbao` (
  `mathongbao` int(11) NOT NULL,
  `tieude` varchar(500) NOT NULL,
  `noidung` text DEFAULT NULL,
  `loai` enum('truong','lop','nhacnho','lichthi','deadline_hocphi','khac','nhacnho_drl','nhacnho_hoso') NOT NULL DEFAULT 'khac',
  `malop` varchar(50) DEFAULT NULL,
  `mahocky` int(11) DEFAULT NULL,
  `han_xem` date DEFAULT NULL,
  `guiemail` tinyint(1) DEFAULT 0,
  `nguoitao` varchar(50) DEFAULT NULL,
  `ngaytao` timestamp NOT NULL DEFAULT current_timestamp(),
  `nguoi_nhan` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Danh sách MSSV nhận thông báo (null = tất cả)' CHECK (json_valid(`nguoi_nhan`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `thongbao`
--

INSERT INTO `thongbao` (`mathongbao`, `tieude`, `noidung`, `loai`, `malop`, `mahocky`, `han_xem`, `guiemail`, `nguoitao`, `ngaytao`, `nguoi_nhan`) VALUES
(1, 'hii', 'hhhhhh', 'lop', 'CNTT01', NULL, '2026-03-03', 0, '2', '2026-03-03 18:05:37', NULL),
(2, 'hehehe', 'alo alo', 'lop', 'QTKD01', NULL, '2026-03-18', 0, '2', '2026-03-10 16:50:08', NULL),
(4, 'Lịch thi GDTC Bóng chuyền', 'THI CUỐI KỲ I', 'truong', NULL, NULL, '2025-04-23', 0, '1', '2026-03-14 03:55:26', NULL),
(5, 'Nhắc nhở hoàn thành BHYT', 'BHYT', 'truong', NULL, NULL, '2025-03-20', 0, '2', '2026-03-14 06:47:56', NULL),
(6, 'Thực hiện đánh giá điểm rèn luyện Hk1', 'ĐRL', 'lop', 'QTKD01', NULL, '2026-03-19', 0, '2', '2026-03-14 07:27:20', NULL),
(10, 'Nhắc nhở: Nộp phiếu tự đánh giá điểm rèn luyện', 'Kính gửi các bạn sinh viên,\n\nHạn nộp phiếu tự đánh giá điểm rèn luyện (DRL) đang đến gần. Vui lòng đăng nhập hệ thống và hoàn thành phiếu tự đánh giá trước thời hạn quy định.\n\nTrân trọng,\nPhòng Công tác Sinh viên', 'nhacnho_drl', NULL, 4, NULL, 0, '2', '2026-03-21 05:37:25', '[\"20123456\",\"20123457\",\"20123458\",\"20123459\",\"2254810304\"]'),
(11, 'Nhắc nhở: Hoàn thiện thông tin hồ sơ sinh viên', 'Kính gửi các bạn sinh viên,\n\nHồ sơ của bạn trong hệ thống còn thiếu một số thông tin bắt buộc. Vui lòng đăng nhập và cập nhật đầy đủ thông tin cá nhân (ngày sinh, giới tính, địa chỉ, v.v.) để tránh ảnh hưởng đến các thủ tục hành chính.\n\nTrân trọng,\nPhòng Công tác Sinh viên', 'nhacnho_hoso', NULL, 4, NULL, 0, '2', '2026-03-21 05:40:45', '[\"20123459\"]'),
(12, 'Nhắc nhở: Nộp phiếu tự đánh giá điểm rèn luyện', 'Kính gửi các bạn sinh viên,\n\nHạn nộp phiếu tự đánh giá điểm rèn luyện (DRL) đang đến gần. Vui lòng đăng nhập hệ thống và hoàn thành phiếu tự đánh giá trước thời hạn quy định.\n\nTrân trọng,\nPhòng Công tác Sinh viên', 'nhacnho_drl', NULL, 4, NULL, 0, '2', '2026-03-21 05:41:17', '[\"20123459\"]');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tieuchi_diemrenluyen`
--

CREATE TABLE `tieuchi_diemrenluyen` (
  `matieuchi` int(11) NOT NULL,
  `tentieuchi` varchar(255) NOT NULL,
  `diemtoida` int(11) NOT NULL DEFAULT 100,
  `loaitieuchi` enum('hoatdong','hoc_tap','ky_luat','khac') DEFAULT 'hoatdong',
  `mota` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `tieuchi_diemrenluyen`
--

INSERT INTO `tieuchi_diemrenluyen` (`matieuchi`, `tentieuchi`, `diemtoida`, `loaitieuchi`, `mota`, `created_at`, `updated_at`) VALUES
(1, 'Tham gia hoạt động tình nguyện', 20, 'hoatdong', 'Điểm tham gia tình nguyện', '2026-03-01 04:27:40', '2026-03-01 04:27:40'),
(2, 'Tham gia hoạt động văn nghệ', 15, 'hoatdong', 'Điểm tham gia văn nghệ', '2026-03-01 04:27:40', '2026-03-01 04:27:40'),
(3, 'Tham gia hoạt động thể thao', 15, 'hoatdong', 'Điểm tham gia thể thao', '2026-03-01 04:27:40', '2026-03-01 04:27:40'),
(4, 'Tổ chức hoạt động', 20, 'hoatdong', 'Điểm tổ chức hoạt động', '2026-03-01 04:27:40', '2026-03-01 04:27:40'),
(5, 'Điểm học tập', 30, 'hoc_tap', 'Điểm dựa trên kết quả học tập', '2026-03-01 04:27:40', '2026-03-01 04:27:40'),
(6, 'Chấp hành kỷ luật', 20, 'ky_luat', 'Điểm chấp hành nội quy', '2026-03-01 04:27:40', '2026-03-01 04:27:40');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `hoten` varchar(255) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('admin','giangvien','ctsv','khoa') NOT NULL DEFAULT 'giangvien',
  `magiaovien` int(11) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `makhoa` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `hoten`, `email`, `role`, `magiaovien`, `status`, `created_at`, `makhoa`) VALUES
(1, 'admin', 'admin123', 'Quản Trị Viên', 'admin@hva.edu.vn', 'admin', NULL, 'active', '2026-03-01 04:27:39', NULL),
(2, 'ctsv', 'ctsv123', 'Phòng CTSV', 'ctsv@hva.edu.vn', 'ctsv', NULL, 'active', '2026-03-01 04:27:39', NULL),
(3, 'nguyenvanc', 'password123', 'TS. Nguyễn Văn C', 'nguyenvanc@hva.edu.vn', 'giangvien', 1, 'active', '2026-03-01 04:27:39', 'CNTT'),
(4, 'tranthid', 'password123', 'TS. Trần Thị D', 'tranthid@hva.edu.vn', 'giangvien', 2, 'active', '2026-03-01 04:27:39', 'QTKD'),
(5, 'khoa_cntt', '123456', 'Ban Quản Lý Khoa CNTT', 'khoa.cntt@hva.edu.vn', 'khoa', NULL, 'active', '2026-03-20 17:21:13', 'CNTT'),
(6, 'khoa_qtkd', '123456', 'Ban Quản Lý Khoa QTKD', 'khoa.qtkd@hva.edu.vn', 'khoa', NULL, 'active', '2026-03-20 17:21:13', 'QTKD');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `bangdiem`
--
ALTER TABLE `bangdiem`
  ADD PRIMARY KEY (`mabangdiem`),
  ADD UNIQUE KEY `unique_grade` (`malophocphan`,`mssv`),
  ADD KEY `idx_mssv` (`mssv`),
  ADD KEY `idx_malophocphan` (`malophocphan`);

--
-- Chỉ mục cho bảng `config`
--
ALTER TABLE `config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `config_key` (`config_key`);

--
-- Chỉ mục cho bảng `dichvu_sinhvien`
--
ALTER TABLE `dichvu_sinhvien`
  ADD PRIMARY KEY (`madon`),
  ADD KEY `maloaidichvu` (`maloaidichvu`),
  ADD KEY `idx_mssv` (`mssv`),
  ADD KEY `idx_trangthai` (`trangthai`),
  ADD KEY `idx_ngaygui` (`ngaygui`);

--
-- Chỉ mục cho bảng `diemrenluyen`
--
ALTER TABLE `diemrenluyen`
  ADD PRIMARY KEY (`madiemrenluyen`),
  ADD UNIQUE KEY `unique_score` (`mssv`,`mahocky`),
  ADD KEY `mahocky` (`mahocky`);

--
-- Chỉ mục cho bảng `drl_tudanhgia`
--
ALTER TABLE `drl_tudanhgia`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_tudanhgia` (`mssv`,`mahocky`),
  ADD KEY `mahocky` (`mahocky`);

--
-- Chỉ mục cho bảng `giangvien`
--
ALTER TABLE `giangvien`
  ADD PRIMARY KEY (`magiaovien`),
  ADD KEY `makhoa` (`makhoa`);

--
-- Chỉ mục cho bảng `hoatdong`
--
ALTER TABLE `hoatdong`
  ADD PRIMARY KEY (`mahoatdong`),
  ADD KEY `maloaihoatdong` (`maloaihoatdong`),
  ADD KEY `magiaovien_pt` (`magiaovien_pt`);

--
-- Chỉ mục cho bảng `hocbong`
--
ALTER TABLE `hocbong`
  ADD PRIMARY KEY (`mahocbong`),
  ADD KEY `mahocky` (`mahocky`);

--
-- Chỉ mục cho bảng `hocky`
--
ALTER TABLE `hocky`
  ADD PRIMARY KEY (`mahocky`);

--
-- Chỉ mục cho bảng `hocphi_payments`
--
ALTER TABLE `hocphi_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_fee_enrollment` (`mssv`,`malophocphan`),
  ADD KEY `idx_mssv` (`mssv`),
  ADD KEY `idx_malophocphan` (`malophocphan`);

--
-- Chỉ mục cho bảng `khenthuong_kyluat`
--
ALTER TABLE `khenthuong_kyluat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_mssv` (`mssv`),
  ADD KEY `idx_mahocky` (`mahocky`);

--
-- Chỉ mục cho bảng `khoa`
--
ALTER TABLE `khoa`
  ADD PRIMARY KEY (`makhoa`);

--
-- Chỉ mục cho bảng `loaihoatdong`
--
ALTER TABLE `loaihoatdong`
  ADD PRIMARY KEY (`maloaihoatdong`);

--
-- Chỉ mục cho bảng `loai_dichvu`
--
ALTER TABLE `loai_dichvu`
  ADD PRIMARY KEY (`maloaidichvu`);

--
-- Chỉ mục cho bảng `log_suadiem`
--
ALTER TABLE `log_suadiem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mabangdiem` (`mabangdiem`);

--
-- Chỉ mục cho bảng `lophanhchinh`
--
ALTER TABLE `lophanhchinh`
  ADD PRIMARY KEY (`malop`),
  ADD KEY `makhoa` (`makhoa`);

--
-- Chỉ mục cho bảng `lophocphan`
--
ALTER TABLE `lophocphan`
  ADD PRIMARY KEY (`malophocphan`),
  ADD KEY `magiaovien` (`magiaovien`),
  ADD KEY `maphong` (`maphong`),
  ADD KEY `idx_mahocky` (`mahocky`),
  ADD KEY `idx_mamonhoc` (`mamonhoc`);

--
-- Chỉ mục cho bảng `monhoc`
--
ALTER TABLE `monhoc`
  ADD PRIMARY KEY (`mamonhoc`),
  ADD KEY `idx_makhoa` (`makhoa`);

--
-- Chỉ mục cho bảng `phonghoc`
--
ALTER TABLE `phonghoc`
  ADD PRIMARY KEY (`maphong`);

--
-- Chỉ mục cho bảng `phuckhao`
--
ALTER TABLE `phuckhao`
  ADD PRIMARY KEY (`maphuckhao`),
  ADD KEY `mabangdiem` (`mabangdiem`),
  ADD KEY `mssv` (`mssv`),
  ADD KEY `malophocphan` (`malophocphan`);

--
-- Chỉ mục cho bảng `sinhvien`
--
ALTER TABLE `sinhvien`
  ADD PRIMARY KEY (`mssv`),
  ADD KEY `malop` (`malop`),
  ADD KEY `makhoa` (`makhoa`);

--
-- Chỉ mục cho bảng `sinhvien_hocbong`
--
ALTER TABLE `sinhvien_hocbong`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_student_scholarship` (`mssv`,`mahocbong`),
  ADD KEY `mahocbong` (`mahocbong`);

--
-- Chỉ mục cho bảng `thamgiahoatdong`
--
ALTER TABLE `thamgiahoatdong`
  ADD PRIMARY KEY (`mathamgia`),
  ADD UNIQUE KEY `unique_participation` (`mahoatdong`,`mssv`),
  ADD KEY `mssv` (`mssv`);

--
-- Chỉ mục cho bảng `thongbao`
--
ALTER TABLE `thongbao`
  ADD PRIMARY KEY (`mathongbao`),
  ADD KEY `mahocky` (`mahocky`),
  ADD KEY `idx_loai` (`loai`),
  ADD KEY `idx_malop` (`malop`),
  ADD KEY `idx_ngaytao` (`ngaytao`);

--
-- Chỉ mục cho bảng `tieuchi_diemrenluyen`
--
ALTER TABLE `tieuchi_diemrenluyen`
  ADD PRIMARY KEY (`matieuchi`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `magiaovien` (`magiaovien`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `bangdiem`
--
ALTER TABLE `bangdiem`
  MODIFY `mabangdiem` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `config`
--
ALTER TABLE `config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `dichvu_sinhvien`
--
ALTER TABLE `dichvu_sinhvien`
  MODIFY `madon` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `diemrenluyen`
--
ALTER TABLE `diemrenluyen`
  MODIFY `madiemrenluyen` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `drl_tudanhgia`
--
ALTER TABLE `drl_tudanhgia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `giangvien`
--
ALTER TABLE `giangvien`
  MODIFY `magiaovien` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `hoatdong`
--
ALTER TABLE `hoatdong`
  MODIFY `mahoatdong` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `hocbong`
--
ALTER TABLE `hocbong`
  MODIFY `mahocbong` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `hocky`
--
ALTER TABLE `hocky`
  MODIFY `mahocky` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `hocphi_payments`
--
ALTER TABLE `hocphi_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `khenthuong_kyluat`
--
ALTER TABLE `khenthuong_kyluat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `loaihoatdong`
--
ALTER TABLE `loaihoatdong`
  MODIFY `maloaihoatdong` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `loai_dichvu`
--
ALTER TABLE `loai_dichvu`
  MODIFY `maloaidichvu` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT cho bảng `log_suadiem`
--
ALTER TABLE `log_suadiem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT cho bảng `lophocphan`
--
ALTER TABLE `lophocphan`
  MODIFY `malophocphan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `monhoc`
--
ALTER TABLE `monhoc`
  MODIFY `mamonhoc` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `phuckhao`
--
ALTER TABLE `phuckhao`
  MODIFY `maphuckhao` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `sinhvien_hocbong`
--
ALTER TABLE `sinhvien_hocbong`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `thamgiahoatdong`
--
ALTER TABLE `thamgiahoatdong`
  MODIFY `mathamgia` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `thongbao`
--
ALTER TABLE `thongbao`
  MODIFY `mathongbao` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT cho bảng `tieuchi_diemrenluyen`
--
ALTER TABLE `tieuchi_diemrenluyen`
  MODIFY `matieuchi` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `bangdiem`
--
ALTER TABLE `bangdiem`
  ADD CONSTRAINT `bangdiem_ibfk_1` FOREIGN KEY (`malophocphan`) REFERENCES `lophocphan` (`malophocphan`) ON DELETE CASCADE,
  ADD CONSTRAINT `bangdiem_ibfk_2` FOREIGN KEY (`mssv`) REFERENCES `sinhvien` (`mssv`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `dichvu_sinhvien`
--
ALTER TABLE `dichvu_sinhvien`
  ADD CONSTRAINT `dichvu_sinhvien_ibfk_1` FOREIGN KEY (`mssv`) REFERENCES `sinhvien` (`mssv`) ON DELETE CASCADE,
  ADD CONSTRAINT `dichvu_sinhvien_ibfk_2` FOREIGN KEY (`maloaidichvu`) REFERENCES `loai_dichvu` (`maloaidichvu`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `diemrenluyen`
--
ALTER TABLE `diemrenluyen`
  ADD CONSTRAINT `diemrenluyen_ibfk_1` FOREIGN KEY (`mssv`) REFERENCES `sinhvien` (`mssv`) ON DELETE CASCADE,
  ADD CONSTRAINT `diemrenluyen_ibfk_2` FOREIGN KEY (`mahocky`) REFERENCES `hocky` (`mahocky`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `drl_tudanhgia`
--
ALTER TABLE `drl_tudanhgia`
  ADD CONSTRAINT `drl_tudanhgia_ibfk_1` FOREIGN KEY (`mssv`) REFERENCES `sinhvien` (`mssv`) ON DELETE CASCADE,
  ADD CONSTRAINT `drl_tudanhgia_ibfk_2` FOREIGN KEY (`mahocky`) REFERENCES `hocky` (`mahocky`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `giangvien`
--
ALTER TABLE `giangvien`
  ADD CONSTRAINT `giangvien_ibfk_1` FOREIGN KEY (`makhoa`) REFERENCES `khoa` (`makhoa`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `hoatdong`
--
ALTER TABLE `hoatdong`
  ADD CONSTRAINT `hoatdong_ibfk_1` FOREIGN KEY (`maloaihoatdong`) REFERENCES `loaihoatdong` (`maloaihoatdong`) ON DELETE CASCADE,
  ADD CONSTRAINT `hoatdong_ibfk_2` FOREIGN KEY (`magiaovien_pt`) REFERENCES `giangvien` (`magiaovien`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `hocbong`
--
ALTER TABLE `hocbong`
  ADD CONSTRAINT `hocbong_ibfk_1` FOREIGN KEY (`mahocky`) REFERENCES `hocky` (`mahocky`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `hocphi_payments`
--
ALTER TABLE `hocphi_payments`
  ADD CONSTRAINT `hocphi_payments_ibfk_1` FOREIGN KEY (`mssv`) REFERENCES `sinhvien` (`mssv`) ON DELETE CASCADE,
  ADD CONSTRAINT `hocphi_payments_ibfk_2` FOREIGN KEY (`malophocphan`) REFERENCES `lophocphan` (`malophocphan`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `khenthuong_kyluat`
--
ALTER TABLE `khenthuong_kyluat`
  ADD CONSTRAINT `khenthuong_kyluat_ibfk_1` FOREIGN KEY (`mssv`) REFERENCES `sinhvien` (`mssv`) ON DELETE CASCADE,
  ADD CONSTRAINT `khenthuong_kyluat_ibfk_2` FOREIGN KEY (`mahocky`) REFERENCES `hocky` (`mahocky`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `log_suadiem`
--
ALTER TABLE `log_suadiem`
  ADD CONSTRAINT `log_suadiem_ibfk_1` FOREIGN KEY (`mabangdiem`) REFERENCES `bangdiem` (`mabangdiem`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `lophanhchinh`
--
ALTER TABLE `lophanhchinh`
  ADD CONSTRAINT `lophanhchinh_ibfk_1` FOREIGN KEY (`makhoa`) REFERENCES `khoa` (`makhoa`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `lophocphan`
--
ALTER TABLE `lophocphan`
  ADD CONSTRAINT `lophocphan_ibfk_1` FOREIGN KEY (`mamonhoc`) REFERENCES `monhoc` (`mamonhoc`) ON DELETE CASCADE,
  ADD CONSTRAINT `lophocphan_ibfk_2` FOREIGN KEY (`mahocky`) REFERENCES `hocky` (`mahocky`) ON DELETE CASCADE,
  ADD CONSTRAINT `lophocphan_ibfk_3` FOREIGN KEY (`magiaovien`) REFERENCES `giangvien` (`magiaovien`) ON DELETE SET NULL,
  ADD CONSTRAINT `lophocphan_ibfk_4` FOREIGN KEY (`maphong`) REFERENCES `phonghoc` (`maphong`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `monhoc`
--
ALTER TABLE `monhoc`
  ADD CONSTRAINT `monhoc_ibfk_1` FOREIGN KEY (`makhoa`) REFERENCES `khoa` (`makhoa`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `phuckhao`
--
ALTER TABLE `phuckhao`
  ADD CONSTRAINT `phuckhao_ibfk_1` FOREIGN KEY (`mabangdiem`) REFERENCES `bangdiem` (`mabangdiem`) ON DELETE CASCADE,
  ADD CONSTRAINT `phuckhao_ibfk_2` FOREIGN KEY (`mssv`) REFERENCES `sinhvien` (`mssv`) ON DELETE CASCADE,
  ADD CONSTRAINT `phuckhao_ibfk_3` FOREIGN KEY (`malophocphan`) REFERENCES `lophocphan` (`malophocphan`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `sinhvien`
--
ALTER TABLE `sinhvien`
  ADD CONSTRAINT `sinhvien_ibfk_1` FOREIGN KEY (`malop`) REFERENCES `lophanhchinh` (`malop`) ON DELETE SET NULL,
  ADD CONSTRAINT `sinhvien_ibfk_2` FOREIGN KEY (`makhoa`) REFERENCES `khoa` (`makhoa`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `sinhvien_hocbong`
--
ALTER TABLE `sinhvien_hocbong`
  ADD CONSTRAINT `sinhvien_hocbong_ibfk_1` FOREIGN KEY (`mssv`) REFERENCES `sinhvien` (`mssv`) ON DELETE CASCADE,
  ADD CONSTRAINT `sinhvien_hocbong_ibfk_2` FOREIGN KEY (`mahocbong`) REFERENCES `hocbong` (`mahocbong`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `thamgiahoatdong`
--
ALTER TABLE `thamgiahoatdong`
  ADD CONSTRAINT `thamgiahoatdong_ibfk_1` FOREIGN KEY (`mahoatdong`) REFERENCES `hoatdong` (`mahoatdong`) ON DELETE CASCADE,
  ADD CONSTRAINT `thamgiahoatdong_ibfk_2` FOREIGN KEY (`mssv`) REFERENCES `sinhvien` (`mssv`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `thongbao`
--
ALTER TABLE `thongbao`
  ADD CONSTRAINT `thongbao_ibfk_1` FOREIGN KEY (`mahocky`) REFERENCES `hocky` (`mahocky`) ON DELETE SET NULL,
  ADD CONSTRAINT `thongbao_ibfk_2` FOREIGN KEY (`malop`) REFERENCES `lophanhchinh` (`malop`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`magiaovien`) REFERENCES `giangvien` (`magiaovien`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
