import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useUrlMssv } from '../utils/useUrlMssv';

const createWrapper = (initialEntries = ['/']) =>
  ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );

describe('useUrlMssv', () => {
  // Test đọc đúng giá trị từ URL
  it('URL có ?mssv=SV001 → hook trả về SV001', () => {
    const { result } = renderHook(() => useUrlMssv(), {
      wrapper: createWrapper(['/?mssv=SV001']),
    });
    const [mssv] = result.current;
    expect(mssv).toBe('SV001');
  });

  it('URL không có ?mssv → hook trả về chuỗi rỗng', () => {
    const { result } = renderHook(() => useUrlMssv(), {
      wrapper: createWrapper(['/']),
    });
    const [mssv] = result.current;
    expect(mssv).toBe('');
  });

  // Test cập nhật URL khi set
  it('setMssv(SV002) → URL được cập nhật với ?mssv=SV002', () => {
    const { result } = renderHook(() => useUrlMssv(), {
      wrapper: createWrapper(['/']),
    });
    act(() => {
      const [, setMssv] = result.current;
      setMssv('SV002');
    });
    const [mssv] = result.current;
    expect(mssv).toBe('SV002');
  });

  it('setMssv("") → URL được xóa param mssv', () => {
    const { result } = renderHook(() => useUrlMssv(), {
      wrapper: createWrapper(['/?mssv=SV001']),
    });
    act(() => {
      const [, setMssv] = result.current;
      setMssv('');
    });
    const [mssv] = result.current;
    expect(mssv).toBe('');
  });
});
