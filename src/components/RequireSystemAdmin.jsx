import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * Route-level gate for the System Admin sections (settings, catalogs).
 *
 * DEFENCE IN DEPTH ONLY. The backend remains the sole real authority on what a
 * user may read or write; this guard exists because hiding a link in the
 * sidebar is not access control — a commission or department-head account could
 * previously just type /settings and get the whole role-management UI. Removing
 * this guard must never be what makes an endpoint safe.
 */
export default function RequireSystemAdmin() {
	const { user, accessToken } = useSelector((s) => s.auth);
	const { isSystemAdmin } = useUserRole();

	// Role not resolved yet: decide nothing rather than briefly rendering an
	// admin page (or bouncing a legitimate admin away) on the first paint.
	if (accessToken && !user) return null;

	if (!isSystemAdmin) return <Navigate to="/" replace />;

	return <Outlet />;
}
