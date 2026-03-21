import { useNavigate } from 'react-router-dom';

// Feature: student-reminder-and-drl-navigation, Property 8: URL điều hướng đúng theo role
const DRL_ROUTES = {
  admin:     (mssv) => `/ctsv/quan-ly-diem-ren-luyen?mssv=${mssv}`,
  ctsv:      (mssv) => `/ctsv/quan-ly-diem-ren-luyen?mssv=${mssv}`,
  giangvien: (mssv) => `/giangvien/diem-ren-luyen-tu-danh-gia?mssv=${mssv}`,
  khoa:      (mssv) => `/khoa/drl-review?mssv=${mssv}`,
};

/**
 * Nút điều hướng nhanh đến trang DRL tương ứng với role.
 * @param {string} mssv - Mã số sinh viên
 * @param {string} role - Role của người dùng hiện tại
 */
const DrlNavigationButton = ({ mssv, role }) => {
  const navigate = useNavigate();

  // Ẩn hoàn toàn nếu role không hợp lệ
  if (!DRL_ROUTES[role]) return null;

  const isDisabled = !mssv || String(mssv).trim() === '';
  const targetUrl = isDisabled ? '' : DRL_ROUTES[role](mssv);

  const handleClick = () => {
    if (!isDisabled) navigate(targetUrl);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      title={isDisabled ? 'Chưa có MSSV' : `Xem DRL: ${targetUrl}`}
      style={{
        padding: '2px 8px',
        fontSize: '12px',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        borderRadius: '4px',
        border: '1px solid #1890ff',
        background: isDisabled ? '#f5f5f5' : '#e6f7ff',
        color: isDisabled ? '#999' : '#1890ff',
        whiteSpace: 'nowrap',
      }}
    >
      Xem DRL
    </button>
  );
};

export default DrlNavigationButton;
