import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminDashboard from './pages/dashboards/AdminDashboard.jsx';
import InstructorDashboard from './pages/dashboards/InstructorDashboard.jsx';
import StudentDashboard from './pages/dashboards/StudentDashboard.jsx';
import CourseList from './pages/instructor/CourseList.jsx';
import CourseBuilder from './pages/instructor/CourseBuilder.jsx';
import BrowseCourses from './pages/BrowseCourses.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import MyCourses from './pages/MyCourses.jsx';
import CoursePlayer from './pages/CoursePlayer.jsx';

import GuestRoute from './routes/GuestRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';

/**
 * App routing.
 *  - "/"               public landing
 *  - "/login","/register"  guests only (logged-in users redirect to dashboard)
 *  - "/admin|instructor|student"  role-gated dashboards inside the app shell
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<DashboardLayout />}>
        {/* Shared authenticated pages (any logged-in user) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/courses" element={<BrowseCourses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/learn/:courseId" element={<CoursePlayer />} />
          <Route path="/learn/:courseId/:lessonId" element={<CoursePlayer />} />
          <Route path="/student/my-courses" element={<MyCourses />} />
        </Route>

        <Route element={<RoleRoute roles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        <Route element={<RoleRoute roles={['instructor', 'admin']} />}>
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route path="/instructor/courses" element={<CourseList />} />
          <Route path="/instructor/courses/:id" element={<CourseBuilder />} />
        </Route>
        <Route element={<RoleRoute roles={['student']} />}>
          <Route path="/student" element={<StudentDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
