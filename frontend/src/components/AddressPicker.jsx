import React, { useState, useEffect } from 'react';

const BASE = 'https://provinces.open-api.vn/api';

/**
 * AddressPicker: chọn tỉnh → huyện → xã + số nhà/đường
 * Props:
 *   value: string (địa chỉ đầy đủ đã lưu)
 *   onChange: (fullAddress: string) => void
 *   label: string (nhãn hiển thị, mặc định "Địa chỉ")
 */
const AddressPicker = ({ value = '', onChange, label = 'Địa chỉ hiện tại' }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [detail, setDetail] = useState('');

  // Parse value ban đầu (nếu có dạng "số nhà, xã, huyện, tỉnh")
  useEffect(() => {
    if (value && !province) {
      setDetail(value);
    }
  }, []);

  // Load tỉnh
  useEffect(() => {
    fetch(`${BASE}/p/`)
      .then((r) => r.json())
      .then((d) => setProvinces(d || []))
      .catch(() => {});
  }, []);

  // Load huyện khi chọn tỉnh
  useEffect(() => {
    if (!province) { setDistricts([]); setDistrict(''); setWards([]); setWard(''); return; }
    fetch(`${BASE}/p/${province}?depth=2`)
      .then((r) => r.json())
      .then((d) => setDistricts(d.districts || []))
      .catch(() => {});
    setDistrict('');
    setWards([]);
    setWard('');
  }, [province]);

  // Load xã khi chọn huyện
  useEffect(() => {
    if (!district) { setWards([]); setWard(''); return; }
    fetch(`${BASE}/d/${district}?depth=2`)
      .then((r) => r.json())
      .then((d) => setWards(d.wards || []))
      .catch(() => {});
    setWard('');
  }, [district]);

  // Ghép địa chỉ đầy đủ và gọi onChange
  useEffect(() => {
    const provinceName = provinces.find((p) => String(p.code) === String(province))?.name || '';
    const districtName = districts.find((d) => String(d.code) === String(district))?.name || '';
    const wardName = wards.find((w) => String(w.code) === String(ward))?.name || '';

    const parts = [detail, wardName, districtName, provinceName].filter(Boolean);
    onChange(parts.join(', '));
  }, [detail, ward, district, province]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontWeight: 500, fontSize: 13 }}>{label}</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
        >
          <option value="">-- Tỉnh/Thành --</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
        </select>

        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          disabled={!province}
          style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
        >
          <option value="">-- Quận/Huyện --</option>
          {districts.map((d) => (
            <option key={d.code} value={d.code}>{d.name}</option>
          ))}
        </select>

        <select
          value={ward}
          onChange={(e) => setWard(e.target.value)}
          disabled={!district}
          style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
        >
          <option value="">-- Phường/Xã --</option>
          {wards.map((w) => (
            <option key={w.code} value={w.code}>{w.name}</option>
          ))}
        </select>
      </div>

      <input
        type="text"
        placeholder="Số nhà, tên đường (tùy chọn)"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
      />

      {value && (
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
          📍 {value}
        </div>
      )}
    </div>
  );
};

export default AddressPicker;
