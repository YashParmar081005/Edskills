import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminDashboard from './pages/dashboards/AdminDashboard.jsx';
import InstructorDashboard from './pages/dashboards/InstructorDashboard.jsx';
import StudentDashboard from './pages/dashboards/StudentDashboard.jsx';
import CourseList from './pages/instructor/CourseList.jsx';
import CourseBuilder from './pages/instructor/CourseBuilder.jsx';
import InstructorAssignmentsHub from './pages/InstructorAssignmentsHub.jsx';
import InstructorDiscussions from './pages/InstructorDiscussions.jsx';
import InstructorQuizzesHub from './pages/InstructorQuizzesHub.jsx';
import BrowseCourses from './pages/BrowseCourses.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import MyCourses from './pages/MyCourses.jsx';
import CoursePlayer from './pages/CoursePlayer.jsx';
import AssignmentsPage from './pages/AssignmentsPage.jsx';
import SubmissionsGrading from './pages/SubmissionsGrading.jsx';
import CourseForum from './pages/CourseForum.jsx';
import ThreadDetail from './pages/ThreadDetail.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import CertificateVerify from './pages/CertificateVerify.jsx';
import InstructorAnalytics from './pages/InstructorAnalytics.jsx';
import AdminAnalytics from './pages/AdminAnalytics.jsx';
import AdminAnnouncements from './pages/AdminAnnouncements.jsx';
import AdminPayments from './pages/AdminPayments.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminRoles from './pages/AdminRoles.jsx';
import MyCertificates from './pages/MyCertificates.jsx';
import MyQuizzes from './pages/MyQuizzes.jsx';
import DiscussHub from './pages/DiscussHub.jsx';
import StudyTools from './pages/StudyTools.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';

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

      {/* Public certificate verification */}
      <Route path="/verify/:certificateId" element={<CertificateVerify />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<DashboardLayout />}>
        {/* Shared authenticated pages (any logged-in user) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/courses" element={<BrowseCourses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/learn/:courseId" element={<CoursePlayer />} />
          <Route path="/learn/:courseId/:lessonId" element={<CoursePlayer />} />
          <Route path="/student/my-courses" element={<MyCourses />} />
          <Route path="/courses/:courseId/assignments" element={<AssignmentsPage />} />
          <Route path="/courses/:courseId/forum" element={<CourseForum />} />
          <Route path="/threads/:threadId" element={<ThreadDetail />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/student/certificates" element={<MyCertificates />} />
          <Route path="/student/quizzes" element={<MyQuizzes />} />
          <Route path="/student/discuss" element={<DiscussHub />} />
          <Route path="/student/tools" element={<StudyTools />} />
        </Route>

        <Route element={<RoleRoute roles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/roles" element={<AdminRoles />} />
        </Route>
        <Route element={<RoleRoute roles={['instructor', 'admin']} />}>
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route path="/instructor/courses" element={<CourseList />} />
          <Route path="/instructor/courses/:id" element={<CourseBuilder />} />
          <Route path="/instructor/quizzes" element={<InstructorQuizzesHub />} />
          <Route path="/instructor/assignments" element={<InstructorAssignmentsHub />} />
          <Route path="/instructor/discussions" element={<InstructorDiscussions />} />
          <Route path="/instructor/analytics" element={<InstructorAnalytics />} />
          <Route
            path="/instructor/assignments/:assignmentId/submissions"
            element={<SubmissionsGrading />}
          />
        </Route>
        <Route element={<RoleRoute roles={['student']} />}>
          <Route path="/student" element={<StudentDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
