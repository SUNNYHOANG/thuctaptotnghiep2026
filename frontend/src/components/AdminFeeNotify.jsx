import React from 'react';
import { feeData } from '../mockFeeData';
import './AdminFeeNotify.css';

const AdminFeeNotify = () => (
  <div className="admin-fee-notify-container">
    <h2>Thông báo học phí đến sinh viên</h2>
    <table className="admin-fee-table">
      <thead>
        <tr>
          <th>Mã SV</th>
          <th>Họ tên</th>
          <th>Tổng phí</th>
          <th>Đã đóng</th>
          <th>Còn nợ</th>
          <th>Hạn cuối</th>
          <th>Thông báo</th>
        </tr>
      </thead>
      <tbody>
        {feeData.students.map(sv => (
          <tr key={sv.id}>
            <td>{sv.mssv}</td>
            <td>{sv.name}</td>
            <td>{sv.total.toLocaleString()} VNĐ</td>
            <td>{sv.paid.toLocaleString()} VNĐ</td>
            <td>{sv.due.toLocaleString()} VNĐ</td>
            <td>{sv.deadline}</td>
            <td>
              {sv.notifications.length > 0 ? (
                sv.notifications.map((n, idx) => (
                  <div key={idx} className="admin-fee-notify-msg">[{n.date}] {n.message}</div>
                ))
              ) : (
                <span className="admin-fee-ok">Không có công nợ</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default AdminFeeNotify;
