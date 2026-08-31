import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import departmentsReducer from '@/features/departments/departmentsSlice';
import academicYearsReducer from '@/features/academicYears/academicYearsSlice';
import teachersReducer from '@/features/teachers/teachersSlice';
import degreesReducer from '@/features/degrees/degreesSlice';
import titlesReducer from '@/features/titles/titlesSlice';
import categoriesReducer from '@/features/categories/categoriesSlice';
import typesReducer from '@/features/types/typesSlice';
import submissionsReducer from '@/features/submissions/submissionsSlice';
import scoringReducer from '@/features/scoring/scoringSlice';
import reportingReducer from '@/features/reporting/reportingSlice';
import rolesReducer from '@/features/roles/rolesSlice';
import permissionsReducer from '@/features/permissions/permissionsSlice';
import usersReducer from '@/features/users/usersSlice';
import appealsReducer from '@/features/appeals/appealsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    departments: departmentsReducer,
    academicYears: academicYearsReducer,
    teachers: teachersReducer,
    degrees: degreesReducer,
    titles: titlesReducer,
    categories: categoriesReducer,
    types: typesReducer,
    submissions: submissionsReducer,
    scoring: scoringReducer,
    reporting: reportingReducer,
    roles: rolesReducer,
    permissions: permissionsReducer,
    users: usersReducer,
    appeals: appealsReducer,
  },
});
