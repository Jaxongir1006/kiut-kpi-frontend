import { useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { Monitor, Smartphone, Globe, Shield, Bell, Palette, Eye, EyeOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

function Toggle({ checked, onChange }) {
	return (
		<button
			role="switch"
			aria-checked={checked}
			onClick={() => onChange(!checked)}
			className={cn(
				"relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
				checked ? "bg-primary" : "bg-muted-foreground/30"
			)}
		>
			<span className={cn(
				"inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform",
				checked ? "translate-x-6" : "translate-x-1"
			)} />
		</button>
	);
}

const SESSIONS = [
	{ device: "Windows • Chrome 124", location: "Toshkent, O'zbekiston", current: true, time: "" },
	{ device: "Windows • Edge 120",   location: "Toshkent, O'zbekiston", current: false, time: "20.05.2026 14:32" },
	{ device: "iPhone 14 • Safari",   location: "Toshkent, O'zbekiston", current: false, time: "18.05.2026 09:15" },
];

export default function TeacherSettings() {
	const { lang, changeLanguage } = useLanguage();
	const { user } = useSelector((s) => s.auth);

	const [showOld, setShowOld] = useState(false);
	const [showNew, setShowNew] = useState(false);
	const [showConf, setShowConf] = useState(false);

	const [notifs, setNotifs] = useState({
		system: true, newGrade: true, appeal: true, reports: false, email: true,
	});

	const [iface, setIface] = useState({
		darkMode: false, color: "Ko'k", density: "O'rta", pageDensity: "O'rta",
	});

	const toggleNotif = (key) => setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));

	const handleSaveProfile = () => toast.success("Profil saqlandi");
	const handleSaveLang = () => toast.success("Til sozlamalari saqlandi");
	const handleSavePwd = () => toast.success("Parol yangilandi");
	const handleSaveNotif = () => toast.success("Bildirishnoma sozlamalari saqlandi");
	const handleSaveIface = () => toast.success("Interfeys sozlamalari saqlandi");

	const displayName = user?.full_name || user?.username || "";

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Sozlamalar</h1>
					<p className="text-muted-foreground text-sm mt-0.5">Hisobingiz va ilova sozlamalarini boshqaring</p>
				</div>
				<Button variant="outline" size="sm" className="gap-2">
					<RefreshCw className="w-4 h-4" /> O'zgarishlarni tiklash
				</Button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
				{/* ── Profil sozlamalari ── */}
				<div className="bg-card border border-border rounded-xl p-5">
					<div className="flex items-center gap-2 mb-4">
						<div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
							<Globe className="w-4 h-4 text-primary" />
						</div>
						<h2 className="font-semibold">Profil sozlamalari</h2>
					</div>
					<div className="space-y-3">
						<div>
							<Label className="text-xs">To'liq ism familiya</Label>
							<Input className="mt-1" defaultValue={displayName} />
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label className="text-xs">Lavozim</Label>
								<Input className="mt-1" defaultValue="Professor-o'qituvchi" />
							</div>
							<div>
								<Label className="text-xs">Kafedra</Label>
								<Select defaultValue="kimyo">
									<SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
									<SelectContent>
										<SelectItem value="kimyo">Kimyo kadrasi</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div>
							<Label className="text-xs">Email manzil</Label>
							<Input className="mt-1" type="email" defaultValue={user?.email || "a.abduazizov@kiut.uz"} />
						</div>
						<div>
							<Label className="text-xs">Telefon raqam</Label>
							<Input className="mt-1" defaultValue="+998 90 123 45 67" />
						</div>
					</div>
					<Button className="w-full mt-4" onClick={handleSaveProfile}>Saqlash</Button>
				</div>

				{/* ── Til sozlamalari ── */}
				<div className="bg-card border border-border rounded-xl p-5">
					<div className="flex items-center gap-2 mb-4">
						<div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
							<Globe className="w-4 h-4 text-primary" />
						</div>
						<h2 className="font-semibold">Til sozlamalari</h2>
					</div>
					<div className="space-y-3">
						<div>
							<Label className="text-xs">Ilova tili</Label>
							<Select value={lang} onValueChange={changeLanguage}>
								<SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="uz">🇺🇿 O'zbekcha</SelectItem>
									<SelectItem value="ru">🇷🇺 Русский</SelectItem>
									<SelectItem value="en">🇬🇧 English</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
							Til o'zgartirilgandan so'ng, ba'zi o'zgarishlar sahifani qayta yuklashni talab qilishi mumkin.
						</div>
					</div>
					<Button className="w-full mt-4" onClick={handleSaveLang}>Saqlash</Button>
				</div>

				{/* ── Bildirishnoma sozlamalari ── */}
				<div className="bg-card border border-border rounded-xl p-5">
					<div className="flex items-center gap-2 mb-4">
						<div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
							<Bell className="w-4 h-4 text-primary" />
						</div>
						<h2 className="font-semibold">Bildirishnoma sozlamalari</h2>
					</div>
					<div className="space-y-4">
						{[
							{ key: "system",   label: "Tizim bildirishnomalari", sub: "Muhim tizim xabarlari va yangiliklar" },
							{ key: "newGrade", label: "Yangi baholar",            sub: "Yangi KPI baholari va natijalar" },
							{ key: "appeal",   label: "Apellyatsiya holati",      sub: "Apellyatsiya natijalari va o'zgarishlar" },
							{ key: "reports",  label: "Hisobotlar",               sub: "Oylik va choraklik hisobotlar" },
							{ key: "email",    label: "E-pochta orqali xabarlar", sub: "Bildirishnomalarni email orqali qabul qilish" },
						].map(({ key, label, sub }) => (
							<div key={key} className="flex items-start justify-between gap-3">
								<div>
									<p className="text-sm font-medium">{label}</p>
									<p className="text-xs text-muted-foreground">{sub}</p>
								</div>
								<Toggle checked={notifs[key]} onChange={() => toggleNotif(key)} />
							</div>
						))}
					</div>
					<Button className="w-full mt-4" onClick={handleSaveNotif}>Saqlash</Button>
				</div>

				{/* ── Faol sessiyalar ── */}
				<div className="bg-card border border-border rounded-xl p-5">
					<div className="flex items-center gap-2 mb-4">
						<div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
							<Monitor className="w-4 h-4 text-primary" />
						</div>
						<h2 className="font-semibold">Faol sessiyalar</h2>
						<p className="text-xs text-muted-foreground ml-1">Hisobingizga kirgan qurilmalar</p>
					</div>
					<div className="space-y-3">
						{SESSIONS.map((s, i) => (
							<div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
								<div className="flex items-center gap-3">
									{s.device.includes("iPhone") ? <Smartphone className="w-5 h-5 text-muted-foreground" /> : <Monitor className="w-5 h-5 text-muted-foreground" />}
									<div>
										<p className="text-sm font-medium">{s.device}</p>
										<p className="text-xs text-muted-foreground">{s.location}</p>
									</div>
								</div>
								{s.current ? (
									<span className="text-xs text-emerald-600 font-medium">Hozir</span>
								) : (
									<span className="text-xs text-muted-foreground">{s.time}</span>
								)}
							</div>
						))}
					</div>
					<Button variant="outline" size="sm" className="mt-4 w-full gap-2">
						<Shield className="w-4 h-4 text-destructive" />
						<span className="text-destructive">Barchasidan chiqish</span>
					</Button>
				</div>

				{/* ── Parol va xavfsizlik ── */}
				<div className="bg-card border border-border rounded-xl p-5">
					<div className="flex items-center gap-2 mb-4">
						<div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
							<Shield className="w-4 h-4 text-primary" />
						</div>
						<h2 className="font-semibold">Parol va xavfsizlik</h2>
					</div>
					<div className="space-y-3">
						<div>
							<Label className="text-xs">Joriy parol</Label>
							<div className="relative mt-1">
								<Input type={showOld ? "text" : "password"} placeholder="Joriy parolni kiriting" className="pr-10" />
								<button onClick={() => setShowOld((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
									{showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</button>
							</div>
						</div>
						<div>
							<Label className="text-xs">Yangi parol</Label>
							<div className="relative mt-1">
								<Input type={showNew ? "text" : "password"} placeholder="Yangi parol" className="pr-10" />
								<button onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
									{showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</button>
							</div>
						</div>
						<div>
							<Label className="text-xs">Yangi parolni tasdiqlang</Label>
							<div className="relative mt-1">
								<Input type={showConf ? "text" : "password"} placeholder="Yangi parolni qayta kiriting" className="pr-10" />
								<button onClick={() => setShowConf((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
									{showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</button>
							</div>
						</div>
						<div className="space-y-1 pt-1">
							{["Kamida 8 ta belgi", "Katta va kichik harflar", "Raqamlar bo'lishi shart", "Maxsus belgilar tavsiya etiladi"].map((r) => (
								<div key={r} className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<span className="text-emerald-500">✓</span> {r}
								</div>
							))}
						</div>
					</div>
					<Button className="w-full mt-4" onClick={handleSavePwd}>Saqlash</Button>
				</div>

				{/* ── Interfeys sozlamalari ── */}
				<div className="bg-card border border-border rounded-xl p-5">
					<div className="flex items-center gap-2 mb-4">
						<div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
							<Palette className="w-4 h-4 text-primary" />
						</div>
						<h2 className="font-semibold">Interfeys sozlamalari</h2>
					</div>
					<div className="space-y-4">
						<div className="flex items-start justify-between">
							<div>
								<p className="text-sm font-medium">Tungi rejim</p>
								<p className="text-xs text-muted-foreground">Ko'z uchun qulay tungi ko'rinish</p>
							</div>
							<Toggle checked={iface.darkMode} onChange={(v) => setIface((p) => ({ ...p, darkMode: v }))} />
						</div>
						<div>
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium">Asosiy rang</p>
									<p className="text-xs text-muted-foreground">Ilova asosiy rang sxemasini tanlang</p>
								</div>
								<Select value={iface.color} onValueChange={(v) => setIface((p) => ({ ...p, color: v }))}>
									<SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
									<SelectContent>
										<SelectItem value="Ko'k">Ko'k</SelectItem>
										<SelectItem value="Yashil">Yashil</SelectItem>
										<SelectItem value="Binafsha">Binafsha</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div>
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium">Jadval zichligi</p>
									<p className="text-xs text-muted-foreground">Jadvallardagi ma'lumot zichligi</p>
								</div>
								<Select value={iface.density} onValueChange={(v) => setIface((p) => ({ ...p, density: v }))}>
									<SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
									<SelectContent>
										<SelectItem value="Tor">Tor</SelectItem>
										<SelectItem value="O'rta">O'rta</SelectItem>
										<SelectItem value="Keng">Keng</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div>
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium">Sahifa elementlari zichligi</p>
									<p className="text-xs text-muted-foreground">UI elementlarining zichligini tanlang</p>
								</div>
								<Select value={iface.pageDensity} onValueChange={(v) => setIface((p) => ({ ...p, pageDensity: v }))}>
									<SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
									<SelectContent>
										<SelectItem value="Tor">Tor</SelectItem>
										<SelectItem value="O'rta">O'rta</SelectItem>
										<SelectItem value="Keng">Keng</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
					<Button className="w-full mt-4" onClick={handleSaveIface}>Saqlash</Button>
				</div>
			</div>
		</div>
	);
}
