import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
	BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
	ResponsiveContainer, Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Plus, Eye, BarChart3, Calendar, CheckCircle2,
	Clock, Loader2, Download, ChevronRight, Trophy,
	TrendingUp, BookOpen, FlaskConical, Award,
} from "lucide-react";
import { format } from "date-fns";
import { fetchSubmissions } from "@/features/submissions/submissionsSlice";
import { fetchYears } from "@/features/academicYears/academicYearsSlice";
import { fetchTeachers } from "@/features/teachers/teachersSlice";
import { fetchSummaries } from "@/features/scoring/scoringSlice";
import { useUserRole } from "@/hooks/useUserRole";

const PIE_COLORS = [
	"hsl(200,100%,43%)", "hsl(142,71%,45%)", "hsl(271,76%,53%)",
	"hsl(38,92%,50%)",   "hsl(0,72%,51%)",   "hsl(178,70%,40%)",
];
const TARGET_BALL = 300;

const STATUS_CFG = {
	pending:             { label: "Kafedra kutmoqda",      cls: "bg-yellow-100 text-yellow-700" },
	department_approved: { label: "Kafedra tasdiqladi",    cls: "bg-blue-100 text-blue-700" },
	department_rejected: { label: "Kafedra rad etdi",      cls: "bg-orange-100 text-orange-700" },
	approved:            { label: "Tasdiqlangan",          cls: "bg-emerald-100 text-emerald-700" },
	rejected:            { label: "Rad etilgan",           cls: "bg-red-100 text-red-700" },
	overridden:          { label: "Komissiya o'zgartirdi", cls: "bg-purple-100 text-purple-700" },
};

// ── Gauge (sicqqa diagramma) ───────────────────────────────────────────────────
function SicqqaGauge({ percentage }) {
	const W = 260, H = 155, cx = 130, cy = 132, r = 95, sw = 10, lr = r + sw / 2 + 13;

	function ptAt(pct, radius = r) {
		const angle = Math.PI * (1 - pct / 100);
		return [cx + radius * Math.cos(angle), cy - radius * Math.sin(angle)];
	}
	function seg(p1, p2) {
		const [x1, y1] = ptAt(p1); const [x2, y2] = ptAt(p2);
		return `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${(p2 - p1) > 50 ? 1 : 0},1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
	}
	const pct = Math.min(100, Math.max(0, percentage));
	const nAngle = Math.PI * (1 - pct / 100);
	const nLen = r - sw / 2 - 3;
	const nex = cx + nLen * Math.cos(nAngle);
	const ney = cy - nLen * Math.sin(nAngle);
	const ticks = [
		{ p: 0,   label: "0%",    anchor: "end" },
		{ p: 40,  label: "40%",   anchor: "middle" },
		{ p: 65,  label: "65%",   anchor: "middle" },
		{ p: 85,  label: "85%",   anchor: "middle" },
		{ p: 100, label: "100%",  anchor: "start" },
	];
	return (
		<svg viewBox={`0 0 ${W} ${H}`} className="w-full">
			<path d={seg(0,40)}   fill="none" stroke="#ef4444" strokeWidth={sw} strokeLinecap="butt" />
			<path d={seg(40,65)}  fill="none" stroke="#f97316" strokeWidth={sw} strokeLinecap="butt" />
			<path d={seg(65,85)}  fill="none" stroke="#eab308" strokeWidth={sw} strokeLinecap="butt" />
			<path d={seg(85,100)} fill="none" stroke="#22c55e" strokeWidth={sw} strokeLinecap="butt" />
			<line x1={cx} y1={cy} x2={nex.toFixed(2)} y2={ney.toFixed(2)}
				stroke="#1e293b" strokeWidth={2.5} strokeLinecap="round" />
			<circle cx={cx} cy={cy} r={5} fill="#1e293b" />
			<circle cx={cx} cy={cy} r={2} fill="white" />
			{ticks.map(({ p, label, anchor }) => {
				const [lx, ly] = ptAt(p, lr);
				return (
					<text key={p} x={lx.toFixed(1)} y={(ly + 3).toFixed(1)}
						fontSize={9} textAnchor={anchor} fill="#6b7280">{label}</text>
				);
			})}
		</svg>
	);
}

// ── Rank card ──────────────────────────────────────────────────────────────────
function RankCard({ title, rank, total, label, color = "text-primary", bg = "bg-primary/10", icon: Icon = BarChart3 }) {
	return (
		<div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
			<div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
				<Icon className={`w-5 h-5 ${color}`} />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
				<div className="flex items-baseline gap-1 mt-0.5">
					<span className={`text-2xl font-bold ${color}`}>{rank ?? "—"}</span>
					{total && <span className="text-sm text-muted-foreground">/ {total}</span>}
				</div>
				{label && <p className="text-xs text-muted-foreground truncate mt-0.5">{label}</p>}
			</div>
		</div>
	);
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, sub2, colorClass = "text-foreground", icon: Icon, iconColor = "text-primary" }) {
	return (
		<div className="bg-card border border-border rounded-xl p-4">
			<div className="flex items-center justify-between mb-1">
				<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
				{Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
			</div>
			<div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
			{sub  && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
			{sub2 && <p className="text-xs text-muted-foreground">{sub2}</p>}
		</div>
	);
}

// Deterministic avatar color
function seedColor(str) {
	let h = 0;
	for (let i = 0; i < (str || "").length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
	return `hsl(${h},60%,48%)`;
}

export default function TeacherDashboard() {
	const dispatch   = useDispatch();
	const navigate   = useNavigate();
	const { teacherProfile, user } = useUserRole();

	const { list: submissions, isLoading } = useSelector((s) => s.submissions);
	const { list: years }    = useSelector((s) => s.academicYears);
	const { summaries }      = useSelector((s) => s.scoring);

	// Purely derived from `years` - nothing else ever sets it, so it does not
	// need to be state kept in sync by an effect.
	const activeYear = useMemo(
		() => years.find((y) => y.is_active) || years[0] || null,
		[years]
	);

	useEffect(() => {
		dispatch(fetchSubmissions());
		dispatch(fetchYears());
		dispatch(fetchTeachers());
	}, [dispatch]);

	useEffect(() => {
		if (activeYear?.id) {
			dispatch(fetchSummaries(activeYear.id));
		}
	}, [dispatch, activeYear]);

	const teacherId = teacherProfile?.id || user?.teacher_id;

	// ── O'z submissionlari ────────────────────────────────────────────
	const mySubmissions = useMemo(
		() => teacherId
			? submissions.filter((s) => s.teacher === teacherId || s.teacher_details?.id === teacherId)
			: submissions,
		[submissions, teacherId]
	);

	// Memoized so they are referentially stable: `approved` feeds the pieData
	// useMemo below, which otherwise recomputed on every single render.
	const approved   = useMemo(() => mySubmissions.filter((s) => s.status === "approved"), [mySubmissions]);
	const pending    = useMemo(() => mySubmissions.filter((s) => s.status === "pending"),  [mySubmissions]);
	const rejected   = useMemo(() => mySubmissions.filter((s) => s.status === "rejected"), [mySubmissions]);
	// The commission can change an already-approved score. That outcome had a
	// status label but no counter, so a teacher whose points were altered saw it
	// reflected in no total on this page -- on a screen about their own pay.
	const overridden = useMemo(() => mySubmissions.filter((s) => s.status === "overridden"), [mySubmissions]);

	// ── 1. BALL: teacherProfile.scores dan olish (to'g'ri manba) ────
	const scores = teacherProfile?.scores || {};
	const totalPoints        = parseFloat(scores.final_kpi_score         || 0);
	const academicPoints     = parseFloat(scores.academic_points      || 0);
	const qualificationPoints= parseFloat(scores.qualification_points || 0);
	const scientificPoints   = parseFloat(scores.scientific_points    || 0);

	// Agar scores bo'lmasa, fallback: submissionsdan hisoblash
	const fallbackTotal = approved.reduce((a, s) => a + parseFloat(s.points || 0), 0);
	const displayTotal  = totalPoints > 0 ? totalPoints : fallbackTotal;

	// ── 2. KAFEDRA STATISTIKASI ───────────────────────────────────────
	const myDeptId   = user?.department || teacherProfile?.department;
	const myDeptName = user?.department_details?.name
		|| teacherProfile?.department_details?.name
		|| teacherProfile?.department_name
		|| "—";

	// Shu kafedradagi barcha o'qituvchilar va ularning balllari
	const deptStats = useMemo(() => {
		// Summaries'dan shu kafedraga tegishlilarni filtrlaymiz
		const deptSummaries = summaries.filter(
			(s) => s.teacher_details?.department_details?.id === myDeptId
				|| s.teacher_details?.department === myDeptId
		);

		// Ularni ball bo'yicha saralab, joriy o'qituvchining reyting o'rnini topamiz
		const sorted = [...deptSummaries].sort(
			(a, b) => parseFloat(b.final_kpi_score || 0) - parseFloat(a.final_kpi_score || 0)
		);

		const myEmpId   = teacherProfile?.employee_id;
		const myRankIdx = sorted.findIndex(
			(s) => s.teacher_details?.employee_id === myEmpId
		);
		const myRank = myRankIdx >= 0 ? myRankIdx + 1 : null;

		const avgScore = deptSummaries.length
			? Math.round(deptSummaries.reduce((a, s) => a + parseFloat(s.final_kpi_score || 0), 0) / deptSummaries.length * 10) / 10
			: 0;

		const topInDept = sorted.slice(0, 5).map((s) => ({
			name:  s.teacher_details?.full_name || "—",
			empId: s.teacher_details?.employee_id || "",
			total: parseFloat(s.final_kpi_score || 0),
			isMe:  s.teacher_details?.employee_id === myEmpId,
		}));

		return {
			total:   deptSummaries.length,
			myRank,
			avgScore,
			topInDept,
		};
	}, [summaries, myDeptId, teacherProfile]);

	// ── Kafedra, Fakultet, Universitet reytingi (summaries asosida) ──
	const uniStats = useMemo(() => {
		const myEmpId = teacherProfile?.employee_id;
		const allSorted = [...summaries].sort(
			(a, b) => parseFloat(b.final_kpi_score || 0) - parseFloat(a.final_kpi_score || 0)
		);
		const uniRank = allSorted.findIndex(
			(s) => s.teacher_details?.employee_id === myEmpId
		);
		return {
			uniRank:   uniRank >= 0 ? uniRank + 1 : null,
			uniTotal:  allSorted.length,
		};
	}, [summaries, teacherProfile]);

	// ── Pie / bar chart ───────────────────────────────────────────────
	const pieData = useMemo(() => {
		if (academicPoints > 0 || qualificationPoints > 0 || scientificPoints > 0) {
			return [
				{ name: "Akademik",   value: Math.round(Math.abs(academicPoints) * 10) / 10,  color: "hsl(271,76%,53%)" },
				{ name: "Malakaviy",  value: Math.round(qualificationPoints * 10) / 10,        color: "hsl(200,100%,43%)" },
				{ name: "Ilmiy",      value: Math.round(scientificPoints * 10) / 10,            color: "hsl(142,71%,45%)" },
			].filter(p => p.value > 0);
		}
		// Fallback: submissionsdan
		const catMap = {};
		approved.forEach((s) => {
			const name = s.activity_type_details?.name || "Boshqa";
			catMap[name] = (catMap[name] || 0) + parseFloat(s.points || 0);
		});
		return Object.entries(catMap)
			.map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }))
			.sort((a, b) => b.value - a.value)
			.slice(0, 5);
	}, [academicPoints, qualificationPoints, scientificPoints, approved]);

	const totalPie = pieData.reduce((a, p) => a + p.value, 0);
	const barData  = pieData.map((p) => ({
		...p,
		pct: totalPie > 0 ? Math.round((p.value / totalPie) * 100) : 0,
	}));

	const recent = [...mySubmissions]
		.sort((a, b) => new Date(b.submission_date || 0) - new Date(a.submission_date || 0))
		.slice(0, 5);

	const percentage = TARGET_BALL > 0 ? Math.min(Math.round((displayTotal / TARGET_BALL) * 100), 100) : 0;

	const scoreColor = percentage >= 85 ? "text-emerald-600" : percentage >= 65 ? "text-yellow-500" : percentage >= 40 ? "text-orange-500" : "text-red-500";
	const scoreLabel = percentage >= 85 ? "A'lo natija" : percentage >= 65 ? "Yaxshi natija" : percentage >= 40 ? "Qoniqarli natija" : "Qoniqarsiz natija";
	const scoreBg    = percentage >= 85 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : percentage >= 65 ? "bg-yellow-50 border-yellow-200 text-yellow-700" : percentage >= 40 ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-red-50 border-red-200 text-red-700";

	const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.username || "O'qituvchi";
	const kpiDl    = activeYear?.end_date ? format(new Date(activeYear.end_date), "dd.MM.yyyy") : "30.06.2026";
	const appealDl = "15.07.2026";

	return (
		<div className="space-y-5">
			{/* ── Header ── */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-xl font-bold">Xush kelibsiz, {fullName} 👋</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						KPI topshirish muddati: <span className="font-medium text-foreground">{kpiDl}</span>
						{" | "}
						Apellyatsiya muddati: <span className="font-medium text-foreground">{appealDl}</span>
					</p>
				</div>
				<Button onClick={() => navigate("/my-kpi/new")} className="gap-2 shrink-0">
					<Plus className="w-4 h-4" /> Yangi KPI natijasi qo'shish
				</Button>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-20">
					<Loader2 className="w-7 h-7 animate-spin text-primary" />
				</div>
			) : (
				<>
					{/* ── 1. Ball stat kartalar (scores'dan) ── */}
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
						<StatCard
							title="Jami ball (tasdiqlangan)"
							value={displayTotal.toFixed(2)}
							sub={`Arizalar soni: ${mySubmissions.length}`}
							colorClass="text-emerald-600"
							icon={Award}
							iconColor="text-emerald-500"
						/>
						<StatCard
							title="Akademik ball"
							value={academicPoints.toFixed(2)}
							sub={`${approved.filter(s => s.activity_type_details?.category_name?.includes("Академическая")).length} ta faoliyat`}
							colorClass="text-purple-600"
							icon={BookOpen}
							iconColor="text-purple-500"
						/>
						<StatCard
							title="Malakaviy ball"
							value={qualificationPoints.toFixed(2)}
							sub={`${approved.filter(s => s.activity_type_details?.category_name?.includes("Квалификация")).length} ta faoliyat`}
							colorClass="text-blue-600"
							icon={TrendingUp}
							iconColor="text-blue-500"
						/>
						<StatCard
							title="Ilmiy ball"
							value={scientificPoints.toFixed(2)}
							sub={`${approved.filter(s => s.activity_type_details?.category_name?.includes("Научная")).length} ta faoliyat`}
							colorClass="text-emerald-700"
							icon={FlaskConical}
							iconColor="text-emerald-600"
						/>
						<div className="bg-card border border-border rounded-xl p-4">
							<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
								Holat bo'yicha
							</p>
							<div className="text-2xl font-bold">{mySubmissions.length}</div>
							<p className="text-xs text-muted-foreground mt-0.5">
								✅ Tasdiqlangan: {approved.length}
							</p>
							<p className="text-xs text-muted-foreground">
								⏳ Kutilmoqda: {pending.length}
							</p>
							<p className="text-xs text-muted-foreground">
								❌ Rad etilgan: {rejected.length}
							</p>
							{overridden.length > 0 && (
								<p className="text-xs text-muted-foreground">
									🔄 Komissiya o'zgartirdi: {overridden.length}
								</p>
							)}
						</div>
					</div>

					{/* ── 2. Kafedra statistikasi ── */}
					<div className="bg-card border border-border rounded-xl p-5">
						<div className="flex items-center gap-2 mb-4">
							<Trophy className="w-4 h-4 text-amber-500" />
							<h3 className="font-semibold text-sm">
								{myDeptName} kafedrasidagi statistika
							</h3>
							<Badge variant="secondary" className="text-xs border-0 bg-primary/10 text-primary ml-auto">
								{deptStats.total} ta o'qituvchi
							</Badge>
						</div>

						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
							<RankCard
								title="Kafedra reytingi"
								rank={deptStats.myRank}
								total={deptStats.total || "—"}
								label={myDeptName}
								color="text-primary"
								bg="bg-primary/10"
								icon={BarChart3}
							/>
							<RankCard
								title="Universitet reytingi"
								rank={uniStats.uniRank}
								total={uniStats.uniTotal || "—"}
								label="Barcha o'qituvchilar orasida"
								color="text-emerald-600"
								bg="bg-emerald-50"
								icon={Award}
							/>
							<RankCard
								title="O'rtacha ball (kafedra)"
								rank={deptStats.avgScore}
								label="Kafedra o'rtacha KPI balli"
								color="text-amber-600"
								bg="bg-amber-50"
								icon={TrendingUp}
							/>
							<RankCard
								title="Sizning jami ball"
								rank={displayTotal.toFixed(1)}
								label={`Maqsad: ${TARGET_BALL} ball`}
								color="text-blue-600"
								bg="bg-blue-50"
								icon={FlaskConical}
							/>
						</div>

						{/* Kafedra top 5 */}
						{deptStats.topInDept.length > 0 && (
							<div>
								<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
									Kafedra reytingi (top {deptStats.topInDept.length})
								</p>
								<div className="space-y-2">
									{deptStats.topInDept.map((t, i) => {
										const color   = seedColor(t.empId || t.name);
										const rankBg  = i === 0 ? "bg-yellow-400 text-white" : i === 1 ? "bg-gray-400 text-white" : i === 2 ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground";
										const pct     = deptStats.topInDept[0].total > 0
											? Math.round((t.total / deptStats.topInDept[0].total) * 100)
											: 0;
										return (
											<div
												key={i}
												className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${t.isMe ? "bg-primary/8 border border-primary/20" : "hover:bg-muted/40"}`}
											>
												<span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${rankBg}`}>
													{i + 1}
												</span>
												<Avatar className="w-8 h-8 shrink-0">
													<AvatarFallback style={{ background: color }} className="text-white text-xs font-bold">
														{(t.name.split(" ").map(n => n[0]).join("").slice(0, 2)).toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2">
														<p className={`text-sm font-medium truncate ${t.isMe ? "text-primary" : ""}`}>
															{t.name}
														</p>
														{t.isMe && (
															<Badge variant="secondary" className="text-[10px] border-0 bg-primary/15 text-primary shrink-0">Siz</Badge>
														)}
													</div>
													<div className="flex items-center gap-2 mt-1">
														<div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
															<div
																className="h-full rounded-full"
																style={{ width: `${pct}%`, background: color }}
															/>
														</div>
														<span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
													</div>
												</div>
												<p className="text-sm font-bold shrink-0" style={{ color }}>
													{t.total.toFixed(1)}
												</p>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>

					{/* ── 3. Bar chart + Gauge ── */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
						{/* Bar chart */}
						<div className="bg-card border border-border rounded-xl p-5">
							<h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4">
								Faoliyat yo'nalishlari bo'yicha ball taqsimoti
							</h3>
							{barData.length > 0 ? (
								<ResponsiveContainer width="100%" height={180}>
									<BarChart data={barData} layout="vertical" margin={{ left: 0, right: 50, top: 0, bottom: 0 }}>
										<CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(210,15%,91%)" />
										<XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
										<YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} axisLine={false} tickLine={false} />
										<Tooltip formatter={(v) => [`${v}%`, "Ulush"]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
										<Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={28}>
											{barData.map((d, i) => (
												<Cell key={i} fill={d.color || PIE_COLORS[i % PIE_COLORS.length]} />
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							) : (
								<div className="flex items-center justify-center h-44 text-muted-foreground text-sm">
									Tasdiqlangan faoliyatlar yo'q
								</div>
							)}

							{/* Ball qiymatlari */}
							{(academicPoints > 0 || qualificationPoints > 0 || scientificPoints > 0) && (
								<div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
									{[
										{ label: "Akademik",  val: academicPoints,      color: "hsl(271,76%,53%)" },
										{ label: "Malakaviy", val: qualificationPoints,  color: "hsl(200,100%,43%)" },
										{ label: "Ilmiy",     val: scientificPoints,     color: "hsl(142,71%,45%)" },
									].map((d) => (
										<div key={d.label} className="text-center">
											<p className="text-xs text-muted-foreground">{d.label}</p>
											<p className="text-base font-bold mt-0.5" style={{ color: d.color }}>
												{d.val.toFixed(1)}
											</p>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Gauge */}
						<div className="bg-card border border-border rounded-xl p-5">
							<h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
								Ball ko'rsatkichi (Sicqqa diagramma)
							</h3>
							<div className="flex gap-4">
								<div className="flex-1">
									<SicqqaGauge percentage={percentage} />
									<div className="text-center -mt-2">
										<p className={`text-3xl font-bold ${scoreColor}`}>{percentage}%</p>
										<p className="text-sm font-medium text-muted-foreground">
											{displayTotal.toFixed(2)} / {TARGET_BALL}
										</p>
										<p className="text-xs text-muted-foreground">Maqsad: {TARGET_BALL} ball</p>
									</div>
									<div className={`flex items-center gap-1.5 mt-3 p-2 rounded-lg border ${scoreBg}`}>
										<CheckCircle2 className="w-4 h-4 shrink-0" />
										<p className="text-xs">
											{scoreLabel} — Maqsadingizning {percentage}% ga erishdingiz
										</p>
									</div>
								</div>
								<div className="shrink-0">
									<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
										Ball ko'rsatkichi shkalasi
									</p>
									<div className="space-y-1.5 text-xs">
										{[
											{ color: "bg-emerald-500", range: "85% – 100%", label: "A'lo (Yashil)" },
											{ color: "bg-yellow-400",  range: "65% – 84%",  label: "Yaxshi (Sariq)" },
											{ color: "bg-orange-500",  range: "40% – 64%",  label: "Qoniqarli" },
											{ color: "bg-red-500",     range: "0% – 39%",   label: "Qoniqarsiz" },
										].map((s) => (
											<div key={s.range} className="flex items-center gap-2">
												<div className={`w-3 h-3 rounded shrink-0 ${s.color}`} />
												<span className="text-muted-foreground whitespace-nowrap">{s.range}</span>
												<span className="text-foreground">{s.label}</span>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* ── 4. So'nggi arizalar + Muhim vazifalar ── */}
					<div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
						{/* So'nggi arizalar */}
						<div className="lg:col-span-3 bg-card border border-border rounded-xl p-5">
							<h3 className="font-semibold mb-4 text-[11px] uppercase tracking-wider text-muted-foreground">
								So'nggi arizalar
							</h3>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-border">
											<th className="text-left pb-2 text-xs text-muted-foreground font-medium">№</th>
											<th className="text-left pb-2 text-xs text-muted-foreground font-medium">KPI mezoni</th>
											<th className="text-left pb-2 text-xs text-muted-foreground font-medium">Natija nomi</th>
											<th className="text-center pb-2 text-xs text-muted-foreground font-medium">Ball</th>
											<th className="text-center pb-2 text-xs text-muted-foreground font-medium">Holati</th>
											<th className="text-center pb-2 text-xs text-muted-foreground font-medium">Sana</th>
											<th className="pb-2" />
										</tr>
									</thead>
									<tbody>
										{recent.length === 0 ? (
											<tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">Ma'lumot yo'q</td></tr>
										) : (
											recent.map((sub, i) => {
												const cfg = STATUS_CFG[sub.status] || { label: sub.status, cls: "bg-gray-100 text-gray-600" };
												return (
													<tr key={sub.id} className="border-b border-border last:border-0">
														<td className="py-2.5 pr-2 text-muted-foreground">{i + 1}</td>
														<td className="py-2.5 pr-2 text-xs text-muted-foreground max-w-[100px]">
															<span className="line-clamp-2">{sub.activity_type_details?.name || "—"}</span>
														</td>
														<td className="py-2.5 pr-2 max-w-[160px]">
															<span className="line-clamp-2 text-sm font-medium">{sub.title}</span>
														</td>
														<td className="py-2.5 text-center">
															<span className="font-semibold text-primary">{sub.points ?? "—"}</span>
														</td>
														<td className="py-2.5 text-center">
															<Badge variant="secondary" className={`text-[11px] border-0 ${cfg.cls}`}>{cfg.label}</Badge>
														</td>
														<td className="py-2.5 text-center text-xs text-muted-foreground whitespace-nowrap">
															{sub.submission_date ? format(new Date(sub.submission_date), "dd.MM.yyyy") : "—"}
														</td>
														<td className="py-2.5 text-center">
															<Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate("/my-kpi")}>
																<Eye className="w-3.5 h-3.5" />
															</Button>
														</td>
													</tr>
												);
											})
										)}
									</tbody>
								</table>
							</div>
						</div>

						{/* O'ng panel */}
						<div className="lg:col-span-2 space-y-3">
							{/* Muhim vazifalar */}
							<div className="bg-card border border-border rounded-xl p-4">
								<h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
									Muhim vazifalar
								</h3>
								<div className="space-y-2">
									{rejected.length > 0 && (
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">Qaytarilgan arizalar</span>
											<Badge variant="secondary" className="bg-red-100 text-red-700 border-0">{rejected.length}</Badge>
										</div>
									)}
									{pending.length > 0 && (
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">Ko'rib chiqilmoqda</span>
											<Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-0">{pending.length}</Badge>
										</div>
									)}
									<div className="flex items-center justify-between text-sm pt-1 border-t border-border mt-2">
										<div className="flex items-center gap-1.5 text-muted-foreground">
											<Calendar className="w-3.5 h-3.5" />
											KPI topshirish muddati
										</div>
										<span className="text-xs font-medium text-red-600">{kpiDl}</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<div className="flex items-center gap-1.5 text-muted-foreground">
											<Clock className="w-3.5 h-3.5" />
											Apellyatsiya muddati
										</div>
										<span className="text-xs font-medium text-amber-600">{appealDl}</span>
									</div>
								</div>
								<Button variant="ghost" size="sm" className="w-full mt-2 text-primary text-xs" onClick={() => navigate("/my-kpi")}>
									Barchasini ko'rish <ChevronRight className="w-3.5 h-3.5 ml-1" />
								</Button>
							</div>

							{/* Muhim muddatlar */}
							<div className="bg-card border border-border rounded-xl p-4">
								<h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
									Muhim muddatlar
								</h3>
								<div className="space-y-2 text-sm">
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">KPI topshirish muddati</span>
										<span className="font-medium text-red-600 flex items-center gap-1">
											<Calendar className="w-3 h-3" /> {kpiDl}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Apellyatsiya muddati</span>
										<span className="font-medium text-amber-600 flex items-center gap-1">
											<Calendar className="w-3 h-3" /> {appealDl}
										</span>
									</div>
								</div>
							</div>

							{/* Tezkor hisobotlar */}
							<div className="bg-card border border-border rounded-xl p-4">
								<h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
									Tezkor hisobotlar
								</h3>
								<div className="grid grid-cols-2 gap-2">
									<Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => navigate("/reports")}>
										<Download className="w-3 h-3" /> PDF
									</Button>
									<Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => navigate("/reports")}>
										<Download className="w-3 h-3" /> Excel
									</Button>
								</div>
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
