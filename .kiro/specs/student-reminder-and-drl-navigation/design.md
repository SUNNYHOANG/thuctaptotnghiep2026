# Tài Liệu Thiết Kế Kỹ Thuật

## Feature: student-reminder-and-drl-navigation

---

## Tổng Quan

Feature này bổ sung hai nhóm chức năng vào hệ thống quản lý sinh viên (Node.js/Express + React):

**Nhóm 1 – Nhắc nhở sinh viên có mục tiêu:**
Cho phép admin, CTSV và giảng viên lọc sinh viên theo trạng thái DRL hoặc tình trạng hồ sơ, xem trước danh sách đối tượng, rồi gửi thông báo nhắc nhở đúng mục tiêu. Trang `CTSVNhacNho` hiện tại chỉ gửi thủ công không có lọc; feature này nâng cấp trang đó và bổ sung API backend.

**Nhóm 2 – Điều hướng nhanh từ danh sách sinh viên sang trang DRL:**
Thêm nút "Xem điểm DRL" trên các trang `AdminUsers` (tab sinh viên), `KhoaStudentList`, `TeacherClassStudents`. Khi bấm, hệ thống điều hướng đến trang DRL tương ứng với role của người dùng, truyền `?mssv=` qua URL để trang DRL tự động lọc.

---

## Kiến Trúc

### Tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React)                                           │
│                                                             │
│  CTSVNhacNho (nâng cấp)                                     │
│    ├── FilterPanel (HocKy, TrangThai, Khoa, Lop)            │
│    ├── PreviewTable (danh sách SV sẽ nhận)                  │
│    ├── ReminderForm (tiêu đề, nội dung, mẫu nhanh)          │
│    └── HistoryTable (lịch sử nhắc nhở)                      │
│                                                             │
│  AdminUsers / KhoaStudentList / TeacherClassStudents        │
│    └── DrlNavigationButton (nút "Xem điểm DRL")             │
│                                                             │
│  CTSVDrlManager / DrlClassReview / KhoaDrlReview            │
│    └── useUrlMssv hook (đọc ?mssv= từ URL, tự động lọc)     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP REST
┌──────────────────────────▼──────────────────────────────────┐
│  Backend (Node.js / Express)                                │
│                                                             │
│  GET  /api/drl-self/students-by-status                      │
│       (lọc SV theo trạng thái DRL + mahocky)                │
│                                                             │
│  GET  /api/users/students/incomplete-profile                │
│       (lọc SV thiếu trường hồ sơ bắt buộc)                 │
│                                                             │
│  POST /api/thongbao/reminder                                │
│       (tạo thông báo nhắc nhở có danh sách MSSV mục tiêu)  │
│                                                             │
│  GET  /api/thongbao/reminder-history                        │
│       (lịch sử nhắc nhở đã gửi)                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Database (MySQL)                                           │
│  thongbao (mở rộng ENUM loai + thêm cột nguoi_nhan)         │
│  drl_tudanhgia (đọc, không thay đổi schema)                 │
│  sinhvien (đọc, không thay đổi schema)                      │
└─────────────────────────────────────────────────────────────┘
```

### Luồng dữ liệu chính

**Luồng nhắc nhở:**
1. Người dùng chọn bộ lọc (HocKy, TrangThai DRL, Khoa, Lớp) → gọi `GET /api/drl-self/students-by-status`
2. Backend trả về danh sách MSSV khớp bộ lọc → Frontend hiển thị PreviewTable
3. Người dùng nhập tiêu đề/nội dung → bấm "Gửi" → gọi `POST /api/thongbao/reminder`
4. Backend tạo bản ghi `thongbao` với `loai='nhacnho_drl'` và `nguoi_nhan` chứa danh sách MSSV

**Luồng điều hướng DRL:**
1. Người dùng bấm nút "Xem điểm DRL" trên hàng sinh viên
2. Frontend xác định URL đích theo role → `navigate(url + '?mssv=' + mssv)`
3. Trang DRL đích đọc `useSearchParams()` → tự động điền ô tìm kiếm và tải dữ liệu

---

## Các Thành Phần Và Giao Diện

### Backend

#### 1. Route mới: `GET /api/drl-self/students-by-status`

Trả về danh sách sinh viên theo trạng thái DRL trong một học kỳ.

**Query params:**
- `mahocky` (bắt buộc): mã học kỳ
- `trangthai`: `chua_nop` | `choduyet` | `chokhoaduyet` | `bituchoi` | `daduyet`
- `makhoa` (tùy chọn): lọc theo khoa
- `malop` (tùy chọn): lọc theo lớp

**Phân quyền:** `admin`, `ctsv`, `giangvien`, `khoa`

**Logic `trangthai = 'chua_nop'`:**
```sql
SELECT s.mssv, s.hoten, s.malop, s.makhoa
FROM sinhvien s
WHERE s.mssv NOT IN (
  SELECT mssv FROM drl_tudanhgia WHERE mahocky = ?
)
-- + filter makhoa/malop nếu có
```

**Logic các trạng thái khác:**
```sql
SELECT t.mssv, s.hoten, s.malop, s.makhoa, t.trangthai, t.tong_diem
FROM drl_tudanhgia t
JOIN sinhvien s ON t.mssv = s.mssv
WHERE t.mahocky = ? AND t.trangthai = ?
-- + filter makhoa/malop nếu có
```

**Giới hạn theo role:**
- `giangvien` hoặc `khoa`: tự động thêm `AND s.makhoa = req.user.makhoa`
- `ctsv` hoặc `admin`: không giới hạn, dùng filter từ query params

#### 2. Route mới: `GET /api/users/students/incomplete-profile`

Trả về sinh viên có ít nhất một trường bắt buộc bị null/rỗng.

**Phân quyền:** `admin`, `ctsv`

**Logic:**
```sql
SELECT mssv, hoten, malop, makhoa
FROM sinhvien
WHERE hoten IS NULL OR hoten = ''
   OR ngaysinh IS NULL
   OR gioitinh IS NULL OR gioitinh = ''
   OR malop IS NULL OR malop = ''
   OR makhoa IS NULL OR makhoa = ''
```

#### 3. Route mới: `POST /api/thongbao/reminder`

Tạo thông báo nhắc nhở có danh sách MSSV mục tiêu.

**Body:**
```json
{
  "tieude": "string (1-255 ký tự, bắt buộc)",
  "noidung": "string (tùy chọn)",
  "loai": "nhacnho_drl | nhacnho_hoso",
  "mahocky": "number (tùy chọn)",
  "mssv_list": ["SV001", "SV002"],
  "malop": "string (tùy chọn)",
  "makhoa": "string (tùy chọn)"
}
```

**Phân quyền:** `admin`, `ctsv`, `giangvien`

**Logic:** Gọi `ThongBao.create()` với `nguoi_nhan = JSON.stringify(mssv_list)` và `loai` tương ứng.

#### 4. Route mới: `GET /api/thongbao/reminder-history`

Trả về lịch sử thông báo nhắc nhở đã gửi.

**Query params:** `loai` (tùy chọn), `mahocky` (tùy chọn)

**Phân quyền:** `admin`, `ctsv`, `giangvien`

**Logic:** `ThongBao.getAll({ loai: 'nhacnho_drl' | 'nhacnho_hoso', ... })`

### Frontend

#### 1. Component `DrlNavigationButton`

Component dùng chung, nhận `mssv` và `userRole`, trả về nút điều hướng.

```jsx
// frontend/src/components/DrlNavigationButton.jsx
const DRL_ROUTES = {
  admin:      (mssv) => `/ctsv/quan-ly-diem-ren-luyen?mssv=${mssv}`,
  ctsv:       (mssv) => `/ctsv/quan-ly-diem-ren-luyen?mssv=${mssv}`,
  giangvien:  (mssv) => `/giangvien/diem-ren-luyen-tu-danh-gia?mssv=${mssv}`,
  khoa:       (mssv) => `/khoa/drl-review?mssv=${mssv}`,
};
```

Props: `mssv: string`, `role: string`, `disabled?: boolean`

Hiển thị tooltip với URL đích khi hover. Ẩn hoàn toàn nếu role không hợp lệ.

#### 2. Nâng cấp `CTSVNhacNho`

Thêm các state và UI:
- `filterHocky`, `filterTrangthai`, `filterKhoa`, `filterLop`: bộ lọc
- `previewList`: danh sách SV xem trước (từ API)
- `templates`: mảng mẫu nhắc nhở nhanh
- `historyRows`: lịch sử nhắc nhở

Luồng UI:
1. Chọn bộ lọc → bấm "Xem trước" → gọi API → hiển thị PreviewTable
2. Nếu `previewList.length === 0`: hiển thị cảnh báo, vô hiệu hóa nút gửi
3. Nhập tiêu đề/nội dung (hoặc chọn mẫu) → bấm "Gửi nhắc nhở"
4. Sau khi gửi: hiển thị xác nhận với số lượng người nhận

#### 3. Hook `useUrlMssv`

```js
// frontend/src/utils/useUrlMssv.js
import { useSearchParams } from 'react-router-dom';
export function useUrlMssv() {
  const [params, setParams] = useSearchParams();
  const mssv = params.get('mssv') || '';
  const setMssv = (val) => {
    if (val) setParams({ mssv: val });
    else setParams({});
  };
  return [mssv, setMssv];
}
```

#### 4. Tích hợp `useUrlMssv` vào các trang DRL

- `CTSVDrlManager`: thêm state `filterMssv` khởi tạo từ `useUrlMssv()`, tự động gọi `loadData()` khi có `mssv` từ URL
- `DrlClassReview`: tương tự, thêm ô tìm kiếm MSSV, đồng bộ với URL
- `KhoaDrlReview`: tương tự

#### 5. Tích hợp `DrlNavigationButton` vào các trang danh sách sinh viên

- `AdminUsers` (tab sinh viên): thêm cột "Hành động" với `DrlNavigationButton`
- `KhoaStudentList`: thêm cột "Hành động" với `DrlNavigationButton`
- `TeacherClassStudents`: thêm cột "Hành động" với `DrlNavigationButton`

---

## Mô Hình Dữ Liệu

### Thay đổi bảng `thongbao`

Cần mở rộng ENUM `loai` và thêm cột `nguoi_nhan`:

```sql
-- Migration: thêm loại nhắc nhở mới
ALTER TABLE thongbao
  MODIFY COLUMN loai ENUM(
    'truong', 'lop', 'nhacnho', 'lichthi', 'deadline_hocphi', 'khac',
    'nhacnho_drl', 'nhacnho_hoso'
  ) NOT NULL DEFAULT 'khac';

-- Thêm cột lưu danh sách MSSV mục tiêu (JSON array)
ALTER TABLE thongbao
  ADD COLUMN nguoi_nhan JSON NULL COMMENT 'Danh sách MSSV nhận thông báo (null = tất cả)';
```

**Lý do dùng JSON:** Danh sách MSSV có thể rất lớn (hàng trăm sinh viên), JSON linh hoạt hơn bảng quan hệ riêng cho use case này. Nếu cần query ngược (tìm thông báo của một MSSV), có thể dùng `JSON_CONTAINS`.

### Cập nhật model `ThongBao.js`

- `getForStudent()`: bổ sung điều kiện lọc `nhacnho_drl` và `nhacnho_hoso` khi `mssv` của sinh viên nằm trong `nguoi_nhan`
- `create()`: nhận thêm trường `nguoi_nhan`

### Không thay đổi schema

- `drl_tudanhgia`: chỉ đọc
- `sinhvien`: chỉ đọc

### Cấu trúc response API

**`GET /api/drl-self/students-by-status`:**
```json
{
  "data": [
    { "mssv": "SV001", "hoten": "Nguyễn Văn A", "malop": "CNTT01", "makhoa": "CNTT", "trangthai": "chua_nop" }
  ],
  "total": 1
}
```

**`POST /api/thongbao/reminder`:**
```json
{
  "mathongbao": 42,
  "tieude": "Nhắc nộp phiếu DRL",
  "loai": "nhacnho_drl",
  "nguoi_nhan": ["SV001", "SV002"],
  "so_nguoi_nhan": 2,
  "ngaytao": "2025-01-15T10:00:00Z"
}
```

---

## Thuộc Tính Đúng Đắn (Correctness Properties)

*Một thuộc tính (property) là đặc điểm hoặc hành vi phải đúng trong mọi lần thực thi hợp lệ của hệ thống — về cơ bản là một phát biểu hình thức về những gì hệ thống phải làm. Các thuộc tính đóng vai trò cầu nối giữa đặc tả dạng ngôn ngữ tự nhiên và các đảm bảo đúng đắn có thể kiểm chứng tự động.*

### Property 1: Danh sách sinh viên chưa nộp không giao với danh sách đã nộp

*Với bất kỳ* học kỳ nào, tập hợp MSSV trả về bởi `trangthai='chua_nop'` và tập hợp MSSV có bản ghi trong `drl_tudanhgia` cho học kỳ đó phải rỗng giao nhau (disjoint).

**Validates: Requirements 1.1, 2.2**

### Property 2: Lọc theo trạng thái trả về đúng trạng thái

*Với bất kỳ* học kỳ và trạng thái DRL hợp lệ nào, mọi bản ghi trong kết quả trả về phải có `trangthai` khớp với tham số lọc.

**Validates: Requirements 2.1, 2.5**

### Property 3: Giảng viên và khoa chỉ thấy sinh viên thuộc khoa mình

*Với bất kỳ* người dùng có role `giangvien` hoặc `khoa`, mọi sinh viên trong kết quả trả về phải có `makhoa` bằng `makhoa` của người dùng đó.

**Validates: Requirements 2.3**

### Property 4: Tiêu đề rỗng bị từ chối

*Với bất kỳ* chuỗi tiêu đề nào chỉ gồm ký tự khoảng trắng hoặc chuỗi rỗng, yêu cầu tạo nhắc nhở phải bị từ chối với HTTP 400.

**Validates: Requirements 1.5**

### Property 5: Tiêu đề vượt 255 ký tự bị từ chối

*Với bất kỳ* chuỗi tiêu đề nào có độ dài > 255 ký tự, yêu cầu tạo nhắc nhở phải bị từ chối với HTTP 400.

**Validates: Requirements 1.5**

### Property 6: Người dùng không có quyền bị từ chối 403

*Với bất kỳ* người dùng có role không thuộc `{admin, ctsv, giangvien}`, yêu cầu gửi nhắc nhở phải bị từ chối với HTTP 403.

**Validates: Requirements 1.4**

### Property 7: Thông báo nhắc nhở hiển thị cho sinh viên trong danh sách

*Với bất kỳ* thông báo loại `nhacnho_drl` nào có `nguoi_nhan` chứa MSSV của sinh viên S, khi sinh viên S truy vấn danh sách thông báo, thông báo đó phải xuất hiện trong kết quả.

**Validates: Requirements 1.6**

### Property 8: Điều hướng DRL đúng theo role

*Với bất kỳ* người dùng có role hợp lệ (`admin`, `ctsv`, `giangvien`, `khoa`) và bất kỳ MSSV hợp lệ nào, URL đích được tạo ra phải chứa `?mssv={mssv}` và trỏ đến trang DRL tương ứng với role đó.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 9: Trang DRL đọc đúng MSSV từ URL

*Với bất kỳ* URL nào có query parameter `?mssv={mssv}`, trang DRL phải khởi tạo ô tìm kiếm với giá trị `mssv` đó và tải dữ liệu tương ứng.

**Validates: Requirements 5.1, 5.4**

### Property 10: Sinh viên thiếu hồ sơ có ít nhất một trường bắt buộc null/rỗng

*Với bất kỳ* sinh viên nào trong kết quả `GET /api/users/students/incomplete-profile`, ít nhất một trong các trường `{hoten, ngaysinh, gioitinh, malop, makhoa}` phải là null hoặc chuỗi rỗng.

**Validates: Requirements 7.1**

---

## Xử Lý Lỗi

### Backend

| Tình huống | HTTP Status | Thông báo |
|---|---|---|
| Role không có quyền gửi nhắc nhở | 403 | "Bạn không có quyền gửi nhắc nhở" |
| Role không có quyền xem hồ sơ thiếu | 403 | "Bạn không có quyền truy cập chức năng này" |
| Tiêu đề rỗng hoặc chỉ khoảng trắng | 400 | "Tiêu đề không được để trống" |
| Tiêu đề vượt 255 ký tự | 400 | "Tiêu đề không được vượt quá 255 ký tự" |
| `mahocky` không tồn tại | 400 | "Học kỳ không hợp lệ" |
| `trangthai` không hợp lệ | 400 | "Trạng thái không hợp lệ. Các giá trị hợp lệ: chua_nop, choduyet, chokhoaduyet, bituchoi, daduyet" |
| Lỗi database | 500 | "Lỗi hệ thống, vui lòng thử lại" |

### Frontend

- Khi `previewList` rỗng: hiển thị cảnh báo màu vàng, vô hiệu hóa nút "Gửi nhắc nhở"
- Khi API lỗi: hiển thị thông báo lỗi inline, không crash trang
- Khi `mssv` trong URL không tìm thấy phiếu DRL: hiển thị thông báo "Sinh viên {mssv} chưa có phiếu tự đánh giá nào"
- Khi `mssv` không hợp lệ (null/rỗng): vô hiệu hóa `DrlNavigationButton`
- Khi role không hợp lệ: ẩn `DrlNavigationButton` hoàn toàn

---

## Chiến Lược Kiểm Thử

### Kiểm thử đơn vị (Unit Tests)

Tập trung vào các ví dụ cụ thể và điều kiện biên:

- `GET /api/drl-self/students-by-status` với `trangthai='chua_nop'` trả về đúng danh sách
- `POST /api/thongbao/reminder` với tiêu đề rỗng trả về 400
- `POST /api/thongbao/reminder` với role `sinhvien` trả về 403
- `DrlNavigationButton` với role `khoa` tạo URL `/khoa/drl-review?mssv=SV001`
- `DrlNavigationButton` với role không hợp lệ không render nút
- `useUrlMssv` đọc đúng giá trị từ URL và cập nhật URL khi set

### Kiểm thử thuộc tính (Property-Based Tests)

Sử dụng thư viện **fast-check** (JavaScript/TypeScript) cho cả backend và frontend.

Cấu hình: tối thiểu **100 lần lặp** mỗi property test.

Mỗi test phải có comment tag theo định dạng:
`// Feature: student-reminder-and-drl-navigation, Property {N}: {mô tả}`

**Property tests cần triển khai:**

```
// Feature: student-reminder-and-drl-navigation, Property 1: Danh sách chua_nop disjoint với đã nộp
// Feature: student-reminder-and-drl-navigation, Property 2: Lọc trangthai trả về đúng trạng thái
// Feature: student-reminder-and-drl-navigation, Property 3: GV/Khoa chỉ thấy SV khoa mình
// Feature: student-reminder-and-drl-navigation, Property 4: Tiêu đề rỗng/whitespace bị từ chối 400
// Feature: student-reminder-and-drl-navigation, Property 5: Tiêu đề > 255 ký tự bị từ chối 400
// Feature: student-reminder-and-drl-navigation, Property 6: Role không hợp lệ bị từ chối 403
// Feature: student-reminder-and-drl-navigation, Property 7: SV trong nguoi_nhan thấy thông báo
// Feature: student-reminder-and-drl-navigation, Property 8: URL điều hướng đúng theo role
// Feature: student-reminder-and-drl-navigation, Property 9: Trang DRL đọc mssv từ URL
// Feature: student-reminder-and-drl-navigation, Property 10: SV thiếu hồ sơ có trường null/rỗng
```

**Ví dụ property test (Property 8):**

```js
// Feature: student-reminder-and-drl-navigation, Property 8: URL điều hướng đúng theo role
import fc from 'fast-check';

const VALID_ROLES = ['admin', 'ctsv', 'giangvien', 'khoa'];
const EXPECTED_PATHS = {
  admin:     '/ctsv/quan-ly-diem-ren-luyen',
  ctsv:      '/ctsv/quan-ly-diem-ren-luyen',
  giangvien: '/giangvien/diem-ren-luyen-tu-danh-gia',
  khoa:      '/khoa/drl-review',
};

test('Property 8: URL điều hướng đúng theo role', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...VALID_ROLES),
      fc.stringMatching(/^[A-Z0-9]{4,10}$/),
      (role, mssv) => {
        const url = buildDrlUrl(role, mssv);
        return url.startsWith(EXPECTED_PATHS[role]) && url.includes(`mssv=${mssv}`);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Ví dụ property test (Property 4 + 5 kết hợp):**

```js
// Feature: student-reminder-and-drl-navigation, Property 4+5: Tiêu đề không hợp lệ bị từ chối
test('Property 4+5: Tiêu đề không hợp lệ bị từ chối 400', () => {
  fc.assert(
    fc.property(
      fc.oneof(
        fc.stringMatching(/^\s*$/),                    // chỉ whitespace
        fc.string({ minLength: 256, maxLength: 500 })  // quá dài
      ),
      async (invalidTitle) => {
        const res = await request(app)
          .post('/api/thongbao/reminder')
          .set('x-user-role', 'ctsv')
          .send({ tieude: invalidTitle, loai: 'nhacnho_drl' });
        return res.status === 400;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Kiểm thử tích hợp

- Luồng đầy đủ: lọc SV → xem trước → gửi nhắc nhở → SV thấy thông báo
- Luồng điều hướng: bấm nút trên `KhoaStudentList` → URL đúng → `KhoaDrlReview` tự lọc
- Kiểm tra phân quyền: giảng viên không thấy SV khoa khác
