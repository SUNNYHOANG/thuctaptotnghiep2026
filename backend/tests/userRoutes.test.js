/**
 * Unit tests for userRoutes POST với role='khoa' thiếu makhoa
 * Task 12.2
 */

import { jest } from '@jest/globals';
import express from 'express';

// Mock database pool
const mockExecute = jest.fn();
const mockPool = { execute: mockExecute };

jest.unstable_mockModule('../config/database.js', () => ({
  default: mockPool,
}));

// Import after mocking
const { default: userRoutes } = await import('../routes/userRoutes.js');

// Simple test helper to simulate request/response
function createMockReqRes(body = {}, params = {}, query = {}, headers = {}) {
  const req = {
    body,
    params,
    query,
    headers,
    user: headers['x-user-role'] ? { role: headers['x-user-role'], makhoa: headers['x-user-makhoa'] } : {},
  };
  const res = {
    statusCode: 200,
    data: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; },
  };
  return { req, res };
}

describe('POST /api/users - validate makhoa cho role khoa', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  test('role=khoa thiếu makhoa → trả về 400', async () => {
    const { req, res } = createMockReqRes({
      username: 'khoa_test',
      password: 'pass123',
      role: 'khoa',
      makhoa: null,
    });

    // Tìm route handler POST /
    const app = express();
    app.use(express.json());
    app.use('/', userRoutes);

    await new Promise((resolve) => {
      const mockRes = {
        statusCode: 200,
        _data: null,
        status(code) { this.statusCode = code; return this; },
        json(data) { this._data = data; resolve({ statusCode: this.statusCode, data }); return this; },
      };
      // Simulate the route handler directly
      const handler = userRoutes.stack.find(
        (layer) => layer.route?.path === '/' && layer.route?.methods?.post
      );
      if (handler) {
        handler.route.stack[0].handle(req, mockRes, () => {});
      } else {
        resolve({ statusCode: 500, data: { error: 'Route not found' } });
      }
    }).then(({ statusCode, data }) => {
      expect(statusCode).toBe(400);
      expect(data.error).toContain('makhoa');
    });
  });

  test('role=khoa makhoa rỗng → trả về 400', async () => {
    const req = {
      body: { username: 'khoa_test2', password: 'pass123', role: 'khoa', makhoa: '' },
      params: {},
      query: {},
      headers: {},
      user: {},
    };

    let responseStatus = 200;
    let responseData = null;
    const res = {
      status(code) { responseStatus = code; return this; },
      json(data) { responseData = data; return this; },
    };

    // Find and call the POST / handler
    const postHandler = userRoutes.stack.find(
      (layer) => layer.route?.path === '/' && layer.route?.methods?.post
    );

    if (postHandler) {
      await postHandler.route.stack[0].handle(req, res, () => {});
      expect(responseStatus).toBe(400);
      expect(responseData.error).toContain('makhoa');
    }
  });

  test('role=giangvien không cần makhoa → không báo lỗi makhoa', async () => {
    // Mock: username chưa tồn tại
    mockExecute.mockResolvedValueOnce([[]]); // SELECT existing
    mockExecute.mockResolvedValueOnce([{ insertId: 1 }]); // INSERT

    const req = {
      body: { username: 'gv_test', password: 'pass123', role: 'giangvien' },
      params: {},
      query: {},
      headers: {},
      user: {},
    };

    let responseStatus = 200;
    let responseData = null;
    const res = {
      status(code) { responseStatus = code; return this; },
      json(data) { responseData = data; return this; },
    };

    const postHandler = userRoutes.stack.find(
      (layer) => layer.route?.path === '/' && layer.route?.methods?.post
    );

    if (postHandler) {
      await postHandler.route.stack[0].handle(req, res, () => {});
      expect(responseStatus).toBe(201);
    }
  });
});

describe('GET /students/incomplete-profile - phân quyền và logic', () => {
  beforeEach(() => {
    mockExecute.mockReset();
  });

  // Helper tìm route handler GET /students/incomplete-profile
  function getIncompleteProfileHandler() {
    return userRoutes.stack.find(
      (layer) =>
        layer.route?.path === '/students/incomplete-profile' &&
        layer.route?.methods?.get
    );
  }

  test('role=admin → trả về data và total', async () => {
    const fakeRows = [
      { mssv: 'SV001', hoten: null, malop: 'CNTT01', makhoa: 'CNTT', ngaysinh: null, gioitinh: null },
    ];
    mockExecute.mockResolvedValueOnce([fakeRows]);

    const req = {
      body: {},
      params: {},
      query: {},
      headers: { 'x-user-role': 'admin' },
      user: { role: 'admin' },
    };
    let responseStatus = 200;
    let responseData = null;
    const res = {
      status(code) { responseStatus = code; return this; },
      json(data) { responseData = data; return this; },
    };

    const handler = getIncompleteProfileHandler();
    expect(handler).toBeTruthy();
    await handler.route.stack[0].handle(req, res, () => {});

    expect(responseStatus).toBe(200);
    expect(responseData).toEqual({ data: fakeRows, total: 1 });
  });

  test('role=ctsv → trả về data và total', async () => {
    mockExecute.mockResolvedValueOnce([[]]);

    const req = {
      body: {},
      params: {},
      query: {},
      headers: { 'x-user-role': 'ctsv' },
      user: { role: 'ctsv' },
    };
    let responseStatus = 200;
    let responseData = null;
    const res = {
      status(code) { responseStatus = code; return this; },
      json(data) { responseData = data; return this; },
    };

    const handler = getIncompleteProfileHandler();
    await handler.route.stack[0].handle(req, res, () => {});

    expect(responseStatus).toBe(200);
    expect(responseData).toEqual({ data: [], total: 0 });
  });

  test('role=giangvien → trả về 403', async () => {
    const req = {
      body: {},
      params: {},
      query: {},
      headers: { 'x-user-role': 'giangvien' },
      user: { role: 'giangvien' },
    };
    let responseStatus = 200;
    let responseData = null;
    const res = {
      status(code) { responseStatus = code; return this; },
      json(data) { responseData = data; return this; },
    };

    const handler = getIncompleteProfileHandler();
    await handler.route.stack[0].handle(req, res, () => {});

    expect(responseStatus).toBe(403);
    expect(responseData.error).toBeTruthy();
  });

  test('role=sinhvien → trả về 403', async () => {
    const req = {
      body: {},
      params: {},
      query: {},
      headers: { 'x-user-role': 'sinhvien' },
      user: { role: 'sinhvien' },
    };
    let responseStatus = 200;
    let responseData = null;
    const res = {
      status(code) { responseStatus = code; return this; },
      json(data) { responseData = data; return this; },
    };

    const handler = getIncompleteProfileHandler();
    await handler.route.stack[0].handle(req, res, () => {});

    expect(responseStatus).toBe(403);
  });

  test('không có role → trả về 403', async () => {
    const req = {
      body: {},
      params: {},
      query: {},
      headers: {},
      user: {},
    };
    let responseStatus = 200;
    let responseData = null;
    const res = {
      status(code) { responseStatus = code; return this; },
      json(data) { responseData = data; return this; },
    };

    const handler = getIncompleteProfileHandler();
    await handler.route.stack[0].handle(req, res, () => {});

    expect(responseStatus).toBe(403);
  });

  test('lỗi database → trả về 500', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));

    const req = {
      body: {},
      params: {},
      query: {},
      headers: { 'x-user-role': 'admin' },
      user: { role: 'admin' },
    };
    let responseStatus = 200;
    let responseData = null;
    const res = {
      status(code) { responseStatus = code; return this; },
      json(data) { responseData = data; return this; },
    };

    const handler = getIncompleteProfileHandler();
    await handler.route.stack[0].handle(req, res, () => {});

    expect(responseStatus).toBe(500);
    expect(responseData.error).toBe('Lỗi hệ thống, vui lòng thử lại');
  });
});
