import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { cn } from "@/lib/utils";

export default function AppLayout() {
	const [collapsed, setCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<div className="min-h-screen bg-background">
			{/* Mobile overlay */}
			{mobileOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-30 lg:hidden"
					onClick={() => setMobileOpen(false)}
				/>
			)}

			{/* Sidebar - hidden on mobile unless open */}
			<div className={cn("hidden lg:block")}>
				<Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
			</div>
			<div className={cn("lg:hidden", mobileOpen ? "block" : "hidden")}>
				<Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
			</div>

			{/* Main content */}
			<div className={cn(
				"transition-all duration-300",
				collapsed ? "lg:ml-16" : "lg:ml-64"
			)}>
				<TopBar onMobileMenu={() => setMobileOpen(true)} />
				<main className="p-4 md:p-6 lg:p-8">
					<Outlet />
				</main>
			</div>
		</div>
	);
}