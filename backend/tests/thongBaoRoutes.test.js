/**
 * Unit tests cho thongBaoRoutes
 * Task 6.2
 */

import { jest } from '@jest/globals';

// Mock ThongBao model
const mockCreate = jest.fn();
const mockGetAll = jest.fn();

jest.unstable_mockModule('../models/ThongBao.js', () => ({
  default: {
    create: mockCreate,
    getAll: mockGetAll,
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getForStudent: jest.fn(),
  },
}));

const { default: thongBaoRoutes } = await import('../routes/thongBaoRoutes.js');

// Helper tạo mock req/res
function makeReqRes({ body = {}, query = {}, headers = {}, user = {} } = {}) {
  const req = { body, query, headers, user, params: {} };
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

// Helper tìm route handler POST /reminder
function getPostReminderHandler() {
  return thongBaoRoutes.stack.find(
    (layer) => layer.route?.path === '/reminder' && layer.route?.methods?.post
  );
}

// Helper tìm route handler GET /reminder-history
function getGetReminderHistoryHandler() {
  return thongBaoRoutes.stack.find(
    (layer) => layer.route?.path === '/reminder-history' && layer.route?.methods?.get
  );
}

// Helper chạy toàn bộ middleware stack (requireRole + handler)
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

// ============================================================
// POST /reminder
// ============================================================
describe('POST /api/thongbao/reminder - unit tests', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockGetAll.mockReset();
  });

  test('tieude rỗng ("") → trả về 400', async () => {
    const { req, res } = makeReqRes({
      body: { tieude: '', noidung: 'noi dung', loai: 'nhacnho_drl' },
      user: { role: 'ctsv' },
    });

    const layer = getPostReminderHandler();
    expect(layer).toBeTruthy();
    await runRouteStack(layer, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.data.error).toBeTruthy();
  });

  test('tieude chỉ whitespace ("   ") → trả về 400', async () => {
    const { req, res } = makeReqRes({
      body: { tieude: '   ', noidung: 'noi dung', loai: 'nhacnho_drl' },
      user: { role: 'ctsv' },
    });

    const layer = getPostReminderHandler();
    await runRouteStack(layer, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.data.error).toBeTruthy();
  });

  test('tieude > 255 ký tự → trả về 400', async () => {
    const longTitle = 'a'.repeat(256);
    const { req, res } = makeReqRes({
      body: { tieude: longTitle, noidung: 'noi dung', loai: 'nhacnho_drl' },
      user: { role: 'ctsv' },
    });

    const layer = getPostReminderHandler();
    await runRouteStack(layer, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.data.error).toBeTruthy();
  });

  test('role=sinhvien → trả về 403', async () => {
    const { req, res } = makeReqRes({
      body: { tieude: 'Tiêu đề hợp lệ', noidung: 'noi dung' },
      user: { role: 'sinhvien' },
    });

    const layer = getPostReminderHandler();
    await runRouteStack(layer, req, res);

    expect(res.statusCode).toBe(403);
    expect(res.data.error).toBeTruthy();
  });

  test('role=khoa (không có trong allowed list) → trả về 403', async () => {
    const { req, res } = makeReqRes({
      body: { tieude: 'Tiêu đề hợp lệ', noidung: 'noi dung' },
      user: { role: 'khoa' },
    });

    const layer = getPostReminderHandler();
    await runRouteStack(layer, req, res);

    expect(res.statusCode).toBe(403);
  });

  test('role=ctsv, tieude hợp lệ → trả về 201 với so_nguoi_nhan', async () => {
    const fakeRow = { mathongbao: 1, tieude: 'Nhắc nhở DRL', loai: 'nhacnho_drl' };
    mockCreate.mockResolvedValueOnce(fakeRow);

    const mssv_list = ['SV001', 'SV002', 'SV003'];
    const { req, res } = makeReqRes({
      body: { tieude: 'Nhắc nhở DRL', noidung: 'Vui lòng nộp phiếu', loai: 'nhacnho_drl', mssv_list },
      user: { role: 'ctsv' },
    });

    const layer = getPostReminderHandler();
    await runRouteStack(layer, req, res);

    expect(res.statusCode).toBe(201);
    expect(res.data.so_nguoi_nhan).toBe(3);
    expect(res.data.mathongbao).toBe(1);
  });

  test('mssv_list là array → so_nguoi_nhan = array.length', async () => {
    const fakeRow = { mathongbao: 2, tieude: 'Nhắc nhở hồ sơ', loai: 'nhacnho_hoso' };
    mockCreate.mockResolvedValueOnce(fakeRow);

    const mssv_list = ['SV001', 'SV002'];
    const { req, res } = makeReqRes({
      body: { tieude: 'Nhắc nhở hồ sơ', loai: 'nhacnho_hoso', mssv_list },
      user: { role: 'admin' },
    });

    const layer = getPostReminderHandler();
    await runRouteStack(layer, req, res);

    expect(res.statusCode).toBe(201);
    expect(res.data.so_nguoi_nhan).toBe(mssv_list.length);
  });
});

// ============================================================
// GET /reminder-history
// ============================================================
describe('GET /api/thongbao/reminder-history - unit tests', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockGetAll.mockReset();
  });

  test('role=admin → trả về 200 với { data, total }', async () => {
    const fakeRows = [
      { mathongbao: 1, tieude: 'Nhắc nhở 1', loai: 'nhacnho_drl', ngaytao: '2024-01-01' },
      { mathongbao: 2, tieude: 'Nhắc nhở 2', loai: 'nhacnho_hoso', ngaytao: '2024-01-02' },
    ];
    // getAll được gọi 2 lần (nhacnho_drl + nhacnho_hoso)
    mockGetAll.mockResolvedValueOnce([fakeRows[0]]);
    mockGetAll.mockResolvedValueOnce([fakeRows[1]]);

    const { req, res } = makeReqRes({
      query: {},
      user: { role: 'admin' },
    });

    const layer = getGetReminderHistoryHandler();
    expect(layer).toBeTruthy();
    await runRouteStack(layer, req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data).toHaveProperty('data');
    expect(res.data).toHaveProperty('total');
    expect(res.data.total).toBe(2);
  });

  test('role=sinhvien → trả về 403', async () => {
    const { req, res } = makeReqRes({
      query: {},
      user: { role: 'sinhvien' },
    });

    const layer = getGetReminderHistoryHandler();
    await runRouteStack(layer, req, res);

    expect(res.statusCode).toBe(403);
    expect(res.data.error).toBeTruthy();
  });
});
