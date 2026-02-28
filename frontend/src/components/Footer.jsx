
import React from 'react';
import { useLocation } from 'react-router-dom';
import './Footer.css';


const Footer = () => {
  const location = useLocation();
  // Ẩn icon khi ở trang /login hoặc bất kỳ trang nào bắt đầu bằng /admin
  const hideSocial = location.pathname === '/login' || location.pathname.startsWith('/admin');
  return (
    <footer className="vaa-footer">
      <div className="vaa-footer__container">
        <div className="vaa-footer__logo-section">
          <div className="vaa-footer__logo">
            {/* SVG logo or image can be placed here */}
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="10,90 50,10 90,90 50,70" fill="#C9A14A" />
            </svg>
            <div className="vaa-footer__logo-text">VAA</div>
          </div>
          <div className="vaa-footer__info">
            <div>Tài nguyên số:<br />tailieuso.vaa.edu.vn/<br />opac.vaa.edu.vn</div>
            <div>ISO 9001:2015</div>
          </div>
        </div>
        <div className="vaa-footer__address">
          <b>Địa chỉ</b><br />
          <span>Trụ sở chính: 104 Nguyễn Văn Trỗi, Phường Phú Nhuận, Thành phố Hồ Chí Minh</span><br />
          <span>Cơ sở 2: 18A/1 Cộng Hòa, Phường Tân Sơn Nhất, Thành phố Hồ Chí Minh.</span><br />
          <span>Cơ sở 3: 243 Nguyễn Tất Thành, Phường Bắc Cam Ranh, tỉnh Khánh Hòa (sân bay Cam Ranh)</span>
        </div>
        <div className="vaa-footer__support">
          <b>Hỗ trợ</b><br />
          <span>Bộ phận Tuyển sinh (028) 3842 4762</span><br />
          <span>Bộ phận Công tác sinh viên (028) 3842 2199</span><br />
          <span>Phòng Đào tạo (028) 3844 9242</span><br />
          <span>Phòng Tài chính (028) 3842 4761</span><br />
          <span>Văn thư (028) 3844 2251</span><br />
          <span>Fax: (028) 3844 7523</span><br />
          <span>Văn thư: info@vaa.edu.vn</span><br />
          <span>Bộ phận Tuyển sinh: tuyensinh@vaa.edu.vn</span>
        </div>
        <div className="vaa-footer__links">
          <b>Liên kết hữu ích</b>
          <ul>
            <li>Đảng bộ Học viện</li>
            <li>Công đoàn Học viện</li>
            <li>Hội đồng học viện</li>
            <li>Viện, Trung tâm</li>
            <li>HĐ Khoa học và Đào tạo</li>
            <li>Đoàn Thanh niên</li>
            <li>Hội Sinh viên</li>
            <li>SDGs</li>
            <li>Đơn vị</li>
            <li>Ho Chi Minh Communist Youth Union Copy</li>
            <li>Công khai</li>
            <li>Mẫu văn bằng</li>
            <li>Viện khoa học ứng dụng và đổi mới sáng tạo</li>
            <li>Trung tâm Nghiên cứu và phát triển số</li>
            <li>Trung tâm Ngoại ngữ - Tin học hàng không (ALI)</li>
          </ul>
        </div>
      </div>
      <div className="vaa-footer__copyright">
        © Bản quyền thuộc về VAA
      </div>
      {/* Floating social icons bottom right */}
      {!hideSocial && (
        <div className="vaa-footer__floating-socials">
          <a href="#" aria-label="Facebook" target="_blank" rel="noopener noreferrer" className="vaa-footer__floating-icon vaa-footer__floating-facebook">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="18" fill="#1877F3"/>
              <path d="M23.5 18H20V28H16V18H14V15H16V13.5C16 11.57 17.57 10 19.5 10H23V13H21C20.45 13 20 13.45 20 14V15H23L22.5 18Z" fill="white"/>
            </svg>
          </a>
          <a href="#" aria-label="YouTube" target="_blank" rel="noopener noreferrer" className="vaa-footer__floating-icon vaa-footer__floating-youtube">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="18" fill="#FF0000"/>
              <polygon points="15,13 25,18 15,23" fill="white"/>
            </svg>
          </a>
        </div>
      )}
    </footer>
  );
};

export default Footer;
