import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CourseRegistration from './pages/CourseRegistration';
import AdminDashboard from './pages/AdminDashboard';
import AdminAttendance from './pages/AdminAttendance';
import FaceAttendance from './pages/FaceAttendance';
import AdminUsers from './pages/AdminUsers';
import AdminCourses from './pages/AdminCourses';
import AdminCourseAvailability from './pages/AdminCourseAvailability';
import AdminActivities from './pages/AdminActivities';
import AdminScores from './pages/AdminScores';
import AdminScholarships from './pages/AdminScholarships';
import AdminRewards from './pages/AdminRewards';
import AdminServices from './pages/AdminServices';
import AdminReports from './pages/AdminReports';
import AdminFeeNotifications from './pages/AdminFeeNotifications';
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
import './index.css';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated() ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated() ? <Navigate to="/" replace /> : <Register />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/hoc-phi" element={
        <ProtectedRoute>
          <Dashboard feeTabInit="online" />
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

      <Route path="/admin/face-attendance" element={
        <ProtectedRoute requiredRole="admin">
          <FaceAttendance />
        </ProtectedRoute>
      } />

      <Route path="/admin/attendance" element={
        <ProtectedRoute requiredRole="admin">
          <AdminAttendance />
        </ProtectedRoute>
      } />

      <Route path="/admin/courses" element={
        <ProtectedRoute requiredRole="admin">
          <AdminCourses />
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
          <AdminScores />
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

      <Route path="/admin/services" element={
        <ProtectedRoute requiredRole="admin">
          <AdminServices />
        </ProtectedRoute>
      } />

      <Route path="/admin/reports" element={
        <ProtectedRoute requiredRole="admin">
          <AdminReports />
        </ProtectedRoute>
      } />

      <Route path="/admin/fee-notifications" element={
        <ProtectedRoute requiredRole="admin">
          <AdminFeeNotifications />
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
        <ProtectedRoute requiredRole="ctsv">
          <CTSVDonOnline />
        </ProtectedRoute>
      } />
      <Route path="/ctsv/nhac-nho" element={
        <ProtectedRoute requiredRole="ctsv">
          <CTSVNhacNho />
        </ProtectedRoute>
      } />
      <Route path="/ctsv/diem-ren-luyen-tu-danh-gia" element={
        <ProtectedRoute requiredRole="ctsv">
          <DrlClassReview />
        </ProtectedRoute>
      } />

      <Route path="/ctsv/quan-ly-diem" element={
        <ProtectedRoute requiredRole="ctsv">
          <TeacherGrades />
        </ProtectedRoute>
      } />
      <Route path="/ctsv/duyet-phuc-khao" element={
        <ProtectedRoute requiredRole="ctsv">
          <CTSVPhucKhao />
        </ProtectedRoute>
      } />
      <Route path="/ctsv/duyet-dang-ky-hoat-dong" element={
        <ProtectedRoute allowedRoles={['admin', 'ctsv']}>
          <CTSVhoatDong />
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
      
      <Route path="/sinhvien/dashboard" element={
        <ProtectedRoute requiredRole="sinhvien">
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/dang-ky-mon-hoc" element={
        <ProtectedRoute requiredRole="sinhvien">
          <CourseRegistration />
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
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
