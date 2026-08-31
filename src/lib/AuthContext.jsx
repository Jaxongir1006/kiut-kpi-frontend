// Auth state is now managed by Redux — see src/features/auth/authSlice.js
// This file is kept for backwards compatibility but is no longer used.
export const useAuth = () => {
	throw new Error('useAuth is deprecated. Use useSelector((state) => state.auth) instead.');
};
