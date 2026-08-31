import { Link, useLocation } from "react-router-dom";
import {
	LayoutDashboard, Users, FileText, Award, Settings,
	BookOpen, GraduationCap, Calendar, FolderOpen, BarChart3,
	CheckSquare, Globe, ChevronLeft, ChevronRight, Layers,
	Bell, ClipboardList, TrendingUp, Plus, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";

const TEACHER_MENU = [
	{ label: "Bosh sahifa",         icon: LayoutDashboard, path: "/" },
	{ label: "KPI natijalarim",     icon: ClipboardList,   path: "/my-kpi" },
	{ label: "Yangi natija kiritish", icon: Plus,           path: "/my-kpi/new" },
	{ label: "Mening ballarim",     icon: TrendingUp,      path: "/my-scores" },
	{ label: "Reyting",             icon: Award,           path: "/rating" },
	{ label: "Hisobotlar",          icon: BarChart3,       path: "/reports" },
	{ label: "Apellyatsiyalar",     icon: MessageSquare,   path: "/appeals" },
	{ label: "Xabarnomalar",        icon: Bell,            path: "/notifications" },
	{ label: "Sozlamalar",          icon: Settings,        path: "/settings" },
];

export default function Sidebar({ collapsed, onToggle }) {
	const location = useLocation();
	const { t } = useLanguage();
	// Faqat System Admin ko'radiganlar: Sozlamalar, Kafedralar, Guruhlar,
	// Kategoriyalar, Ilmiy darajalar, O'quv yillari.
	// Same signal the /settings route guard uses — hiding a link is cosmetic,
	// the guard is what actually keeps a non-admin out.
	const { isTeacher, teacherProfile, user, isSystemAdmin } = useUserRole();

	const allAdminItems = [
		{ label: t("dashboard"),              icon: LayoutDashboard, path: "/" },
		{ label: "Foydalanuvchilar",          icon: Users,           path: "/users" },
		{ label: t("activities"),             icon: FileText,        path: "/activities" },
		{ label: t("review"),                 icon: CheckSquare,     path: "/review" },
		{ label: "Apellyatsiyalar",           icon: MessageSquare,   path: "/appeals" },
		{ label: t("rating"),                 icon: Award,           path: "/rating" },
		{ label: t("reports"),                icon: BarChart3,       path: "/reports" },
		{ type: "divider", label: t("catalogs"), adminOnly: true },
		{ label: t("departments"),            icon: BookOpen,        path: "/departments",   adminOnly: true },
		{ label: t("groups") || "Guruhlar",   icon: Layers,          path: "/groups",        adminOnly: true },
		{ label: t("categories"),             icon: FolderOpen,      path: "/categories",    adminOnly: true },
		{ label: t("degrees"),                icon: GraduationCap,   path: "/degrees",       adminOnly: true },
		{ label: t("academic_years"),         icon: Calendar,        path: "/academic-years",adminOnly: true },
		{ type: "divider", label: t("system") },
		{ label: t("public_rating"),          icon: Globe,           path: "/public-rating" },
		{ label: t("settings"),               icon: Settings,        path: "/settings",      adminOnly: true },
	];

	const adminMenuItems = allAdminItems.filter(
		(item) => !item.adminOnly || isSystemAdmin
	);

	const menuItems = isTeacher ? TEACHER_MENU : adminMenuItems;

	const roleLabel = isTeacher
		? (teacherProfile?.position || user?.position || "Professor-o'qituvchi")
		: "Administrator";

	return (
		<aside className={cn(
			"fixed left-0 top-0 h-screen bg-primary text-primary-foreground z-40 transition-all duration-300 flex flex-col",
			collapsed ? "w-16" : "w-64"
		)}>
			<div className="flex items-center h-16 px-4 border-b border-white/15">
				{!collapsed && (
					<div className="flex items-center gap-3">
						<img
							src="/favicon.svg"
							alt="KIUT Logo"
							className="w-9 h-9 object-contain"
						/>
						<div className="leading-tight">
							<p className="font-bold text-sm tracking-tight">{t("univ_name_line1")}</p>
							<p className="font-normal text-[11px] opacity-90 uppercase tracking-wide">{roleLabel}</p>
						</div>
					</div>
				)}
				{collapsed && (
					<img
						src="/favicon.svg"
						alt="KIUT Logo"
						className="w-9 h-9 object-contain mx-auto"
					/>
				)}
			</div>

			<nav className="flex-1 py-4 overflow-y-auto">
				{menuItems.map((item, i) => {
					if (item.type === "divider") {
						return (
							<div key={i} className="px-4 pt-6 pb-2">
								{!collapsed && (
									<span className="text-[11px] font-semibold uppercase tracking-widest text-white/65">
										{item.label}
									</span>
								)}
								{collapsed && <div className="border-t border-white/10" />}
							</div>
						);
					}

					const isActive =
						item.path === "/"
							? location.pathname === "/"
							: location.pathname.startsWith(item.path);
					const Icon = item.icon;

					return (
						<Link
							key={item.path}
							to={item.path}
							className={cn(
								"flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
								isActive
									? "bg-white/25 text-white shadow-sm"
									: "text-white/85 hover:bg-white/15 hover:text-white"
							)}
						>
							<Icon className="w-[18px] h-[18px] shrink-0" />
							{!collapsed && <span>{item.label}</span>}
						</Link>
					);
				})}
			</nav>

			<button
				onClick={onToggle}
				className="flex items-center justify-center h-12 border-t border-white/15 text-white/75 hover:text-white transition-colors"
			>
				{collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
			</button>
		</aside>
	);
}
