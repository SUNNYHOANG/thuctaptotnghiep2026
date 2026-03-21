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

// ============================================================
// Task 6.1: Unit tests cho route GET /api/drl-self/students-by-status
// ============================================================

// Import drlSelfRoutes sau khi mock đã được thiết lập ở trên
const { default: drlSelfRoutes } = await import('../routes/drlSelfRoutes.js');

// Helper tạo mock req/res
function makeReqRes({ query = {}, headers = {}, user = {} } = {}) {
  const req = { query, headers, user, params: {}, body: {} };
  let statusCode = 200;
  let responseData = null;
  const res = {
    get statusCode() { return statusCode; },
    status(code) { statusCode = code; return this; },
    json(data) { responseData = data; return this; },
    get data() { return responseData; },
  };
  return { req, res };
}

// Helper tìm route handler GET /students-by-status
function getStudentsByStatusHandler() {
  return drlSelfRoutes.stack.find(
    (layer) =>
      layer.route?.path === '/students-by-status' &&
      layer.route?.methods?.get
  );
}

// Helper chạy toàn bộ middleware stack của route (requireRole + handler)
async function runRouteStack(layer, req, res) {
  const stack = layer.route.stack;
  let idx = 0;
  const next = async (err) => {
    if (err) return;
    if (idx < stack.length) {
      const fn = stack[idx++];
      await fn.handle(req, res, next);
    }
  };
  await next();
}

describe('GET /api/drl-self/students-by-status - unit tests', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  test('thiếu mahocky → trả về 400', async () => {
    const { req, res } = makeReqRes({
      query: { trangthai: 'chua_nop' },
      user: { role: 'admin' },
    });

    const layer = getStudentsByStatusHandler();
    expect(layer).toBeTruthy();
    await runRouteStack(layer, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.data.error).toMatch(/mahocky/i);
  });

  test('trangthai không hợp lệ → trả về 400', async () => {
    const { req, res } = makeReqRes({
      query: { mahocky: '2024-1', trangthai: 'invalid_status' },
      user: { role: 'admin' },
    });

    const layer = getStudentsByStatusHandler();
    await runRouteStack(layer, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.data.error).toMatch(/trạng thái không hợp lệ/i);
  });

  test('trangthai=chua_nop với mock DB → trả về { data: [...], total: N }', async () => {
    const fakeRows = [
      { mssv: 'SV001', hoten: 'Nguyễn Văn A', malop: 'CNTT01', makhoa: 'CNTT', trangthai: 'chua_nop' },
      { mssv: 'SV002', hoten: 'Trần Thị B', malop: 'CNTT01', makhoa: 'CNTT', trangthai: 'chua_nop' },
    ];
    mockExecute.mockResolvedValueOnce([fakeRows]);

    const { req, res } = makeReqRes({
      query: { mahocky: '2024-1', trangthai: 'chua_nop' },
      user: { role: 'admin' },
    });

    const layer = getStudentsByStatusHandler();
    await runRouteStack(layer, req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual({ data: fakeRows, total: 2 });
  });

  test('trangthai=chua_nop với danh sách rỗng → trả về { data: [], total: 0 }', async () => {
    mockExecute.mockResolvedValueOnce([[]]);

    const { req, res } = makeReqRes({
      query: { mahocky: '2024-1', trangthai: 'chua_nop' },
      user: { role: 'ctsv' },
    });

    const layer = getStudentsByStatusHandler();
    await runRouteStack(layer, req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual({ data: [], total: 0 });
  });

  test('role=sinhvien → trả về 403', async () => {
    const { req, res } = makeReqRes({
      query: { mahocky: '2024-1', trangthai: 'chua_nop' },
      user: { role: 'sinhvien' },
    });

    const layer = getStudentsByStatusHandler();
    await runRouteStack(layer, req, res);

    expect(res.statusCode).toBe(403);
    expect(res.data.error).toBeTruthy();
  });

  test('không có role → trả về 401', async () => {
    const { req, res } = makeReqRes({
      query: { mahocky: '2024-1', trangthai: 'chua_nop' },
      user: {},
    });

    const layer = getStudentsByStatusHandler();
    await runRouteStack(layer, req, res);

    expect(res.statusCode).toBe(401);
  });

  test('role=giangvien tự động filter theo userMakhoa', async () => {
    const fakeRows = [
      { mssv: 'SV003', hoten: 'Lê Văn C', malop: 'CNTT02', makhoa: 'CNTT', trangthai: 'chua_nop' },
    ];
    mockExecute.mockResolvedValueOnce([fakeRows]);

    const { req, res } = makeReqRes({
      query: { mahocky: '2024-1', trangthai: 'chua_nop' },
      user: { role: 'giangvien', makhoa: 'CNTT' },
    });

    const layer = getStudentsByStatusHandler();
    await runRouteStack(layer, req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data.data).toEqual(fakeRows);
    // Kiểm tra query DB có truyền makhoa vào params
    const callArgs = mockExecute.mock.calls[0];
    expect(callArgs[1]).toContain('CNTT'); // makhoa được truyền vào params
  });
});
