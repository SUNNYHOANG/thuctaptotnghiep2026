/**
 * Utility functions cho quản lý điểm
 */

/**
 * Tính GPA từ điểm tổng kết (0-10)
 */
export const calculateGPA = (diemTongKet) => {
  if (diemTongKet === null || diemTongKet === undefined) return null;
  if (diemTongKet < 0 || diemTongKet > 10) return null;
  return parseFloat(((diemTongKet / 10) * 4).toFixed(2));
};

/**
 * Tính điểm tổng kết từ các thành phần
 * Công thức: chuyên cần 10% + giữa kỳ 30% + cuối kỳ 60%
 */
export const calculateTotalScore = (diemChuyenCan = 0, diemGiuaKy = 0, diemCuoiKy = 0) => {
  const total = (diemChuyenCan * 0.1 + diemGiuaKy * 0.3 + diemCuoiKy * 0.6);
  return parseFloat(total.toFixed(2));
};

/**
 * Xếp loại học lực dựa trên GPA
 */
export const getClassification = (gpa) => {
  if (gpa === null || gpa === undefined) return 'Chưa xếp loại';
  if (gpa >= 3.6) return 'Xuất sắc';
  if (gpa >= 3.2) return 'Tốt';
  if (gpa >= 2.8) return 'Khá';
  if (gpa >= 2.4) return 'Trung bình';
  if (gpa >= 2.0) return 'Yếu';
  return 'Kém';
};

/**
 * Lấy màu cho xếp loại
 */
export const getClassificationColor = (xeploai) => {
  const colors = {
    'Xuất sắc': '#27ae60',
    'Tốt': '#3498db',
    'Khá': '#f39c12',
    'Trung bình': '#e67e22',
    'Yếu': '#e74c3c',
    'Kém': '#c0392b',
    'Chưa xếp loại': '#95a5a6'
  };
  return colors[xeploai] || '#95a5a6';
};

/**
 * Cảnh báo học vụ dựa trên GPA
 */
export const getAcademicWarning = (gpa) => {
  if (gpa === null || gpa === undefined) return null;
  if (gpa < 2.0) return {
    type: 'danger',
    message: 'Cảnh báo: GPA dưới 2.0 - Cần cải thiện ngay',
    severity: 'high'
  };
  if (gpa < 2.4) return {
    type: 'warning',
    message: 'Cảnh báo: GPA còn thấp - Nên tuyên bố học tập',
    severity: 'medium'
  };
  return null;
};

/**
 * Định dạng GPA để hiển thị
 */
export const formatGPA = (gpa) => {
  if (gpa === null || gpa === undefined) return 'N/A';
  return parseFloat(gpa).toFixed(2);
};

/**
 * Định dạng điểm để hiển thị
 */
export const formatScore = (score) => {
  if (score === null || score === undefined) return 'Chưa nhập';
  return parseFloat(score).toFixed(2);
};

/**
 * Kiểm tra xem điểm có hợp lệ không (0-10)
 */
export const isValidScore = (score) => {
  if (score === null || score === undefined || score === '') return false;
  const num = parseFloat(score);
  return !isNaN(num) && num >= 0 && num <= 10;
};

/**
 * Tạo thông báo lỗi cho điểm không hợp lệ
 */
export const getScoreError = (score, fieldName = 'Điểm') => {
  if (score === null || score === undefined || score === '') {
    return `${fieldName} không được để trống`;
  }
  const num = parseFloat(score);
  if (isNaN(num)) {
    return `${fieldName} phải là số`;
  }
  if (num < 0 || num > 10) {
    return `${fieldName} phải từ 0 đến 10`;
  }
  return null;
};

/**
 * Đếm tổng số sinh viên theo xếp loại
 */
export const countByClassification = (grades) => {
  const counts = {
    'Xuất sắc': 0,
    'Tốt': 0,
    'Khá': 0,
    'Trung bình': 0,
    'Yếu': 0,
    'Kém': 0,
    'Chưa xếp loại': 0
  };

  grades.forEach(grade => {
    const classification = getClassification(grade.gpa);
    counts[classification]++;
  });

  return counts;
};

/**
 * Tính thống kê điểm
 */
export const calculateGradeStats = (grades) => {
  if (grades.length === 0) {
    return {
      total: 0,
      avgGPA: 0,
      avgScore: 0,
      maxScore: 0,
      minScore: 0,
      completed: 0,
      incomplete: 0
    };
  }

  const validGrades = grades.filter(g => g.diemtongket !== null && g.gpa !== null);
  const totalGPA = validGrades.reduce((sum, g) => sum + g.gpa, 0);
  const totalScore = validGrades.reduce((sum, g) => sum + g.diemtongket, 0);
  const scores = validGrades.map(g => g.diemtongket);

  return {
    total: grades.length,
    avgGPA: (totalGPA / validGrades.length).toFixed(2),
    avgScore: (totalScore / validGrades.length).toFixed(2),
    maxScore: Math.max(...scores),
    minScore: Math.min(...scores),
    completed: validGrades.length,
    incomplete: grades.length - validGrades.length
  };
};

/**
 * Export grades to CSV
 */
export const exportGradesToCSV = (grades, filename = 'bangdiem.csv') => {
  const headers = ['MSSV', 'Họ Tên', 'Điểm Chuyên Cần', 'Điểm Giữa Kỳ', 'Điểm Cuối Kỳ', 'Điểm Tổng Kết', 'GPA', 'Xếp Loại'];
  
  const rows = grades.map(grade => [
    grade.mssv,
    grade.hoten,
    grade.diemchuyencan || '',
    grade.diemgiuaky || '',
    grade.diemcuoiky || '',
    grade.diemtongket || '',
    grade.gpa || '',
    getClassification(grade.gpa)
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Xác thực dữ liệu nhập điểm
 */
export const validateGradeInput = (data) => {
  const errors = {};

  if (!data.malophocphan) errors.malophocphan = 'Chọn lớp học phần';
  if (!data.mssv) errors.mssv = 'Chọn sinh viên';

  if (data.diemchuyencan !== undefined && data.diemchuyencan !== null && data.diemchuyencan !== '') {
    const error = getScoreError(data.diemchuyencan, 'Điểm chuyên cần');
    if (error) errors.diemchuyencan = error;
  }

  if (data.diemgiuaky !== undefined && data.diemgiuaky !== null && data.diemgiuaky !== '') {
    const error = getScoreError(data.diemgiuaky, 'Điểm giữa kỳ');
    if (error) errors.diemgiuaky = error;
  }

  if (data.diemcuoiky !== undefined && data.diemcuoiky !== null && data.diemcuoiky !== '') {
    const error = getScoreError(data.diemcuoiky, 'Điểm cuối kỳ');
    if (error) errors.diemcuoiky = error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
