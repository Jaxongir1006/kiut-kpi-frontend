import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { cn } from "@/lib/utils";
import TeacherSidebar from "./TeacherSidebar";
import TeacherTopBar from "./TeacherTopBar";
import { fetchYears } from "@/features/academicYears/academicYearsSlice";
import { useDispatch } from "react-redux";

export default function TeacherLayout() {
	const dispatch = useDispatch();
	const [collapsed, setCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const [selectedYear, setSelectedYear] = useState("");

	const { list: years } = useSelector((s) => s.academicYears);

	useEffect(() => {
		dispatch(fetchYears());
	}, [dispatch]);

	useEffect(() => {
		if (years.length && !selectedYear) {
			const active = years.find((y) => y.is_active);
			setSelectedYear(active?.id || years[0]?.id || "");
		}
	}, [years, selectedYear]);

	return (
		<div className="min-h-screen bg-background">
			{/* Mobile overlay */}
			{mobileOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-30 lg:hidden"
					onClick={() => setMobileOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<div className="hidden lg:block">
				<TeacherSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
			</div>
			<div className={cn("lg:hidden", mobileOpen ? "block" : "hidden")}>
				<TeacherSidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
			</div>

			{/* Main content */}
			<div className={cn("transition-all duration-300", collapsed ? "lg:ml-16" : "lg:ml-64")}>
				<TeacherTopBar
					onMobileMenu={() => setMobileOpen(true)}
					selectedYear={selectedYear}
					onYearChange={setSelectedYear}
				/>
				<main className="p-4 md:p-6 lg:p-8">
					<Outlet context={{ selectedYear }} />
				</main>
			</div>
		</div>
	);
}
