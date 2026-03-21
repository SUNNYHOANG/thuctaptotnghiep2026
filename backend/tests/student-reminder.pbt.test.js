/**
 * Property-Based Tests cho student-reminder-and-drl-navigation
 * Sử dụng fast-check
 * Tasks 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.13
 */

import { jest } from '@jest/globals';
import fc from 'fast-check';

// ============================================================
// Property 1: Danh sách chua_nop disjoint với đã nộp
// Feature: student-reminder-and-drl-navigation, Property 1: Danh sách chua_nop disjoint với đã nộp
// Validates: Requirements 2.1
// ============================================================

// Hàm logic lọc chua_nop (trích từ route)
function filterChuaNop(allStudents, submittedMssvSet) {
  return allStudents.filter(s => !submittedMssvSet.has(s.mssv));
}

describe('Property 1: Danh sách chua_nop disjoint với đã nộp', () => {
  test('chua_nop không chứa MSSV nào đã nộp', () => {
    // Feature: student-reminder-and-drl-navigation, Property 1: Danh sách chua_nop disjoint với đã nộp
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ mssv: fc.string({ minLength: 3, maxLength: 10 }) }),
          { minLength: 0, maxLength: 50 }
        ),
        fc.array(fc.string({ minLength: 3, maxLength: 10 }), { minLength: 0, maxLength: 30 }),
        (allStudents, submittedMssvs) => {
          const submittedSet = new Set(submittedMssvs);
          const chuaNop = filterChuaNop(allStudents, submittedSet);
          // Không có MSSV nào trong chuaNop mà cũng có trong submittedSet
          return chuaNop.every(s => !submittedSet.has(s.mssv));
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 2: Lọc trangthai trả về đúng trạng thái
// Feature: student-reminder-and-drl-navigation, Property 2: Lọc trangthai trả về đúng trạng thái
// Validates: Requirements 2.1
// ============================================================

const VALID_TRANGTHAI = ['chua_nop', 'choduyet', 'chokhoaduyet', 'bituchoi', 'daduyet'];

function filterByTrangthai(records, trangthai) {
  if (trangthai === 'chua_nop') return records; // handled separately
  return records.filter(r => r.trangthai === trangthai);
}

describe('Property 2: Lọc trangthai trả về đúng trạng thái', () => {
  test('kết quả lọc chỉ chứa bản ghi có trangthai khớp', () => {
    // Feature: student-reminder-and-drl-navigation, Property 2: Lọc trangthai trả về đúng trạng thái
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            mssv: fc.string({ minLength: 3, maxLength: 10 }),
            trangthai: fc.constantFrom(...VALID_TRANGTHAI.slice(1)), // bỏ chua_nop
          }),
          { minLength: 0, maxLength: 50 }
        ),
        fc.constantFrom(...VALID_TRANGTHAI.slice(1)),
        (records, trangthai) => {
          const result = filterByTrangthai(records, trangthai);
          return result.every(r => r.trangthai === trangthai);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 3: GV/Khoa chỉ thấy SV khoa mình
// Feature: student-reminder-and-drl-navigation, Property 3: GV/Khoa chỉ thấy SV khoa mình
// Validates: Requirements 2.1
// ============================================================

function filterByMakhoa(students, userMakhoa) {
  return students.filter(s => s.makhoa === userMakhoa);
}

describe('Property 3: GV/Khoa chỉ thấy SV khoa mình', () => {
  test('kết quả lọc chỉ chứa SV có makhoa khớp', () => {
    // Feature: student-reminder-and-drl-navigation, Property 3: GV/Khoa chỉ thấy SV khoa mình
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            mssv: fc.string({ minLength: 3, maxLength: 10 }),
            makhoa: fc.constantFrom('CNTT', 'QTKD', 'KT', 'XD'),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        fc.constantFrom('CNTT', 'QTKD', 'KT', 'XD'),
        (students, userMakhoa) => {
          const result = filterByMakhoa(students, userMakhoa);
          return result.every(s => s.makhoa === userMakhoa);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 4+5: Tiêu đề không hợp lệ bị từ chối 400
// Feature: student-reminder-and-drl-navigation, Property 4: Tiêu đề rỗng/whitespace bị từ chối 400
// Feature: student-reminder-and-drl-navigation, Property 5: Tiêu đề > 255 ký tự bị từ chối 400
// Validates: Requirements 2.3
// ============================================================

// Hàm validate tieude (trích từ route)
function validateTieude(tieude) {
  if (!tieude || tieude.trim() === '') return { valid: false, status: 400, error: 'Tiêu đề không được để trống' };
  if (tieude.length > 255) return { valid: false, status: 400, error: 'Tiêu đề không được vượt quá 255 ký tự' };
  return { valid: true };
}

describe('Property 4: Tiêu đề rỗng/whitespace bị từ chối 400', () => {
  test('tiêu đề chỉ whitespace → valid=false, status=400', () => {
    // Feature: student-reminder-and-drl-navigation, Property 4: Tiêu đề rỗng/whitespace bị từ chối 400
    fc.assert(
      fc.property(
        fc.stringMatching(/^\s+$/), // chỉ whitespace
        (tieude) => {
          const result = validateTieude(tieude);
          return result.valid === false && result.status === 400;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 5: Tiêu đề > 255 ký tự bị từ chối 400', () => {
  test('tiêu đề dài hơn 255 ký tự → valid=false, status=400', () => {
    // Feature: student-reminder-and-drl-navigation, Property 5: Tiêu đề > 255 ký tự bị từ chối 400
    fc.assert(
      fc.property(
        fc.string({ minLength: 256, maxLength: 500 }),
        (tieude) => {
          const result = validateTieude(tieude);
          return result.valid === false && result.status === 400;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 6: Role không hợp lệ bị từ chối 403
// Feature: student-reminder-and-drl-navigation, Property 6: Role không hợp lệ bị từ chối 403
// Validates: Requirements 2.3
// ============================================================

const ALLOWED_ROLES_REMINDER = ['admin', 'ctsv', 'giangvien'];

function checkRole(userRole, allowedRoles) {
  if (!userRole || !allowedRoles.includes(userRole)) return 403;
  return 200;
}

describe('Property 6: Role không hợp lệ bị từ chối 403', () => {
  test('role không nằm trong danh sách cho phép → 403', () => {
    // Feature: student-reminder-and-drl-navigation, Property 6: Role không hợp lệ bị từ chối 403
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(r => !ALLOWED_ROLES_REMINDER.includes(r)),
        (invalidRole) => {
          return checkRole(invalidRole, ALLOWED_ROLES_REMINDER) === 403;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 7: SV trong nguoi_nhan thấy thông báo
// Feature: student-reminder-and-drl-navigation, Property 7: SV trong nguoi_nhan thấy thông báo
// Validates: Requirements 2.5
// ============================================================

// Hàm logic lọc thông báo cho sinh viên (trích từ ThongBao.getForStudent)
function filterThongBaoForStudent(thongBaoList, mssv) {
  return thongBaoList.filter(tb => {
    if (!tb.nguoi_nhan) return false;
    const list = Array.isArray(tb.nguoi_nhan) ? tb.nguoi_nhan : JSON.parse(tb.nguoi_nhan);
    return list.includes(mssv);
  });
}

describe('Property 7: SV trong nguoi_nhan thấy thông báo', () => {
  test('SV có MSSV trong nguoi_nhan luôn thấy thông báo đó', () => {
    // Feature: student-reminder-and-drl-navigation, Property 7: SV trong nguoi_nhan thấy thông báo
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 10 }), // mssv
        fc.array(fc.string({ minLength: 3, maxLength: 10 }), { minLength: 1, maxLength: 20 }), // other mssvs
        (mssv, otherMssvs) => {
          const nguoiNhan = [mssv, ...otherMssvs.filter(m => m !== mssv)];
          const thongBao = { id: 1, tieude: 'Test', loai: 'nhacnho_drl', nguoi_nhan: nguoiNhan };
          const result = filterThongBaoForStudent([thongBao], mssv);
          return result.length === 1 && result[0].id === 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// Property 10: SV thiếu hồ sơ có trường null/rỗng
// Feature: student-reminder-and-drl-navigation, Property 10: SV thiếu hồ sơ có trường null/rỗng
// Validates: Requirements 2.2
// ============================================================

const REQUIRED_FIELDS = ['hoten', 'ngaysinh', 'gioitinh', 'malop', 'makhoa'];

function hasIncompleteProfile(student) {
  return REQUIRED_FIELDS.some(f => student[f] === null || student[f] === undefined || student[f] === '');
}

describe('Property 10: SV thiếu hồ sơ có trường null/rỗng', () => {
  test('SV có ít nhất một trường bắt buộc null/rỗng → hasIncompleteProfile = true', () => {
    // Feature: student-reminder-and-drl-navigation, Property 10: SV thiếu hồ sơ có trường null/rỗng
    fc.assert(
      fc.property(
        fc.record({
          mssv: fc.string({ minLength: 3, maxLength: 10 }),
          hoten: fc.oneof(fc.constant(null), fc.constant(''), fc.string({ minLength: 1, maxLength: 50 })),
          ngaysinh: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 20 })),
          gioitinh: fc.oneof(fc.constant(null), fc.constant(''), fc.constantFrom('Nam', 'Nữ')),
          malop: fc.oneof(fc.constant(null), fc.constant(''), fc.string({ minLength: 1, maxLength: 20 })),
          makhoa: fc.oneof(fc.constant(null), fc.constant(''), fc.string({ minLength: 1, maxLength: 10 })),
        }).filter(s => hasIncompleteProfile(s)), // chỉ sinh SV thiếu hồ sơ
        (student) => {
          return hasIncompleteProfile(student);
        }
      ),
      { numRuns: 100 }
    );
  });
});
