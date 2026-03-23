import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminCourses from './pages/AdminCourses';
import AdminCourseAvailability from './pages/AdminCourseAvailability';
import AdminActivities from './pages/AdminActivities';
import AdminScholarships from './pages/AdminScholarships';
import AdminRewards from './pages/AdminRewards';
import AdminServices from './pages/AdminServices';
import AdminReports from './pages/AdminReports';
import AdminThongBao from './pages/AdminThongBao';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentGrades from './pages/StudentGrades';
import TeacherGrades from './pages/TeacherGrades';
import NrlTracker from './pages/NrlTracker';
import KhenThuongKyLuat from './pages/KhenThuongKyLuat';
import DichVu from './pages/DichVu';
import HocBong from './pages/HocBong';
import ThongBao from './pages/ThongBao';
import ScorePage from './pages/Score';
import Scores from './pages/Scores';
import CTSVDashboard from './pages/CTSVDashboard';
import DrlSelfEvaluation from './pages/DrlSelfEvaluation';
import DrlClassReview from './pages/DrlClassReview';
import StudentProfile from './pages/StudentProfile';
import TieuChiDRL from './pages/TieuChiDRL';
import TeacherClassStudents from './pages/TeacherClassStudents';
import CTSVPhucKhao from './pages/CTSVPhucKhao';
import CTSVDonOnline from './pages/CTSVDonOnline';
import CTSVNhacNho from './pages/CTSVNhacNho';
import CTSVhoatDong from './pages/CTSVhoatDong';
import MyActivities from './pages/MyActivities';
import Activities from './pages/Activities';
import ActivityDetail from './pages/ActivityDetail';
import PhucKhao from './pages/PhucKhao';
import KhoaDashboard from './pages/KhoaDashboard';
import KhoaDrlReview from './pages/KhoaDrlReview';
import KhoaStudentList from './pages/KhoaStudentList';
import AdminKhoa from './pages/AdminKhoa';
import AdminHocKy from './pages/AdminHocKy';
import AdminAuditLog from './pages/AdminAuditLog';
import CTSVDrlManager from './pages/CTSVDrlManager';
import CTSVDrlStats from './pages/CTSVDrlStats';
import TeacherClassStats from './pages/TeacherClassStats';
import CTSVBaoCao from './pages/CTSVBaoCao';
import KhoaDrlStats from './pages/KhoaDrlStats';
import KhoaKhenThuong from './pages/KhoaKhenThuong';
import KhoaHocBong from './pages/KhoaHocBong';
import KhoaThongBao from './pages/KhoaThongBao';
import TeacherProfile from './pages/TeacherProfile';
import TeacherPhucKhao from './pages/TeacherPhucKhao';
import TeacherKhenThuong from './pages/TeacherKhenThuong';
import AdminLopHanhChinh from './pages/AdminLopHanhChinh';
import AdminTieuChiDRL from './pages/AdminTieuChiDRL';
import ScholarshipEvaluator from './pages/ScholarshipEvaluator';
import KhoaPhucKhao from './pages/KhoaPhucKhao';
import KhoaGrades from './pages/KhoaGrades';
import ChangePassword from './pages/ChangePassword';
import './index.css';

function RoleRedirect() {
  const { user } = useAuth();
  const role = user?.role;
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'giangvien') return <Navigate to="/giangvien/dashboard" replace />;
  if (role === 'ctsv') return <Navigate to="/ctsv/dashboard" replace />;
  if (role === 'khoa') return <Navigate to="/khoa/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated() ? <RoleRedirect /> : <Login />} />
      <Route path="/register" element={isAuthenticated() ? <RoleRedirect /> : <Register />} />
      
      {/* Root redirect by role */}
      <Route path="/" element={
        <ProtectedRoute>
          <RoleRedirect />
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/diem-ren-luyen" element={
        <ProtectedRoute>
          <ScorePage />
        </ProtectedRoute>
      } />
      <Route path="/diem-ren-luyen/tu-danh-gia" element={
        <ProtectedRoute requiredRole="sinhvien">
          <DrlSelfEvaluation />
        </ProtectedRoute>
      } />
      <Route path="/ho-so-ca-nhan" element={
        <ProtectedRoute requiredRole="sinhvien">
          <StudentProfile />
        </ProtectedRoute>
      } />
      <Route path="/tieu-chi-drl" element={
        <ProtectedRoute>
          <TieuChiDRL />
        </ProtectedRoute>
      } />
      <Route path="/hoat-dong-cua-toi" element={
        <ProtectedRoute requiredRole="sinhvien">
          <MyActivities />
        </ProtectedRoute>
      } />
      <Route path="/activities" element={
        <ProtectedRoute requiredRole="sinhvien">
          <Activities />
        </ProtectedRoute>
      } />
      <Route path="/activities/:id" element={
        <ProtectedRoute requiredRole="sinhvien">
          <ActivityDetail />
        </ProtectedRoute>
      } />
      <Route path="/phuc-khao" element={
        <ProtectedRoute requiredRole="sinhvien">
          <PhucKhao />
        </ProtectedRoute>
      } />

      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />

      <Route path="/admin/users" element={
        <ProtectedRoute requiredRole="admin">
          <AdminUsers />
        </ProtectedRoute>
      } />

      <Route path="/admin/courses" element={
        <ProtectedRoute requiredRole="admin">
          <AdminCourses />
        </ProtectedRoute>
      } />

      <Route path="/admin/khoa" element={
        <ProtectedRoute requiredRole="admin">
          <AdminKhoa />
        </ProtectedRoute>
      } />

      <Route path="/admin/course-availability" element={
        <ProtectedRoute requiredRole="admin">
          <AdminCourseAvailability />
        </ProtectedRoute>
      } />

      <Route path="/admin/activities" element={
        <ProtectedRoute requiredRole="admin">
          <AdminActivities />
        </ProtectedRoute>
      } />

      <Route path="/admin/scores" element={
        <ProtectedRoute allowedRoles={['admin', 'ctsv']}>
          <CTSVDrlManager />
        </ProtectedRoute>
      } />

      <Route path="/admin/scholarships" element={
        <ProtectedRoute allowedRoles={['admin', 'ctsv']}>
          <AdminScholarships />
        </ProtectedRoute>
      } />

      <Route path="/admin/rewards" element={
        <ProtectedRoute allowedRoles={['admin', 'ctsv']}>
          <AdminRewards />
        </ProtectedRoute>
      } />

      <Route path="/admin/reports" element={
        <ProtectedRoute requiredRole="admin">
          <AdminReports />
        </ProtectedRoute>
      } />
      <Route path="/admin/hoc-ky" element={
        <ProtectedRoute requiredRole="admin">
          <AdminHocKy />
        </ProtectedRoute>
      } />
      <Route path="/admin/audit-log" element={
        <ProtectedRoute requiredRole="admin">
          <AdminAuditLog />
        </ProtectedRoute>
      } />
      <Route path="/admin/thong-bao" element={
        <ProtectedRoute allowedRoles={['admin', 'ctsv', 'giangvien']}>
          <AdminThongBao />
        </ProtectedRoute>
      } />
      
      <Route path="/giangvien/dashboard" element={
        <ProtectedRoute requiredRole="giangvien">
          <TeacherDashboard />
        </ProtectedRoute>
      } />

      <Route path="/ctsv/dashboard" element={
        <ProtectedRoute requiredRole="ctsv">
          <CTSVDashboard />
        </ProtectedRoute>
      } />
      <Route path="/ctsv/duyet-don-online" element={
        <ProtectedRoute allowedRoles={['admin', 'ctsv']}>
          <CTSVDonOnline />
        </ProtectedRoute>
      } />
      <Route path="/ctsv/nhac-nho" element={
        <ProtectedRoute allowedRoles={['admin', 'ctsv']}>
          <CTSVNhacNho />
        </ProtectedRoute>
      } />
      <Route path="/ctsv/diem-ren-luyen-tu-danh-gia" element={
        <ProtectedRoute allowedRoles={['admin', 'ctsv']}>
          <DrlClassReview />
        </ProtectedRoute>
      } />

      <Route path="/ctsv/quan-ly-diem" element={
        <ProtectedRoute requiredRole="ctsv">
          <TeacherGrades />
        </ProtectedRoute>
      } />
      <Route path="/ctsv/duyet-phuc-khao" element={
        <ProtectedRoute allowedRoles={['admin', 'ctsv']}>
          <CTSVPhucKhao />
        </ProtectedRoute>
      } />
      <Route path="/ctsv/duyet-dang-ky-hoat-dong" element={
        <ProtectedRoute allowedRoles={['admin', 'ctsv']}>
          <CTSVhoatDong />
        </ProtectedRoute>
      } />

      <Route path="/ctsv/xet-hoc-bong" element={
        <ProtectedRoute allowedRoles={['admin', 'ctsv']}>
          <ScholarshipEvaluator />
        </ProtectedRoute>
      } />

      <Route path="/ctsv/hoc-bong" element={
        <ProtectedRoute requiredRole="ctsv">
          <AdminScholarships />
        </ProtectedRoute>
      } />

      <Route path="/ctsv/khen-thuong-ky-luat" element={
        <ProtectedRoute requiredRole="ctsv">
          <AdminRewards />
        </ProtectedRoute>
      } />

      <Route path="/ctsv/diem-ren-luyen" element={
        <ProtectedRoute requiredRole="ctsv">
          <Scores />
        </ProtectedRoute>
      } />
      <Route path="/ctsv/quan-ly-diem-ren-luyen" element={
        <ProtectedRoute requiredRole="ctsv">
          <CTSVDrlManager />
        </ProtectedRoute>
      } />
      <Route path="/ctsv/thong-ke-drl" element={
        <ProtectedRoute allowedRoles={['admin', 'ctsv']}>
          <CTSVDrlStats />
        </ProtectedRoute>
      } />
      
      <Route path="/sinhvien/dashboard" element={
        <ProtectedRoute requiredRole="sinhvien">
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/nrl-tracker" element={
        <ProtectedRoute>
          <NrlTracker />
        </ProtectedRoute>
      } />

      <Route path="/student-grades" element={
        <ProtectedRoute requiredRole="sinhvien">
          <StudentGrades />
        </ProtectedRoute>
      } />

      <Route path="/teacher/grades" element={
        <ProtectedRoute requiredRole="giangvien">
          <TeacherGrades />
        </ProtectedRoute>
      } />
      <Route path="/giangvien/sinh-vien-lop" element={
        <ProtectedRoute requiredRole="giangvien">
          <TeacherClassStudents />
        </ProtectedRoute>
      } />
      <Route path="/giangvien/diem-ren-luyen-tu-danh-gia" element={
        <ProtectedRoute requiredRole="giangvien">
          <DrlClassReview />
        </ProtectedRoute>
      } />
      <Route path="/giangvien/thong-ke-diem-lop" element={
        <ProtectedRoute requiredRole="giangvien">
          <TeacherClassStats />
        </ProtectedRoute>
      } />
      
      <Route path="/khen-thuong-ky-luat" element={
        <ProtectedRoute>
          <KhenThuongKyLuat />
        </ProtectedRoute>
      } />
      
      <Route path="/dich-vu" element={
        <ProtectedRoute>
          <DichVu />
        </ProtectedRoute>
      } />
      
      <Route path="/hoc-bong" element={
        <ProtectedRoute>
          <HocBong />
        </ProtectedRoute>
      } />
      
      <Route path="/thong-bao" element={
        <ProtectedRoute>
          <ThongBao />
        </ProtectedRoute>
      } />
      
      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />

      <Route path="/doi-mat-khau" element={
        <ProtectedRoute>
          <ChangePassword />
        </ProtectedRoute>
      } />

      {/* Khoa routes */}
      <Route path="/khoa/dashboard" element={
        <ProtectedRoute requiredRole="khoa">
          <KhoaDashboard />
        </ProtectedRoute>
      } />
      <Route path="/khoa/drl-review" element={
        <ProtectedRoute requiredRole="khoa">
          <KhoaDrlReview />
        </ProtectedRoute>
      } />
      <Route path="/khoa/students" element={
        <ProtectedRoute requiredRole="khoa">
          <KhoaStudentList />
        </ProtectedRoute>
      } />
      <Route path="/khoa/drl-stats" element={
        <ProtectedRoute requiredRole="khoa">
          <KhoaDrlStats />
        </ProtectedRoute>
      } />
      <Route path="/khoa/khen-thuong" element={
        <ProtectedRoute requiredRole="khoa">
          <KhoaKhenThuong />
        </ProtectedRoute>
      } />
      <Route path="/khoa/hoc-bong" element={
        <ProtectedRoute requiredRole="khoa">
          <KhoaHocBong />
        </ProtectedRoute>
      } />
      <Route path="/khoa/phuc-khao" element={
        <ProtectedRoute requiredRole="khoa">
          <KhoaPhucKhao />
        </ProtectedRoute>
      } />
      <Route path="/khoa/thong-bao" element={
        <ProtectedRoute requiredRole="khoa">
          <KhoaThongBao />
        </ProtectedRoute>
      } />
      <Route path="/khoa/diem" element={
        <ProtectedRoute requiredRole="khoa">
          <KhoaGrades />
        </ProtectedRoute>
      } />

      {/* CTSV routes bổ sung */}
      <Route path="/ctsv/bao-cao" element={
        <ProtectedRoute allowedRoles={['admin', 'ctsv']}>
          <CTSVBaoCao />
        </ProtectedRoute>
      } />

      {/* Giảng viên routes bổ sung */}
      <Route path="/giangvien/ho-so" element={
        <ProtectedRoute requiredRole="giangvien">
          <TeacherProfile />
        </ProtectedRoute>
      } />
      <Route path="/giangvien/phuc-khao" element={
        <ProtectedRoute requiredRole="giangvien">
          <TeacherPhucKhao />
        </ProtectedRoute>
      } />
      <Route path="/giangvien/khen-thuong" element={
        <ProtectedRoute requiredRole="giangvien">
          <TeacherKhenThuong />
        </ProtectedRoute>
      } />

      {/* Admin routes bổ sung */}
      <Route path="/admin/tieu-chi-drl" element={
        <ProtectedRoute requiredRole="admin">
          <AdminTieuChiDRL />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
