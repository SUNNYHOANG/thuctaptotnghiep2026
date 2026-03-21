import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DrlNavigationButton from '../components/DrlNavigationButton';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderButton = (props) =>
  render(
    <MemoryRouter>
      <DrlNavigationButton {...props} />
    </MemoryRouter>
  );

describe('DrlNavigationButton', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // Test URL đúng cho từng role
  it('role=admin tạo URL đúng', () => {
    renderButton({ mssv: 'SV001', role: 'admin' });
    const btn = screen.getByRole('button', { name: /Xem DRL/i });
    expect(btn).toBeInTheDocument();
    expect(btn.title).toContain('/ctsv/quan-ly-diem-ren-luyen?mssv=SV001');
  });

  it('role=ctsv tạo URL đúng', () => {
    renderButton({ mssv: 'SV001', role: 'ctsv' });
    const btn = screen.getByRole('button', { name: /Xem DRL/i });
    expect(btn.title).toContain('/ctsv/quan-ly-diem-ren-luyen?mssv=SV001');
  });

  it('role=giangvien tạo URL đúng', () => {
    renderButton({ mssv: 'SV001', role: 'giangvien' });
    const btn = screen.getByRole('button', { name: /Xem DRL/i });
    expect(btn.title).toContain('/giangvien/diem-ren-luyen-tu-danh-gia?mssv=SV001');
  });

  it('role=khoa tạo URL đúng', () => {
    renderButton({ mssv: 'SV001', role: 'khoa' });
    const btn = screen.getByRole('button', { name: /Xem DRL/i });
    expect(btn.title).toContain('/khoa/drl-review?mssv=SV001');
  });

  // Test ẩn nút khi role không hợp lệ
  it('role không hợp lệ → không render nút', () => {
    const { container } = renderButton({ mssv: 'SV001', role: 'invalid_role' });
    expect(container.firstChild).toBeNull();
  });

  it('role=sinhvien → không render nút', () => {
    const { container } = renderButton({ mssv: 'SV001', role: 'sinhvien' });
    expect(container.firstChild).toBeNull();
  });

  // Test disabled khi mssv rỗng
  it('mssv rỗng → nút disabled với title Chưa có MSSV', () => {
    renderButton({ mssv: '', role: 'admin' });
    const btn = screen.getByRole('button', { name: /Xem DRL/i });
    expect(btn).toBeDisabled();
    expect(btn.title).toBe('Chưa có MSSV');
  });

  it('mssv=null → nút disabled', () => {
    renderButton({ mssv: null, role: 'admin' });
    const btn = screen.getByRole('button', { name: /Xem DRL/i });
    expect(btn).toBeDisabled();
  });

  // Test click khi enabled → navigate được gọi đúng URL
  it('click khi enabled → navigate được gọi với đúng URL', () => {
    renderButton({ mssv: 'SV001', role: 'admin' });
    const btn = screen.getByRole('button', { name: /Xem DRL/i });
    fireEvent.click(btn);
    expect(mockNavigate).toHaveBeenCalledWith('/ctsv/quan-ly-diem-ren-luyen?mssv=SV001');
  });
});
