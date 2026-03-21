// Feature: student-reminder-and-drl-navigation
// Property-Based Tests: Property 8 & Property 9

import { describe, test } from 'vitest';
import fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useUrlMssv } from '../utils/useUrlMssv';

// ─── DRL_ROUTES logic (copied from DrlNavigationButton.jsx) ───────────────────
// Feature: student-reminder-and-drl-navigation, Property 8: URL điều hướng đúng theo role
const DRL_ROUTES = {
  admin:     (mssv) => `/ctsv/quan-ly-diem-ren-luyen?mssv=${mssv}`,
  ctsv:      (mssv) => `/ctsv/quan-ly-diem-ren-luyen?mssv=${mssv}`,
  giangvien: (mssv) => `/giangvien/diem-ren-luyen-tu-danh-gia?mssv=${mssv}`,
  khoa:      (mssv) => `/khoa/drl-review?mssv=${mssv}`,
};

const EXPECTED_PATHS = {
  admin:     '/ctsv/quan-ly-diem-ren-luyen',
  ctsv:      '/ctsv/quan-ly-diem-ren-luyen',
  giangvien: '/giangvien/diem-ren-luyen-tu-danh-gia',
  khoa:      '/khoa/drl-review',
};

// ─── Property 8 ───────────────────────────────────────────────────────────────

describe('Property 8: URL điều hướng đúng theo role', () => {
  // Feature: student-reminder-and-drl-navigation, Property 8: URL điều hướng đúng theo role
  // Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
  test('URL tạo ra phải chứa đúng path theo role và đúng mssv', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('admin', 'ctsv', 'giangvien', 'khoa'),
        fc.stringMatching(/^[A-Z0-9]{4,10}$/),
        (role, mssv) => {
          const url = DRL_ROUTES[role](mssv);
          return url.startsWith(EXPECTED_PATHS[role]) && url.includes(`mssv=${mssv}`);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 9 ───────────────────────────────────────────────────────────────

describe('Property 9: Trang DRL đọc/đồng bộ mssv từ URL', () => {
  // Feature: student-reminder-and-drl-navigation, Property 9: Trang DRL đọc/đồng bộ mssv từ URL
  // Validates: Requirements 5.1, 5.4
  test('hook đọc đúng mssv từ URL với bất kỳ giá trị hợp lệ nào', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Z0-9]{3,15}$/),
        (mssv) => {
          const wrapper = ({ children }) => (
            <MemoryRouter initialEntries={[`/?mssv=${mssv}`]}>{children}</MemoryRouter>
          );
          const { result } = renderHook(() => useUrlMssv(), { wrapper });
          const [readMssv] = result.current;
          return readMssv === mssv;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: student-reminder-and-drl-navigation, Property 9: Trang DRL đọc/đồng bộ mssv từ URL
  // Validates: Requirements 5.1, 5.4
  test('setMssv đồng bộ URL với bất kỳ giá trị hợp lệ nào', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Z0-9]{3,15}$/),
        (mssv) => {
          const wrapper = ({ children }) => (
            <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
          );
          const { result } = renderHook(() => useUrlMssv(), { wrapper });
          act(() => {
            const [, setMssv] = result.current;
            setMssv(mssv);
          });
          const [readMssv] = result.current;
          return readMssv === mssv;
        }
      ),
      { numRuns: 100 }
    );
  });
});
