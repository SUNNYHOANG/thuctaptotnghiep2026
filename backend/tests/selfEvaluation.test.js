/**
 * Unit tests for SelfEvaluation.reviewByRole - case 'khoa'
 * Task 12.1
 */

import { jest } from '@jest/globals';

// Mock the database pool
const mockExecute = jest.fn();
const mockPool = { execute: mockExecute };

jest.unstable_mockModule('../config/database.js', () => ({
  default: mockPool,
}));

const { default: SelfEvaluation } = await import('../models/SelfEvaluation.js');

describe('SelfEvaluation.reviewByRole - khoa case', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  test('khoa role: cập nhật diem_khoa, nhan_xet_khoa, nguoi_duyet_khoa, ngay_duyet_khoa', async () => {
    const updatedRow = {
      id: 1,
      mssv: 'SV001',
      trangthai: 'daduyet',
      diem_khoa: 85,
      nhan_xet_khoa: 'Tốt',
      nguoi_duyet_khoa: 'khoa_user',
      ngay_duyet_khoa: new Date(),
    };

    // First call: UPDATE
    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    // Second call: SELECT
    mockExecute.mockResolvedValueOnce([[updatedRow]]);

    const result = await SelfEvaluation.reviewByRole(1, 'khoa', {
      trangthai: 'daduyet',
      diem_khoa: 85,
      nhan_xet_khoa: 'Tốt',
      nguoi_duyet: 'khoa_user',
    });

    expect(result).toEqual(updatedRow);
    expect(mockExecute).toHaveBeenCalledTimes(2);

    // Kiểm tra câu UPDATE có chứa các cột khoa
    const updateCall = mockExecute.mock.calls[0];
    expect(updateCall[0]).toContain('diem_khoa');
    expect(updateCall[0]).toContain('nhan_xet_khoa');
    expect(updateCall[0]).toContain('nguoi_duyet_khoa');
    expect(updateCall[0]).toContain('ngay_duyet_khoa');
  });

  test('khoa role: từ chối phiếu (bituchoi)', async () => {
    const updatedRow = {
      id: 2,
      mssv: 'SV002',
      trangthai: 'bituchoi',
      diem_khoa: null,
      nhan_xet_khoa: 'Cần bổ sung thêm',
      nguoi_duyet_khoa: 'khoa_user',
    };

    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    mockExecute.mockResolvedValueOnce([[updatedRow]]);

    const result = await SelfEvaluation.reviewByRole(2, 'khoa', {
      trangthai: 'bituchoi',
      nhan_xet_khoa: 'Cần bổ sung thêm',
      nguoi_duyet: 'khoa_user',
    });

    expect(result.trangthai).toBe('bituchoi');
    expect(result.nhan_xet_khoa).toBe('Cần bổ sung thêm');
  });

  test('giangvien role: chuyển trangthai sang chokhoaduyet khi duyệt', async () => {
    const updatedRow = {
      id: 3,
      mssv: 'SV003',
      trangthai: 'chokhoaduyet',
      diem_cvht: 80,
      nguoi_duyet_cvht: 'gv_user',
    };

    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    mockExecute.mockResolvedValueOnce([[updatedRow]]);

    const result = await SelfEvaluation.reviewByRole(3, 'giangvien', {
      trangthai: 'daduyet', // GV gửi 'daduyet' nhưng hệ thống chuyển sang 'chokhoaduyet'
      diem_cvht: 80,
      nguoi_duyet: 'gv_user',
    });

    expect(result.trangthai).toBe('chokhoaduyet');

    // Kiểm tra câu UPDATE dùng 'chokhoaduyet' thay vì 'daduyet'
    const updateCall = mockExecute.mock.calls[0];
    expect(updateCall[1][0]).toBe('chokhoaduyet');
  });

  test('giangvien role: từ chối giữ nguyên bituchoi', async () => {
    const updatedRow = {
      id: 4,
      mssv: 'SV004',
      trangthai: 'bituchoi',
    };

    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    mockExecute.mockResolvedValueOnce([[updatedRow]]);

    const result = await SelfEvaluation.reviewByRole(4, 'giangvien', {
      trangthai: 'bituchoi',
      nguoi_duyet: 'gv_user',
    });

    expect(result.trangthai).toBe('bituchoi');
    const updateCall = mockExecute.mock.calls[0];
    expect(updateCall[1][0]).toBe('bituchoi');
  });

  test('ctsv role: cập nhật diem_ctsv và nguoi_duyet_ctsv', async () => {
    const updatedRow = {
      id: 5,
      mssv: 'SV005',
      trangthai: 'daduyet',
      diem_ctsv: 90,
      nguoi_duyet_ctsv: 'ctsv_user',
    };

    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    mockExecute.mockResolvedValueOnce([[updatedRow]]);

    const result = await SelfEvaluation.reviewByRole(5, 'ctsv', {
      trangthai: 'daduyet',
      diem_ctsv: 90,
      nguoi_duyet: 'ctsv_user',
    });

    expect(result.diem_ctsv).toBe(90);
    expect(result.nguoi_duyet_ctsv).toBe('ctsv_user');
  });
});
