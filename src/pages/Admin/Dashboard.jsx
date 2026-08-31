import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	BarChart, Bar, XAxis, YAxis, CartesianGrid,
	Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ProtectedAvatarImage from "@/components/shared/ProtectedAvatarImage";
import { Download, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import { fetchSummaries } from "@/features/scoring/scoringSlice";
import { fetchYears } from "@/features/academicYears/academicYearsSlice";
import { fetchSubmissions } from "@/features/submissions/submissionsSlice";
import { fetchTeachers } from "@/features/teachers/teachersSlice";
import { fetchUsers } from "@/features/users/usersSlice";
import PageHeader from "@/components/shared/PageHeader.jsx";

// ─── Rang palitlari ───────────────────────────────────────────────────────────
const PALETTE = [
	"hsl(200,100%,43%)",
	"hsl(142,71%,45%)",
	"hsl(271,76%,53%)",
	"hsl(38,92%,50%)",
	"hsl(0,72%,51%)",
	"hsl(178,70%,40%)",
	"hsl(330,80%,55%)",
	"hsl(60,80%,42%)",
	"hsl(16,90%,50%)",
	"hsl(248,80%,60%)",
	"hsl(100,60%,42%)",
	"hsl(195,80%,38%)",
];

const PIE_COLORS = [
	"hsl(200,100%,43%)",
	"hsl(142,71%,45%)",
	"hsl(271,76%,53%)",
	"hsl(38,92%,50%)",
	"hsl(0,72%,51%)",
	"hsl(178,70%,40%)",
	"hsl(330,80%,55%)",
];

const SUB_STATUS = {
	pending:    { label: "Kutilmoqda",    cls: "bg-yellow-100 text-yellow-700" },
	approved:   { label: "Tasdiqlangan",  cls: "bg-emerald-100 text-emerald-700" },
	rejected:   { label: "Rad etilgan",   cls: "bg-red-100 text-red-700" },
	overridden: { label: "Qaytarilgan",   cls: "bg-purple-100 text-purple-700" },
};

function SubBadge({ status }) {
	const cfg = SUB_STATUS[status] || { label: status, cls: "bg-gray-100 text-gray-600" };
	return (
		<Badge variant="secondary" className={`text-[11px] font-medium border-0 ${cfg.cls}`}>
			{cfg.label}
		</Badge>
	);
}

function GaugeCard({ label, value, max = 100, color = "hsl(200,100%,43%)", displayValue }) {
	const pct = max > 0 ? Math.min(parseFloat(value) / max, 1) : 0;
	const r = 38, sw = 9;
	const circ = 2 * Math.PI * r;
	const arc = circ * 0.75;
	const filled = arc * pct;

	return (
		<div className="flex flex-col items-center justify-center py-2">
			<div className="relative w-24 h-24">
				<svg viewBox="0 0 96 96" className="w-full h-full">
					<circle cx="48" cy="48" r={r} fill="none" stroke="hsl(210,40%,93%)" strokeWidth={sw}
						strokeDasharray={`${arc} ${circ - arc}`} strokeLinecap="round" transform="rotate(135 48 48)" />
					<circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth={sw}
						strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round" transform="rotate(135 48 48)" />
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<span className="text-xl font-bold">{displayValue ?? value}</span>
				</div>
			</div>
			<p className="text-xs text-muted-foreground text-center mt-1 leading-tight max-w-[100px]">{label}</p>
		</div>
	);
}

function initials(name) {
	return name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
}

// Avatar uchun rang (username yoki ismdan deterministik rang)
function seedColor(str) {
	let h = 0;
	for (let i = 0; i < (str || "").length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
	return `hsl(${h},65%,48%)`;
}

export default function Dashboard() {
	const { t } = useLanguage();
	const dispatch = useDispatch();

	// `topPerformers` below is derived from `summaries`, so the summaries request
	// is what the panel is actually waiting on. It previously spun on
	// isLeaderboardLoading while a whole second request -- /summaries/leaderboard/
	// -- was fetched on every year change and its response thrown away.
	const { summaries, isLoading: isScoringLoading } = useSelector((s) => s.scoring);
	const { list: submissions, isLoading: isSubsLoading }  = useSelector((s) => s.submissions);
	const { list: years }    = useSelector((s) => s.academicYears);
	const { list: teachers } = useSelector((s) => s.teachers);
	const { list: users }    = useSelector((s) => s.users);

	// null = not picked yet -> fall back to the active year (derived, not an effect).
	const [yearChoice, setYearChoice]           = useState(null);
	const [deptMetric, setDeptMetric]           = useState("total");
	const [activityFilter, setActivityFilter]   = useState("all");
	const [isExporting, setIsExporting]         = useState(false);

	const defaultYearId = years.find((y) => y.is_active)?.id || years[0]?.id || "";
	const selectedYear = yearChoice ?? defaultYearId;

	useEffect(() => {
		dispatch(fetchYears());
		dispatch(fetchSubmissions());
		dispatch(fetchTeachers());
		dispatch(fetchUsers());
	}, [dispatch]);

	useEffect(() => {
		if (selectedYear) {
			dispatch(fetchSummaries(selectedYear));
		}
	}, [dispatch, selectedYear]);

	// ── Department chart ───────────────────────────────────────────────
	const deptChartData = useMemo(() => {
		const deptMap = {};
		summaries.forEach((s) => {
			const name = s.teacher_details?.department_details?.name || "Noma'lum";
			if (!deptMap[name]) deptMap[name] = { name, total: 0, academic: 0, scientific: 0, qualification: 0 };
			deptMap[name].total         += parseFloat(s.total_points || 0);
			deptMap[name].academic      += parseFloat(s.academic_points || 0);
			deptMap[name].scientific    += parseFloat(s.scientific_points || 0);
			deptMap[name].qualification += parseFloat(s.qualification_points || 0);
		});
		return Object.values(deptMap)
			.map((d) => ({
				...d,
				total:         Math.round(d.total * 10) / 10,
				academic:      Math.round(d.academic * 10) / 10,
				scientific:    Math.round(d.scientific * 10) / 10,
				qualification: Math.round(d.qualification * 10) / 10,
			}))
			.sort((a, b) => b[deptMetric] - a[deptMetric]);
	}, [summaries, deptMetric]);

	// ── Pie chart ──────────────────────────────────────────────────────
	const pieData = useMemo(() => {
		const catMap = {};
		submissions.filter((s) => s.status === "approved").forEach((s) => {
			const name = s.activity_type_details?.name || "Boshqa";
			catMap[name] = (catMap[name] || 0) + 1;
		});
		return Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
	}, [submissions]);

	// ── Stats ──────────────────────────────────────────────────────────
	const totalSubs    = submissions.length;
	const approvedSubs = submissions.filter((s) => s.status === "approved").length;
	const pendingSubs  = submissions.filter((s) => s.status === "pending").length;
	const avgScore = summaries.length
		? Math.round(summaries.reduce((a, s) => a + parseFloat(s.total_points || 0), 0) / summaries.length)
		: 0;

	// ── Recent activity ───────────────────────────────────────────────
	const filteredSubs = activityFilter === "all"
		? submissions
		: submissions.filter((s) => s.status === activityFilter);
	const recentSubs = [...filteredSubs]
		.sort((a, b) => new Date(b.submission_date || 0) - new Date(a.submission_date || 0))
		.slice(0, 6);

	// ── Top Performance: /users/ apidan Teacher rolelilar ────────────
	const topPerformers = useMemo(() => {
		// 1. summaries → employee_id bo'yicha score xaritasi
		const scoreByEmpId = {};
		summaries.forEach((s) => {
			const empId = s.teacher_details?.employee_id;
			if (empId) scoreByEmpId[empId] = s;
		});

		// 2. teachers → user_details.id bo'yicha teacher profili xaritasi
		const teacherByUserId = {};
		teachers.forEach((t) => {
			// user_details.id yoki user maydoni orqali user ga bog'lash
			const uid = t.user_details?.id ?? t.user ?? null;
			if (uid != null) teacherByUserId[uid] = t;
		});

		// 3. Faqat Teacher role foydalanuvchilar
		const teacherUsers = users.filter((u) =>
			u.role_details?.name?.toLowerCase() === "teacher"
		);

		return teacherUsers
			.map((u) => {
				// user.id orqali teacher profilini topish
				const tchrProfile = teacherByUserId[u.id];
				const empId       = tchrProfile?.employee_id;
				// employee_id orqali scoreни topish
				const scoreData   = empId ? (scoreByEmpId[empId] || {}) : {};
				const fullName    = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username;

				return {
					id:       u.id,
					name:     fullName,
					username: u.username,
					photo:    u.photo || tchrProfile?.photo || null,
					dept:     (scoreData.teacher_details?.department_details?.name)
					          || tchrProfile?.department_details?.name
					          || "—",
					total:    parseFloat(scoreData.total_points    || 0),
					acad:     parseFloat(scoreData.academic_points || 0),
					qual:     parseFloat(scoreData.qualification_points || 0),
					sci:      parseFloat(scoreData.scientific_points   || 0),
				};
			})
			.sort((a, b) => b.total - a.total);
	}, [users, summaries, teachers]);

	// ── CSV export ─────────────────────────────────────────────────────
	const handleExport = async () => {
		setIsExporting(true);
		try {
			const url = selectedYear
				? `/api/reports/export-csv/?year_id=${selectedYear}`
				: "/api/reports/export-csv/";
			const csvData = await axiosInstance.get(url);
			const yearName = years.find((y) => y.id === selectedYear)?.name || "faol";
			const blob = new Blob(["﻿" + csvData], { type: "text/csv;charset=utf-8;" });
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);
			link.download = `hisobot_${yearName}.csv`;
			link.click();
			URL.revokeObjectURL(link.href);
			toast.success("Excel yuklab olindi");
		} catch {
			toast.error("Eksport xatoligi yuz berdi");
		} finally {
			setIsExporting(false);
		}
	};

	const deptMetricLabels = {
		total: "Jami ball", academic: "Akademik", scientific: "Ilmiy", qualification: "Tashkiliy",
	};

	return (
		<div className="space-y-5">
			<PageHeader title={t("dashboard_title")} description={t("dashboard_settings_desc")}>
				<div className="flex justify-end items-center gap-3">
					<Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="gap-2 h-9">
						{isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
						Excel
					</Button>
					<Select value={selectedYear} onValueChange={setYearChoice}>
						<SelectTrigger className="w-36 h-9">
							<SelectValue placeholder="O'quv yili" />
						</SelectTrigger>
						<SelectContent>
							{years.map((y) => (
								<SelectItem key={y.id} value={y.id}>{y.name}{y.is_active ? " ✓" : ""}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</PageHeader>

			{/* Row 1: Top Performance + Department Performance */}
			<div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

				{/* ── Top Performance ── */}
				<div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 flex flex-col">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-base font-semibold">Top Performance</h3>
						<Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
							{topPerformers.length} ta o'qituvchi
						</Badge>
					</div>

					{isScoringLoading ? (
						<div className="flex-1 flex items-center justify-center">
							<Loader2 className="w-6 h-6 animate-spin text-primary" />
						</div>
					) : topPerformers.length === 0 ? (
						<p className="text-muted-foreground text-sm text-center py-8">Ma'lumot yo'q</p>
					) : (
						<div className="space-y-0.5 overflow-y-auto flex-1 max-h-[420px] pr-1">
							{topPerformers.map((item, i) => {
								const color = seedColor(item.username);
								const rankBg =
									i === 0 ? "bg-yellow-400 text-white" :
									i === 1 ? "bg-gray-400 text-white" :
									i === 2 ? "bg-amber-600 text-white" :
									"bg-muted text-muted-foreground";

								return (
									<div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
										{/* Rank */}
										<span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${rankBg}`}>
											{i + 1}
										</span>

										{/* Avatar */}
										<Avatar className="w-9 h-9 shrink-0 ring-2 ring-offset-1" style={{ "--tw-ring-color": color }}>
											<ProtectedAvatarImage src={item.photo} alt={item.name} className="object-cover" />
											<AvatarFallback style={{ background: color }} className="text-white text-xs font-semibold">
												{initials(item.name)}
											</AvatarFallback>
										</Avatar>

										{/* Info */}
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium truncate leading-tight">{item.name}</p>
											<p className="text-[11px] text-muted-foreground truncate">{item.dept}</p>
										</div>

										{/* Ball */}
										<div className="text-right shrink-0">
											<p className="text-sm font-bold" style={{ color }}>
												{item.total.toFixed(1)}
											</p>
											<p className="text-[10px] text-muted-foreground">ball</p>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* ── Department Performance ── */}
				<div className="lg:col-span-3 bg-card border border-border rounded-xl p-5">
					<div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
						<h3 className="font-semibold">Kafedra natijalari</h3>
						<div className="flex items-center gap-2">
							<Select value={deptMetric} onValueChange={setDeptMetric}>
								<SelectTrigger className="h-8 text-sm w-36">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="total">Jami ball</SelectItem>
									<SelectItem value="academic">Akademik</SelectItem>
									<SelectItem value="scientific">Ilmiy</SelectItem>
									<SelectItem value="qualification">Tashkiliy</SelectItem>
								</SelectContent>
							</Select>
							<Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="gap-1.5 h-8 text-xs">
								<Download className="w-3.5 h-3.5" /> Hisobot
							</Button>
						</div>
					</div>

					{deptChartData.length > 0 ? (
						<ResponsiveContainer width="100%" height={190}>
							<BarChart data={deptChartData} layout="vertical" margin={{ left: 8, right: 20, top: 0, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(210,15%,91%)" />
								<XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
								<YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} axisLine={false} tickLine={false} />
								<Tooltip formatter={(v) => [`${Number(v).toFixed(1)} ball`, deptMetricLabels[deptMetric]]}
									contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
								<Bar dataKey={deptMetric} radius={[0, 5, 5, 0]} maxBarSize={26}>
									{deptChartData.map((_, i) => (
										<Cell key={i} fill={PALETTE[i % PALETTE.length]} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					) : (
						<div className="flex items-center justify-center h-44 text-muted-foreground text-sm">
							Ma'lumot topilmadi
						</div>
					)}

					{pieData.length > 0 && (
						<div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
							<PieChart width={110} height={90}>
								<Pie data={pieData} cx={52} cy={44} innerRadius={26} outerRadius={42} dataKey="value" stroke="none">
									{pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
								</Pie>
								<Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
							</PieChart>
							<div className="flex flex-col gap-1.5">
								{pieData.slice(0, 6).map((item, i) => (
									<div key={item.name} className="flex items-center gap-2 text-xs">
										<div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
										<span className="text-muted-foreground truncate max-w-[180px]">
											{item.name} <span className="font-medium text-foreground">({item.value})</span>
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Row 2: Recent Activity + KPI Overview */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

				{/* Recent Activity */}
				<div className="bg-card border border-border rounded-xl p-5">
					<div className="flex items-center justify-between mb-4">
						<h3 className="font-semibold">So'nggi faoliyatlar</h3>
						<Select value={activityFilter} onValueChange={setActivityFilter}>
							<SelectTrigger className="h-8 text-sm w-36">
								<SelectValue placeholder="Filter" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Barchasi</SelectItem>
								<SelectItem value="pending">Kutilmoqda</SelectItem>
								<SelectItem value="approved">Tasdiqlangan</SelectItem>
								<SelectItem value="rejected">Rad etilgan</SelectItem>
								<SelectItem value="overridden">Qaytarilgan</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{isSubsLoading ? (
						<div className="flex justify-center py-10">
							<Loader2 className="w-5 h-5 animate-spin text-primary" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border">
										<th className="text-left pb-2 text-xs text-muted-foreground font-medium w-7">#</th>
										<th className="text-left pb-2 text-xs text-muted-foreground font-medium">Sarlavha</th>
										<th className="text-center pb-2 text-xs text-muted-foreground font-medium hidden sm:table-cell">Yil</th>
										<th className="text-center pb-2 text-xs text-muted-foreground font-medium">Holat</th>
									</tr>
								</thead>
								<tbody>
									{recentSubs.length === 0 ? (
										<tr>
											<td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">Ma'lumot topilmadi</td>
										</tr>
									) : recentSubs.map((sub, i) => (
										<tr key={sub.id} className="border-b border-border last:border-0">
											<td className="py-2.5 text-muted-foreground text-xs">{i + 1}</td>
											<td className="py-2.5 pr-2">
												<p className="text-sm font-medium line-clamp-2 leading-snug">{sub.title}</p>
												<p className="text-xs text-muted-foreground mt-0.5">{sub.activity_type_details?.name}</p>
											</td>
											<td className="py-2.5 text-center text-xs text-muted-foreground whitespace-nowrap hidden sm:table-cell">
												{sub.academic_year_details?.name || "—"}
											</td>
											<td className="py-2.5 text-center">
												<SubBadge status={sub.status} />
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* KPI Overview */}
				<div className="bg-card border border-border rounded-xl p-5">
					<h3 className="font-semibold mb-2">KPI ko'rsatkichlari</h3>
					<div className="grid grid-cols-2 gap-2">
						<GaugeCard label={`Faoliyatlar (${totalSubs})`} value={totalSubs}
							max={Math.max(totalSubs * 1.5, 10)} color="hsl(200,100%,43%)" />
						<GaugeCard label={`Tasdiqlangan (${approvedSubs})`} value={approvedSubs}
							max={Math.max(totalSubs, 1)} color="hsl(142,71%,45%)" />
						<GaugeCard label="O'rtacha ball" value={avgScore} max={300}
							displayValue={avgScore} color="hsl(38,92%,50%)" />
						<GaugeCard label={`Kutilmoqda (${pendingSubs})`} value={pendingSubs}
							max={Math.max(totalSubs, 1)} color="hsl(271,76%,53%)" />
					</div>
				</div>
			</div>
		</div>
	);
}
