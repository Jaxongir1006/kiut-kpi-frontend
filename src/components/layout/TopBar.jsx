import { Bell, Search, Menu, Globe, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/context/LanguageContext";
import { logout } from "@/features/auth/authSlice";

export default function TopBar({ onMobileMenu }) {
	const { lang, changeLanguage, t } = useLanguage();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { user } = useSelector((state) => state.auth);

	const handleLogout = () => {
		dispatch(logout());
		navigate("/login", { replace: true });
	};

	const displayName = user?.full_name || user?.username || "Administrator";
	const displayEmail = user?.email || "admin@university.uz";
	const initials = displayName.slice(0, 2).toUpperCase();

	return (
		<header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" className="lg:hidden" onClick={onMobileMenu}>
					<Menu className="w-5 h-5" />
				</Button>
				<img
					src="/favicon.svg"
					alt="KIUT Logo"
					className="w-7 h-7 object-contain hidden lg:block"
				/>
				<div className="relative hidden md:block">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder={t("search")}
						className="pl-9 w-72 bg-muted/50 border-0 focus-visible:ring-1"
					/>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<Select value={lang} onValueChange={changeLanguage}>
					<SelectTrigger className="w-16 h-8 text-xs border-0 bg-muted/50">
						<Globe className="w-3 h-3 mr-1" />
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="uz">UZ</SelectItem>
						<SelectItem value="ru">RU</SelectItem>
						<SelectItem value="en">EN</SelectItem>
					</SelectContent>
				</Select>
				<Button variant="ghost" size="icon" className="relative">
					<Bell className="w-5 h-5 text-muted-foreground" />
					<span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
				</Button>
				<div className="flex items-center gap-3 pl-3 border-l border-border">
					<Avatar className="w-8 h-8">
						<AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
							{initials}
						</AvatarFallback>
					</Avatar>
					<div className="hidden sm:block">
						<p className="text-sm font-medium leading-none">{displayName}</p>
						<p className="text-xs text-muted-foreground">{displayEmail}</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleLogout}
						title="Chiqish"
						className="text-muted-foreground hover:text-destructive"
					>
						<LogOut className="w-4 h-4" />
					</Button>
				</div>
			</div>
		</header>
	);
}
