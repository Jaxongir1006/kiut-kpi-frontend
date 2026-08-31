import { useSelector } from 'react-redux';

/**
 * Derives the admin signal from the user object.
 *
 * Kept as a standalone function (not inlined in the hook) so the sidebar, the
 * route guard and any in-page gate all read the SAME signal — a second,
 * hand-rolled copy of this check is how "hidden in the menu but reachable by
 * URL" bugs appear.
 */
export function isSystemAdminUser(user, roleDetails) {
  const details = roleDetails || user?.role_details || {};
  const name = details.name || '';
  return (
    user?.is_superuser === true ||
    name === 'System Admin' ||
    name.toLowerCase().includes('system admin')
  );
}

export function useUserRole() {
  const { user } = useSelector((s) => s.auth);
  const { list: teachers } = useSelector((s) => s.teachers);

  if (!user) {
    return {
      role: null,
      isTeacher: false,
      isAdmin: false,
      isSystemAdmin: false,
      teacherProfile: null,
      roleDetails: {},
      user: null,
    };
  }

  // API returns: user.role = "teacher" | "admin" | ...
  // and user.role_details = { name, is_admin, scope, permissions }
  const roleStr   = user.role || '';
  const roleDetails = user.role_details || {};

  const isTeacher = roleStr === 'teacher' || roleDetails.name === 'Teacher';
  const isAdmin   = roleDetails.is_admin === true;
  const isSystemAdmin = isSystemAdminUser(user, roleDetails);

  // Find linked teacher profile from teachers list
  const teacherProfile =
    teachers.find((/** @type {any} */ t) => t.user === user.id || t.user_details?.id === user.id) || null;

  return {
    role: roleStr || (isAdmin ? 'admin' : 'staff'),
    isTeacher,
    isAdmin,
    isSystemAdmin,
    teacherProfile,
    roleDetails,
    user,
  };
}
