import { createBrowserRouter } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { MainLayout } from '@/layouts/MainLayout'
import LandingPage from '@/modules/landing/LandingPage'
import LoginPage from '@/modules/auth/views/LoginPage'
import RegisterPage from '@/modules/auth/views/RegisterPage'
import GroupDetailPage from '@/modules/groups/views/GroupDetailPage'
import GroupsPage from '@/modules/groups/views/GroupsPage'
import HomeworkDetailPage from '@/modules/homeworks/views/HomeworkDetailPage'
import MaterialDetailPage from '@/modules/materials/views/MaterialDetailPage'
import ProfilePage from '@/modules/profile/views/ProfilePage'
import ChatPage from '@/modules/chat/views/ChatPage'
import JoinPage, { JoinLandingView } from '@/modules/student/views/JoinPage'
import HomeworkSubmitPage from '@/modules/student/views/HomeworkSubmitPage'
import PendingPage from '@/modules/student/views/PendingPage'
import StudentDashboard from '@/modules/student/views/StudentDashboard'
import StudentMaterialsPage from '@/modules/student/views/StudentMaterialsPage'
import StudentGroupsPage from '@/modules/student/views/StudentGroupsPage'
import TestPage from '@/modules/student/views/TestPage'
import StudentDetailPage from '@/modules/students/views/StudentDetailPage'
import TestBuilderPage from '@/modules/tests/views/TestBuilderPage'
import TestDetailPage from '@/modules/tests/views/TestDetailPage'
import TestResultsPage from '@/modules/tests/views/TestResultsPage'
import StudentRatingPage from '@/modules/ratings/views/StudentRatingPage'
import SettingsPage from '@/modules/settings/views/SettingsPage'
import { StudentLayout } from '@/layouts/StudentLayout'
import { DashboardPage, PrivateRoute, RootRedirect, StudentRoute } from './guards'

import ForgotPasswordPage from '@/modules/auth/views/ForgotPasswordPage'
import ResetPasswordPage from '@/modules/auth/views/ResetPasswordPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/landing',
    element: <LandingPage />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password/:uid/:token', element: <ResetPasswordPage /> },
      { path: 'join', element: <JoinLandingView /> },
      { path: 'join/:inviteCode', element: <JoinPage /> },
      { path: 'pending', element: <PendingPage /> },
    ],
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'groups', element: <GroupsPage /> },
          { path: 'groups/:groupId', element: <GroupDetailPage /> },
          { path: 'students/:id', element: <StudentDetailPage /> },
          { path: 'materials/:id', element: <MaterialDetailPage /> },
          { path: 'homeworks/:id', element: <HomeworkDetailPage /> },
          { path: 'tests/:id', element: <TestDetailPage /> },
          { path: 'tests/:id/builder', element: <TestBuilderPage /> },
          { path: 'tests/:id/results', element: <TestResultsPage /> },
          { path: 'chat', element: <ChatPage /> },
          { path: 'ratings', element: <StudentRatingPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    element: <StudentRoute />,
    children: [
      {
        element: <StudentLayout />,
        children: [
          { path: 'student/dashboard', element: <StudentDashboard /> },
          { path: 'student/groups', element: <StudentGroupsPage /> },
          { path: 'student/materials', element: <StudentMaterialsPage /> },
          { path: 'student/homework/:id', element: <HomeworkSubmitPage /> },
          { path: 'student/test/:id', element: <TestPage /> },
          { path: 'student/chat', element: <ChatPage /> },
          { path: 'student/profile', element: <ProfilePage /> },
          { path: 'student/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
])
