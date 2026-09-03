import { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from '@/app/store';
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from '@/context/LanguageProvider';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import RequireSystemAdmin from './components/RequireSystemAdmin';
import PageNotFound from './lib/PageNotFound';
import { fetchMeThunk } from '@/features/auth/authSlice';

import AppLayout from './components/layout/AppLayout';
import TeacherLayout from './components/layout/TeacherLayout';
import Login from './pages/Login';
import PublicRating from './pages/PublicRating';

// Admin pages
import Dashboard from './pages/Admin/Dashboard';
import Users from './pages/Admin/Users';
import Teachers from './pages/Admin/Teachers';
import Activities from './pages/Admin/Activities';
import ImportActivities from './pages/Admin/ImportActivities';
import Review from './pages/Admin/Review';
import Rating from './pages/Admin/Rating';
import Reports from './pages/Admin/Reports';
import Departments from './pages/Admin/Departments';
import Categories from './pages/Admin/Categories';
import Groups from './pages/Admin/Groups';
import Degrees from './pages/Admin/Degrees';
import AcademicYears from './pages/Admin/AcademicYears';
import AdminSettings from './pages/Admin/Settings';
import AdminAppeals from './pages/Admin/Appeals';

// Teacher pages
import TeacherDashboard from './pages/Teacher/Dashboard';
import TeacherKpiResults from './pages/Teacher/KpiResults';
import MyScores from './pages/Teacher/MyScores';
import Appeals from './pages/Teacher/Appeals';
import Notifications from './pages/Teacher/Notifications';
import TeacherSettings from './pages/Teacher/Settings';

function isTeacherRole(user) {
  if (!user) return false;
  const role = user.role || user.user_type || "";
  if (typeof role === "string" && role.toLowerCase() === "teacher") return true;
  if (Array.isArray(user.groups) && user.groups.some((g) => String(g).toLowerCase() === "teacher")) return true;
  if (user.is_teacher === true) return true;
  return false;
}

function AppRoutes() {
  const dispatch = useDispatch();
  const { accessToken, isFetchingMe, isAuthenticated, user } = useSelector((state) => state.auth);
  const isTeacher = isTeacherRole(user);

  // Guarded on `!user`, which is what makes the dependency array honest without
  // changing behaviour. SIMPLE_JWT runs with ROTATE_REFRESH_TOKENS, so
  // `accessToken` changes on every silent refresh; depending on it with no guard
  // would fire a /me request per rotation. Once /me has answered, `user` is set
  // and a rotation re-runs this effect to do nothing. On a rejected /me the
  // slice clears the token, so there is no loop either.
  useEffect(() => {
    if (accessToken && !user) {
      dispatch(fetchMeThunk());
    }
  }, [accessToken, user, dispatch]);

  // A token exists but /me has not answered yet: the role is UNKNOWN, not
  // "not a teacher". Rendering the tree here gave a teacher the admin shell for
  // one paint, which fired admin-only fetches with their token. Decide nothing
  // until the role is resolved. (On a rejected /me the slice clears
  // isAuthenticated, so this cannot spin forever.)
  const roleUnresolved = isAuthenticated && accessToken && !user;

  if (isFetchingMe || roleUnresolved) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/public-rating" element={<PublicRating />} />

      <Route element={<ProtectedRoute />}>
        {/* ── Teacher routes ────────────────────────────── */}
        {isTeacher && (
          <Route element={<TeacherLayout />}>
            <Route path="/" element={<TeacherDashboard />} />
            <Route path="/my-kpi" element={<TeacherKpiResults />} />
            <Route path="/my-kpi/new" element={<TeacherKpiResults />} />
            <Route path="/my-scores" element={<MyScores />} />
            <Route path="/appeals" element={<Appeals />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<TeacherSettings />} />
          </Route>
        )}

        {/* ── Admin / staff routes ──────────────────────── */}
        {!isTeacher && (
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/activities/import" element={<ImportActivities />} />
            <Route path="/review" element={<Review />} />
            <Route path="/appeals" element={<AdminAppeals />} />
            <Route path="/rating" element={<Rating />} />
            <Route path="/reports" element={<Reports />} />

            {/* System-Admin-only. The sidebar merely HID these links, so a
                commission or department-head account could type /settings and
                get the full role-management UI. This is defence in depth —
                the backend remains the real authority on every one of these
                endpoints, and must keep rejecting them on its own. */}
            <Route element={<RequireSystemAdmin />}>
              <Route path="/departments" element={<Departments />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/degrees" element={<Degrees />} />
              <Route path="/academic-years" element={<AcademicYears />} />
              <Route path="/settings" element={<AdminSettings />} />
            </Route>
          </Route>
        )}
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <Router>
          <ScrollToTop />
          <AppRoutes />
          <Toaster />
        </Router>
      </LanguageProvider>
    </Provider>
  );
}

export default App;
