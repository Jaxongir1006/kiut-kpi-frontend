import { useEffect } from "react";
import { Bell, Globe, LogOut, ChevronDown, HelpCircle, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ProtectedAvatarImage from "@/components/shared/ProtectedAvatarImage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/context/LanguageContext";
import { logout } from "@/features/auth/authSlice";
import { fetchYears } from "@/features/academicYears/academicYearsSlice";

export default function TeacherTopBar({ onMobileMenu, selectedYear, onYearChange }) {
	const { lang, changeLanguage, t } = useLanguage();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { user } = useSelector((s) => s.auth);
	const { list: years } = useSelector((s) => s.academicYears);

	useEffect(() => {
		if (!years.length) dispatch(fetchYears());
	}, [dispatch, years.length]);

	const handleLogout = () => {
		dispatch(logout());
		navigate("/login", { replace: true });
	};

	const name = user?.full_name || user?.username || "O'qituvchi";
	const dept =
		user?.department_details?.name ||
		user?.teacher_profile?.department_details?.name ||
		user?.department?.name ||
		"Kafedra";
	const photo = user?.photo || user?.teacher_profile?.photo || null;
	const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

	const activeYear = years.find((y) => y.id === selectedYear) || years.find((y) => y.is_active) || years[0];

	return (
		<header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
			{/* Left: mobile menu + year selector */}
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" className="lg:hidden" onClick={onMobileMenu}>
					<Menu className="w-5 h-5" />
				</Button>

				<Select value={selectedYear || ""} onValueChange={onYearChange}>
					<SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-0 h-auto gap-1.5 hover:bg-muted/50 rounded-lg px-2 py-1.5">
						<div className="flex flex-col items-start">
							<span className="text-sm font-semibold leading-tight">
								{activeYear?.name || "O'quv yili"}
							</span>
							<span className="text-[11px] text-muted-foreground leading-tight">{t("academic_year_label")}</span>
						</div>
						<ChevronDown className="w-4 h-4 text-muted-foreground" />
					</SelectTrigger>
					<SelectContent>
						{years.map((y) => (
							<SelectItem key={y.id} value={y.id}>
								{y.name}{y.is_active ? " (faol)" : ""}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Right: actions + user */}
			<div className="flex items-center gap-2">
				{/* Notification bell */}
				<Button variant="ghost" size="icon" onClick={() => navigate("/notifications")} title={t("notifications") || "Xabarnomalar"}>
					<Bell className="w-5 h-5 text-muted-foreground" />
				</Button>

				{/* Help */}
				<Button variant="ghost" size="icon">
					<HelpCircle className="w-5 h-5 text-muted-foreground" />
				</Button>

				{/* Language */}
				<Select value={lang} onValueChange={changeLanguage}>
					<SelectTrigger className="w-auto h-8 px-2 text-xs border-0 bg-muted/50 gap-1">
						<Globe className="w-3 h-3" />
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="uz">
							<span className="flex items-center gap-1.5">
								<Globe className="w-3 h-3" /> O'zbekcha
							</span>
						</SelectItem>
						<SelectItem value="ru">
							<span className="flex items-center gap-1.5">
								<Globe className="w-3 h-3" /> Русский
							</span>
						</SelectItem>
						<SelectItem value="en">
							<span className="flex items-center gap-1.5">
								<Globe className="w-3 h-3" /> English
							</span>
						</SelectItem>
					</SelectContent>
				</Select>

				{/* User info */}
				<div className="flex items-center gap-2 pl-3 border-l border-border">
					<Avatar className="w-9 h-9">
						<ProtectedAvatarImage src={photo} alt={name} className="object-cover" />
						<AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
							{initials}
						</AvatarFallback>
					</Avatar>
					<div className="hidden sm:block leading-tight">
						<p className="text-sm font-semibold leading-none">{name}</p>
						<p className="text-xs text-muted-foreground mt-0.5">{dept}</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleLogout}
						title="Chiqish"
						className="text-muted-foreground hover:text-destructive ml-1"
					>
						<LogOut className="w-4 h-4" />
					</Button>
				</div>
			</div>
		</header>
	);
}
