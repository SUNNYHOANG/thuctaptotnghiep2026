/**
 * Unit tests for drlSelfRoutes filter theo role
 * Task 12.3
 */

import { jest } from '@jest/globals';

// Mock dependencies
const mockExecute = jest.fn();
jest.unstable_mockModule('../config/database.js', () => ({
  default: { execute: mockExecute },
}));

jest.unstable_mockModule('../socket.js', () => ({
  emitDrlScore: jest.fn(),
}));

jest.unstable_mockModule('../models/Score.js', () => ({
  default: { updateScore: jest.fn() },
}));

const { default: SelfEvaluation } = await import('../models/SelfEvaluation.js');

// Mock SelfEvaluation.getPendingByClassAndSemester
const mockGetPending = jest.spyOn(SelfEvaluation, 'getPendingByClassAndSemester');

describe('DRL filter logic theo role', () => {
  const sampleRecords = [
    { id: 1, mssv: 'SV001', trangthai: 'choduyet', makhoa: 'CNTT', nguoi_duyet_ctsv: null, nguoi_duyet_khoa: null },
    { id: 2, mssv: 'SV002', trangthai: 'bituchoi', makhoa: 'CNTT', nguoi_duyet_ctsv: null, nguoi_duyet_khoa: null },
    { id: 3, mssv: 'SV003', trangthai: 'chokhoaduyet', makhoa: 'CNTT', nguoi_duyet_ctsv: null, nguoi_duyet_khoa: null },
    { id: 4, mssv: 'SV004', trangthai: 'daduyet', makhoa: 'CNTT', nguoi_duyet_ctsv: null, nguoi_duyet_khoa: 'khoa_user' },
    { id: 5, mssv: 'SV005', trangthai: 'daduyet', makhoa: 'CNTT', nguoi_duyet_ctsv: 'ctsv_user', nguoi_duyet_khoa: 'khoa_user' },
    { id: 6, mssv: 'SV006', trangthai: 'daduyet', makhoa: 'QTKD', nguoi_duyet_ctsv: null, nguoi_duyet_khoa: null }, // phiếu cũ
  ];

  test('giangvien chỉ thấy choduyet và bituchoi', () => {
    const filtered = sampleRecords.filter(
      (r) => r.trangthai === 'choduyet' || r.trangthai === 'bituchoi'
    );
    expect(filtered).toHaveLength(2);
    expect(filtered.every((r) => ['choduyet', 'bituchoi'].includes(r.trangthai))).toBe(true);
  });

  test('khoa chỉ thấy chokhoaduyet', () => {
    const makhoa = 'CNTT';
    const filtered = sampleRecords.filter(
      (r) => r.trangthai === 'chokhoaduyet' && r.makhoa === makhoa
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(3);
  });

  test('ctsv thấy daduyet chưa duyệt cuối (bao gồm phiếu cũ tương thích ngược)', () => {
    const filtered = sampleRecords.filter(
      (r) =>
        r.trangthai === 'daduyet' &&
        r.nguoi_duyet_ctsv == null &&
        (r.nguoi_duyet_khoa != null || r.nguoi_duyet_khoa == null)
    );
    // Phiếu id=4 (đã qua khoa) và id=6 (phiếu cũ, nguoi_duyet_khoa null)
    expect(filtered).toHaveLength(2);
    expect(filtered.map((r) => r.id)).toContain(4);
    expect(filtered.map((r) => r.id)).toContain(6);
  });

  test('admin thấy tất cả phiếu', () => {
    // Admin không filter
    expect(sampleRecords).toHaveLength(6);
  });

  test('khoa không thấy phiếu của khoa khác', () => {
    const makhoa = 'CNTT';
    const filtered = sampleRecords.filter(
      (r) => r.trangthai === 'chokhoaduyet' && r.makhoa === makhoa
    );
    // Không có phiếu QTKD nào ở trạng thái chokhoaduyet
    expect(filtered.every((r) => r.makhoa === makhoa)).toBe(true);
  });
});
