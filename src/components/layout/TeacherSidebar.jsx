import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
	LayoutDashboard, BarChart3, PlusCircle, Star, Trophy,
	FileText, MessageSquare, Bell, Settings, ChevronLeft, ChevronRight,
	HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function TeacherSidebar({ collapsed, onToggle }) {
	const { pathname } = useLocation();
	const { t } = useLanguage();

	const NAV = [
		{ key: "nav_home",         icon: LayoutDashboard, path: "/" },
		{ key: "nav_kpi_results",  icon: BarChart3,        path: "/my-kpi" },
		{ key: "nav_add_result",   icon: PlusCircle,       path: "/my-kpi/new" },
		{ key: "nav_my_scores",    icon: Star,             path: "/my-scores" },
		{ key: "rating",           icon: Trophy,           path: "/public-rating" },
		{ key: "reports",          icon: FileText,         path: "/reports" },
		{ key: "nav_appeals",      icon: MessageSquare,    path: "/appeals" },
		{ key: "nav_notifications",icon: Bell,             path: "/notifications", badge: 8 },
		{ key: "settings",         icon: Settings,         path: "/settings" },
	];

	return (
		<aside className={cn(
			"fixed left-0 top-0 h-screen bg-primary text-primary-foreground z-40 transition-all duration-300 flex flex-col",
			collapsed ? "w-16" : "w-64"
		)}>
			{/* Logo */}
			<div className="flex items-center h-16 px-4 border-b border-white/15 shrink-0">
				{!collapsed ? (
					<div className="flex items-center gap-3 min-w-0">
						<img
							src="/favicon.svg"
							alt="KIUT"
							className="w-9 h-9 object-contain shrink-0"
						/>
						<div className="min-w-0">
							<p className="font-bold text-sm leading-tight">KIUT KPI</p>
							<p className="text-[10px] text-white/70 leading-tight truncate">
								PROFESSOR-O'QITUVCHI
							</p>
						</div>
					</div>
				) : (
					<img
						src="/favicon.svg"
						alt="KIUT"
						className="w-9 h-9 object-contain mx-auto"
					/>
				)}
			</div>

			{/* Nav */}
			<nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
				{NAV.map((item) => {
					const Icon = item.icon;
					const label = t(item.key);
					const isActive = item.path === "/"
						? pathname === "/"
						: item.path === "/my-kpi/new"
							? pathname === "/my-kpi/new"
							: pathname.startsWith(item.path);

					return (
						<Link
							key={item.key + item.path}
							to={item.path}
							className={cn(
								"relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
								isActive
									? "bg-white/25 text-white shadow-sm"
									: "text-white/85 hover:bg-white/15 hover:text-white"
							)}
						>
							<Icon className="w-[18px] h-[18px] shrink-0" />
							{!collapsed && (
								<span className="flex-1 truncate">{label}</span>
							)}
							{!collapsed && item.badge && (
								<span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
									{item.badge}
								</span>
							)}
							{collapsed && item.badge && (
								<span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
									{item.badge}
								</span>
							)}
						</Link>
					);
				})}
			</nav>

			{/* Help box */}
			{!collapsed && (
				<div className="mx-3 mb-3 p-3 bg-white/10 rounded-lg shrink-0">
					<div className="flex items-center gap-2 mb-1">
						<HelpCircle className="w-4 h-4 text-white/80 shrink-0" />
						<span className="text-sm font-medium">{t("teacher_help_title")}</span>
					</div>
					<p className="text-[11px] text-white/60 mb-2 leading-relaxed">
						{t("teacher_help_desc")}
					</p>
					<button className="w-full text-center text-xs font-semibold bg-white text-primary rounded-md py-1.5 hover:bg-white/90 transition-colors">
						{t("teacher_help_center")}
					</button>
				</div>
			)}

			{/* Collapse toggle */}
			<button
				onClick={onToggle}
				className="flex items-center justify-center h-12 border-t border-white/15 text-white/75 hover:text-white transition-colors shrink-0"
			>
				{collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
			</button>
		</aside>
	);
}
