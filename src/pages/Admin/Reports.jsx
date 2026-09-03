import { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
	ResponsiveContainer, Legend, Cell,
} from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import { Download, FileText, Loader2, Filter, TrendingUp, Award } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import { fetchSummaries } from "@/features/scoring/scoringSlice";
import { fetchYears } from "@/features/academicYears/academicYearsSlice";
import { fetchTeachers } from "@/features/teachers/teachersSlice";
import { fetchSubmissions } from "@/features/submissions/submissionsSlice";
import { fetchTypes } from "@/features/types/typesSlice";
import { fetchCategories } from "@/features/categories/categoriesSlice";

// ─── KPI Jadval ma'lumotlari ──────────────────────────────────────────────────
const KPI_TABLE = [
	{ range: "100 – 110", allowance: 10 },
	{ range: "111 – 120", allowance: 15 },
	{ range: "121 – 130", allowance: 20 },
	{ range: "131 – 140", allowance: 25 },
	{ range: "141 – 150", allowance: 30 },
	{ range: "151 – 160", allowance: 35 },
	{ range: "161 – 170", allowance: 45 },
	{ range: "171 – 180", allowance: 50 },
	{ range: "181 – 190", allowance: 55 },
	{ range: "191 – 200", allowance: 60 },
	{ range: "201 – 210", allowance: 65 },
	{ range: "211 – 220", allowance: 70 },
	{ range: "221 – 230", allowance: 75 },
	{ range: "231 – 240", allowance: 80 },
	{ range: "241 – 250", allowance: 85 },
	{ range: "251 – 260", allowance: 90 },
	{ range: "261 – 270", allowance: 95 },
	{ range: "271 – 300", allowance: 100 },
];

// ─── Rang palitlari ───────────────────────────────────────────────────────────
const COLORS = {
	qual:    "hsl(200,100%,43%)",
	sci:     "hsl(142,71%,45%)",
	acad:    "hsl(271,76%,53%)",
	neg:     "hsl(0,72%,51%)",
	neutral: "hsl(215,16%,47%)",
};

const PALETTE = [
	"hsl(200,100%,43%)",
	"hsl(142,71%,45%)",
	"hsl(271,76%,53%)",
	"hsl(38,92%,50%)",
	"hsl(0,72%,51%)",
	"hsl(178,70%,40%)",
	"hsl(330,80%,55%)",
	"hsl(60,75%,42%)",
	"hsl(16,90%,50%)",
	"hsl(248,80%,60%)",
	"hsl(100,60%,42%)",
	"hsl(195,80%,38%)",
	"hsl(20,90%,52%)",
	"hsl(160,65%,38%)",
	"hsl(300,60%,52%)",
];

// ─── Yordamchi komponentlar ───────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color = "text-primary" }) {
	return (
		<div className="bg-card border border-border rounded-xl p-5">
			<div className="flex items-center justify-between mb-2">
				<p className="text-sm text-muted-foreground">{label}</p>
				{Icon && <Icon className={`w-4 h-4 ${color}`} />}
			</div>
			<p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
		</div>
	);
}

function SectionTitle({ children }) {
	return (
		<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
			{children}
		</h3>
	);
}

function CustomYTick({ x, y, payload }) {
	const maxLen = 30;
	const text = payload.value.length > maxLen ? payload.value.slice(0, maxLen) + "…" : payload.value;
	return (
		<text x={x} y={y} dy={4} textAnchor="end" fontSize={11} fill="hsl(215.4,16.3%,46.9%)">
			{text}
		</text>
	);
}

function HorizBarChart({ data, dataKey, color, height, colorful = false }) {
	const h = Math.max((data?.length || 1) * 56, 180);
	return (
		<ResponsiveContainer width="100%" height={height || h}>
			<BarChart data={data} layout="vertical" margin={{ top: 4, right: 30, bottom: 4, left: 8 }}>
				<CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(210,15%,91%)" />
				<XAxis type="number" tick={{ fontSize: 11, fill: "hsl(215.4,16.3%,46.9%)" }} axisLine={false} tickLine={false} />
				<YAxis type="category" dataKey="name" tick={<CustomYTick />} width={190} axisLine={false} tickLine={false} />
				<Tooltip
					formatter={(v) => [`${v}`, "Soni"]}
					contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214.3,31.8%,91.4%)", fontSize: "12px" }}
					cursor={{ fill: "hsl(210,40%,96%)" }}
				/>
				<Bar dataKey={dataKey} radius={[0, 6, 6, 0]} maxBarSize={40} fill={color || COLORS.qual}>
					{colorful && data?.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
}

// ─── ASOSIY KOMPONENT ─────────────────────────────────────────────────────────
export default function Reports() {
	const { t } = useLanguage();
	const dispatch = useDispatch();
	const printRef = useRef(null);

	const { summaries, isLoading: isSummariesLoading } = useSelector((s) => s.scoring);
	const { list: years }       = useSelector((s) => s.academicYears);
	const { list: teachers }    = useSelector((s) => s.teachers);
	const { list: submissions } = useSelector((s) => s.submissions);

	const [yearFilter, setYearFilter] = useState("all");
	const [isExporting, setIsExporting] = useState(false);
	const [isPdfLoading, setIsPdfLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("barchasi");

	useEffect(() => {
		dispatch(fetchYears());
		dispatch(fetchTeachers());
		dispatch(fetchSubmissions());
		dispatch(fetchTypes());
		dispatch(fetchCategories());
	}, [dispatch]);

	useEffect(() => {
		dispatch(fetchSummaries(yearFilter === "all" ? undefined : yearFilter));
	}, [dispatch, yearFilter]);

	// ── Filtrlanган submissions ──────────────────────────────────────────
	const filteredSubs = useMemo(() => yearFilter === "all"
		? submissions
		: submissions.filter(s => s.academic_year === yearFilter || s.academic_year_details?.id === yearFilter),
		[submissions, yearFilter]
	);
	const approvedSubs = useMemo(() => filteredSubs.filter(s => s.status === "approved"), [filteredSubs]);

	// ── Stat cards ──────────────────────────────────────────────────────
	const totalTeachers  = teachers.length;
	const totalActivities = filteredSubs.length;
	const totalApproved  = approvedSubs.length;
	const avgScore = useMemo(() => summaries.length
		? Math.round(summaries.reduce((a, s) => a + parseFloat(s.final_kpi_score || 0), 0) / summaries.length)
		: 0, [summaries]
	);

	// ── 1. OVERVIEW: kategoriyalar bo'yicha domain balllar ──────────────
	const overviewData = useMemo(() => {
		const totalAcad  = summaries.reduce((a, s) => a + parseFloat(s.academic_points || 0), 0);
		const totalQual  = summaries.reduce((a, s) => a + parseFloat(s.qualification_points || 0), 0);
		const totalSci   = summaries.reduce((a, s) => a + parseFloat(s.scientific_points || 0), 0);
		return [
			{ name: "Akademik",        ball: Math.round(Math.abs(totalAcad) * 10) / 10, color: COLORS.acad },
			{ name: "Malakaviy",       ball: Math.round(totalQual * 10) / 10,            color: COLORS.qual },
			{ name: "Ilmiy",           ball: Math.round(totalSci * 10) / 10,             color: COLORS.sci  },
		];
	}, [summaries]);

	// ── 2. KAFEDRA bo'yicha jami ball ───────────────────────────────────
	const deptChartData = useMemo(() => {
		const map = {};
		summaries.forEach(s => {
			const name = s.teacher_details?.department_details?.name || "Noma'lum";
			if (!map[name]) map[name] = { acad: 0, qual: 0, sci: 0, total: 0 };
			map[name].acad  += parseFloat(s.academic_points || 0);
			map[name].qual  += parseFloat(s.qualification_points || 0);
			map[name].sci   += parseFloat(s.scientific_points || 0);
			map[name].total += parseFloat(s.final_kpi_score || 0);
		});
		return Object.entries(map)
			.map(([name, v]) => ({ name, ...v, total: Math.round(v.total * 10) / 10 }))
			.sort((a, b) => b.total - a.total);
	}, [summaries]);

	// ── 3. Kategoriya bo'yicha type statistikasi ─────────────────────────
	const catTypeStats = useMemo(() => {
		const map = {};
		approvedSubs.forEach(s => {
			const typeName = s.activity_type_details?.name;
			const catName  = s.activity_type_details?.category_name;
			if (!typeName) return;
			const key = `${catName}::${typeName}`;
			map[key] = { typeName, catName, count: (map[key]?.count || 0) + 1 };
		});
		return Object.values(map).sort((a, b) => b.count - a.count);
	}, [approvedSubs]);

	const qualStats  = catTypeStats.filter(x => x.catName?.includes("Квалификация"));
	const sciStats   = catTypeStats.filter(x => x.catName?.includes("Научная"));
	const acadStats  = catTypeStats.filter(x => x.catName?.includes("Академическая"));

	// ── 4. Top o'qituvchilar ─────────────────────────────────────────────
	const topTeachers = useMemo(() =>
		[...summaries]
			.sort((a, b) => parseFloat(b.final_kpi_score || 0) - parseFloat(a.final_kpi_score || 0))
			.slice(0, 10)
			.map(s => ({
				name:  s.teacher_details?.full_name || "—",
				total: parseFloat(s.final_kpi_score || 0),
				acad:  parseFloat(s.academic_points || 0),
				qual:  parseFloat(s.qualification_points || 0),
				sci:   parseFloat(s.scientific_points || 0),
			})),
		[summaries]
	);

	// ── Umumiy faoliyat status taqsimoti ─────────────────────────────────
	const statusDist = useMemo(() => {
		const m = {};
		filteredSubs.forEach(s => { m[s.status] = (m[s.status] || 0) + 1; });
		return m;
	}, [filteredSubs]);

	const STATUS_LABELS = {
		pending:  "Kutilmoqda",
		approved: "Tasdiqlangan",
		rejected: "Rad etilgan",
		overridden: "Ball o'zgartirilgan",
	};
	const STATUS_COLORS = {
		pending:   "bg-yellow-100 text-yellow-700",
		approved:  "bg-emerald-100 text-emerald-700",
		rejected:  "bg-red-100 text-red-700",
		overridden:"bg-purple-100 text-purple-700",
	};

	// ── CSV Export ─────────────────────────────────────────────────────
	const handleExportCsv = async () => {
		setIsExporting(true);
		try {
			const url = yearFilter !== "all"
				? `/api/reports/export-csv/?year_id=${yearFilter}`
				: "/api/reports/export-csv/";
			const csvData = await axiosInstance.get(url);
			const yearName = years.find(y => y.id === yearFilter)?.name || "hisobot";
			const blob = new Blob(["﻿" + csvData], { type: "text/csv;charset=utf-8;" });
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);
			link.download = `kpi_hisobot_${yearName}.csv`;
			link.click();
			URL.revokeObjectURL(link.href);
			toast.success("Excel muvaffaqiyatli yuklab olindi");
		} catch {
			toast.error("Eksport xatoligi yuz berdi");
		} finally {
			setIsExporting(false);
		}
	};

	// ── PDF Export ─────────────────────────────────────────────────────
	const handleExportPdf = async () => {
		setIsPdfLoading(true);
		try {
			const { default: jsPDF } = await import("jspdf");
			const { default: html2canvas } = await import("html2canvas");

			const el = printRef.current;
			if (!el) { toast.error("PDF element topilmadi"); return; }

			toast.info("PDF tayyorlanmoqda...");

			const canvas = await html2canvas(el, {
				scale: 2,
				useCORS: true,
				logging: false,
				backgroundColor: "#ffffff",
			});

			const pdf = new jsPDF({
				orientation: canvas.width > canvas.height ? "l" : "p",
				unit: "mm",
				format: "a4",
			});

			const pdfW = pdf.internal.pageSize.getWidth();
			const pdfH = pdf.internal.pageSize.getHeight();
			const imgW = canvas.width;
			const imgH = canvas.height;
			const ratio = Math.min(pdfW / imgW, pdfH / imgH);
			const x = (pdfW - imgW * ratio) / 2;
			const y = 8;

			// Multi-page support
			const pageH = pdfH - 16;
			let posY = 0;
			let pageNum = 0;

			while (posY < imgH) {
				if (pageNum > 0) pdf.addPage();
				const srcH = Math.min(pageH / ratio, imgH - posY);
				const dstH = srcH * ratio;

				// Crop canvas for this page
				const pageCanvas = document.createElement("canvas");
				pageCanvas.width = imgW;
				pageCanvas.height = srcH;
				const ctx = pageCanvas.getContext("2d");
				ctx.drawImage(canvas, 0, posY, imgW, srcH, 0, 0, imgW, srcH);
				const pageImg = pageCanvas.toDataURL("image/png");
				pdf.addImage(pageImg, "PNG", x, y, imgW * ratio, dstH);
				posY += srcH;
				pageNum++;
			}

			const yearName = years.find(y => y.id === yearFilter)?.name || "hisobot";
			pdf.save(`kpi_hisobot_${yearName}.pdf`);
			toast.success("PDF muvaffaqiyatli yuklab olindi!");
		} catch (err) {
			console.error(err);
			toast.error("PDF generatsiya xatoligi: " + err.message);
		} finally {
			setIsPdfLoading(false);
		}
	};

	const activeYear = years.find(y => y.is_active);

	return (
		<div>
			{/* Header */}
			<PageHeader title={t("reports_title") || "Hisobotlar"} description="KPI statistika va hisobotlar">
				<Button variant="outline" onClick={handleExportCsv} disabled={isExporting} className="gap-2">
					{isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
					Excel
				</Button>
				<Button onClick={handleExportPdf} disabled={isPdfLoading} className="gap-2">
					{isPdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
					PDF yuklab olish
				</Button>
			</PageHeader>

			{/* Yil filter */}
			<div className="flex items-center gap-3 mb-6">
				<Filter className="w-4 h-4 text-muted-foreground shrink-0" />
				<Select value={yearFilter} onValueChange={setYearFilter}>
					<SelectTrigger className="w-44 h-9 text-sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Barcha yillar</SelectItem>
						{years.map(y => (
							<SelectItem key={y.id} value={y.id}>{y.name}{y.is_active ? " ✓" : ""}</SelectItem>
						))}
					</SelectContent>
				</Select>
				{yearFilter !== "all" && (
					<Button variant="ghost" size="sm" onClick={() => setYearFilter("all")} className="h-8 text-xs">
						Tozalash
					</Button>
				)}
				{activeYear && (
					<Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 border-0">
						Faol yil: {activeYear.name}
					</Badge>
				)}
			</div>

			{/* === PDF ga tushiriladigan qism === */}
			<div ref={printRef}>

				{/* Stat cards */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
					<StatCard label="O'qituvchilar" value={totalTeachers} icon={Award} color="text-blue-600" />
					<StatCard label="Jami faoliyatlar" value={totalActivities} icon={TrendingUp} color="text-purple-600" />
					<StatCard label="Tasdiqlangan" value={totalApproved} color="text-emerald-600" />
					<StatCard label="O'rtacha ball" value={avgScore} isLoading={isSummariesLoading} color="text-orange-600" />
				</div>

				{/* Faoliyat holati */}
				<div className="flex flex-wrap gap-2 mb-6">
					{Object.entries(statusDist).map(([st, cnt]) => (
						<Badge key={st} variant="secondary" className={`border-0 gap-1 text-sm ${STATUS_COLORS[st] || "bg-gray-100 text-gray-600"}`}>
							{STATUS_LABELS[st] || st}: <span className="font-bold">{cnt}</span>
						</Badge>
					))}
				</div>

				{/* Tabs */}
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="mb-6 flex-wrap h-auto gap-1">
						<TabsTrigger value="barchasi">📑 Barchasi</TabsTrigger>
						<TabsTrigger value="overview">📊 Umumiy</TabsTrigger>
						<TabsTrigger value="department">🏢 Kafedralar</TabsTrigger>
						<TabsTrigger value="qualification">🎓 Malakaviy</TabsTrigger>
						<TabsTrigger value="scientific">🔬 Ilmiy</TabsTrigger>
						<TabsTrigger value="academic">📚 Akademik</TabsTrigger>
						<TabsTrigger value="top">🏆 Top o'qituvchilar</TabsTrigger>
						<TabsTrigger value="kpi">📋 KPI Jadval</TabsTrigger>
					</TabsList>

					{/* ─── BARCHASI ────────────────────────────────────────────────── */}
					<TabsContent value="barchasi">
						<div className="space-y-8">

							{/* 1. Umumiy — domain ballar + taqsimot */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<div className="bg-card border border-border rounded-xl p-6">
									<SectionTitle>The Statistics of Scientific Activity</SectionTitle>
									<p className="text-xs text-muted-foreground mb-4">Domain bo'yicha jami ballar</p>
									<ResponsiveContainer width="100%" height={220}>
										<BarChart data={overviewData} margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
											<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(210,15%,91%)" />
											<XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
											<YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
											<Tooltip formatter={(v) => [`${v} ball`, "Jami ball"]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
											<Bar dataKey="ball" radius={[6, 6, 0, 0]} maxBarSize={60}>
												{overviewData.map((d, i) => <Cell key={i} fill={d.color} />)}
											</Bar>
										</BarChart>
									</ResponsiveContainer>
								</div>

								<div className="bg-card border border-border rounded-xl p-6">
									<SectionTitle>Faoliyat taqsimoti (kategoriya bo'yicha)</SectionTitle>
									<div className="space-y-3 mt-2">
										{[
											{ label: "Malakaviy (Qualification)", count: qualStats.reduce((a,x)=>a+x.count,0), color: "bg-blue-500" },
											{ label: "Ilmiy (Scientific)",         count: sciStats.reduce((a,x)=>a+x.count,0),  color: "bg-emerald-500" },
											{ label: "Akademik (Academic)",        count: acadStats.reduce((a,x)=>a+x.count,0), color: "bg-purple-500" },
										].map((item, i) => {
											const pct = totalApproved ? Math.round((item.count / totalApproved) * 100) : 0;
											return (
												<div key={i}>
													<div className="flex justify-between text-sm mb-1">
														<span className="text-muted-foreground">{item.label}</span>
														<span className="font-medium">{item.count} ta ({pct}%)</span>
													</div>
													<div className="w-full h-2 bg-muted rounded-full overflow-hidden">
														<div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
													</div>
												</div>
											);
										})}
									</div>
									<div className="mt-5 pt-4 border-t border-border">
										<SectionTitle>Yillik o'quv yili</SectionTitle>
										<div className="space-y-1 text-sm">
											{years.map(y => (
												<div key={y.id} className="flex justify-between">
													<span className="text-muted-foreground">{y.name}</span>
													<Badge variant="secondary" className={y.is_active ? "bg-emerald-100 text-emerald-700 border-0 text-xs" : "text-xs"}>
														{y.is_active ? "Faol" : "Arxiv"}
													</Badge>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>

							{/* 2. Kafedralar */}
							<div className="bg-card border border-border rounded-xl p-6">
								<SectionTitle>Kafedralar bo'yicha KPI ballar</SectionTitle>
								{isSummariesLoading ? (
									<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
								) : deptChartData.length === 0 ? (
									<p className="text-center py-12 text-muted-foreground">Ma'lumot topilmadi</p>
								) : (
									<ResponsiveContainer width="100%" height={Math.max(deptChartData.length * 64, 250)}>
										<BarChart data={deptChartData} layout="vertical" margin={{ top: 4, right: 30, bottom: 4, left: 8 }}>
											<CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(210,15%,91%)" />
											<XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
											<YAxis type="category" dataKey="name" tick={<CustomYTick />} width={200} axisLine={false} tickLine={false} />
											<Tooltip
												formatter={(v, n) => {
													const labels = { acad: "Akademik", qual: "Malakaviy", sci: "Ilmiy", total: "Jami" };
													return [`${Math.round(v * 10) / 10} ball`, labels[n] || n];
												}}
												contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
											/>
											<Legend formatter={(v) => ({ acad: "Akademik", qual: "Malakaviy", sci: "Ilmiy", total: "Jami" }[v] || v)} />
											<Bar dataKey="sci"  stackId="a" fill={COLORS.sci}  maxBarSize={36} name="sci" />
											<Bar dataKey="qual" stackId="a" fill={COLORS.qual} maxBarSize={36} name="qual" />
											<Bar dataKey="acad" stackId="a" fill={COLORS.acad} maxBarSize={36} name="acad" radius={[0, 6, 6, 0]} />
										</BarChart>
									</ResponsiveContainer>
								)}
							</div>

							{/* 3. Malakaviy + Ilmiy + Akademik */}
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
								{[
									{ title: "Qualification — Malakaviy faoliyatlar", data: qualStats, color: COLORS.qual },
									{ title: "Science — Ilmiy faoliyatlar",           data: sciStats,  color: COLORS.sci  },
									{ title: "Academic — Akademik faoliyatlar",        data: acadStats, color: COLORS.acad },
								].map(({ title, data, color }, gi) => (
									<div key={gi} className="bg-card border border-border rounded-xl p-6">
										<SectionTitle>{title}</SectionTitle>
										{data.length === 0 ? (
											<p className="text-center py-8 text-muted-foreground text-sm">Ma'lumot yo'q</p>
										) : (
											<>
												<HorizBarChart data={data.map(x => ({ name: x.typeName, count: x.count }))} dataKey="count" color={color} height={Math.max(data.length * 48, 160)} colorful />
												<div className="mt-4 overflow-x-auto">
													<table className="w-full text-sm">
														<thead>
															<tr className="border-b border-border">
																<th className="text-left py-1.5 text-muted-foreground font-medium text-xs">Tur</th>
																<th className="text-center py-1.5 text-muted-foreground font-medium text-xs">Soni</th>
																<th className="text-right py-1.5 text-muted-foreground font-medium text-xs">%</th>
															</tr>
														</thead>
														<tbody>
															{data.map((x, i) => (
																<tr key={i} className="border-b border-border last:border-0">
																	<td className="py-1.5 pr-2 text-xs">{x.typeName}</td>
																	<td className="text-center text-xs font-medium">{x.count}</td>
																	<td className="text-right text-xs text-muted-foreground">
																		{totalApproved ? Math.round((x.count / totalApproved) * 100) : 0}%
																	</td>
																</tr>
															))}
														</tbody>
													</table>
												</div>
											</>
										)}
									</div>
								))}
							</div>

							{/* 4. Top o'qituvchilar */}
							<div className="bg-card border border-border rounded-xl p-6">
								<SectionTitle>Top 10 O'qituvchilar — KPI Ball Reytingi</SectionTitle>
								{isSummariesLoading ? (
									<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
								) : topTeachers.length === 0 ? (
									<p className="text-center py-12 text-muted-foreground">Ma'lumot topilmadi</p>
								) : (
									<>
										<ResponsiveContainer width="100%" height={Math.max(topTeachers.length * 52, 250)}>
											<BarChart data={topTeachers} layout="vertical" margin={{ top: 4, right: 30, bottom: 4, left: 8 }}>
												<CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(210,15%,91%)" />
												<XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
												<YAxis type="category" dataKey="name" tick={<CustomYTick />} width={200} axisLine={false} tickLine={false} />
												<Tooltip formatter={(v, n) => [`${Math.round(v*10)/10} ball`, { sci:"Ilmiy", qual:"Malakaviy", acad:"Akademik" }[n]||n]}
													contentStyle={{ borderRadius:"8px", fontSize:"12px" }} />
												<Legend formatter={(v) => ({ sci:"Ilmiy", qual:"Malakaviy", acad:"Akademik" }[v]||v)} />
												<Bar dataKey="sci"  stackId="a" fill={COLORS.sci}  maxBarSize={40} name="sci" />
												<Bar dataKey="qual" stackId="a" fill={COLORS.qual} maxBarSize={40} name="qual" />
												<Bar dataKey="acad" stackId="a" fill={COLORS.acad} maxBarSize={40} name="acad" radius={[0,6,6,0]} />
											</BarChart>
										</ResponsiveContainer>
										<div className="mt-6 overflow-x-auto">
											<table className="w-full text-sm">
												<thead>
													<tr className="border-b border-border bg-muted/50">
														<th className="text-left py-2 px-3 text-muted-foreground font-medium">#</th>
														<th className="text-left py-2 px-3 text-muted-foreground font-medium">O'qituvchi</th>
														<th className="text-center py-2 px-3 text-muted-foreground font-medium">Ilmiy</th>
														<th className="text-center py-2 px-3 text-muted-foreground font-medium">Malakaviy</th>
														<th className="text-center py-2 px-3 text-muted-foreground font-medium">Akademik</th>
														<th className="text-right py-2 px-3 text-muted-foreground font-medium">Jami ball</th>
													</tr>
												</thead>
												<tbody>
													{topTeachers.map((t, i) => (
														<tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
															<td className="py-2 px-3">{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</td>
															<td className="py-2 px-3 font-medium">{t.name}</td>
															<td className="text-center py-2 px-3 text-emerald-600">{Math.round(t.sci*10)/10}</td>
															<td className="text-center py-2 px-3 text-blue-600">{Math.round(t.qual*10)/10}</td>
															<td className="text-center py-2 px-3 text-purple-600">{Math.round(t.acad*10)/10}</td>
															<td className="text-right py-2 px-3 font-bold text-primary">{Math.round(t.total*10)/10}</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</>
								)}
							</div>

							{/* 5. KPI Jadval */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<div className="bg-card border border-border rounded-xl p-6">
									<SectionTitle>Key Performance Indicators — Ball sxemasi</SectionTitle>
									<p className="text-xs text-muted-foreground mb-4">
										Yil davomida to'plangan ball va mos ravishda beriladigan mukofot ulushi
									</p>
									<div className="overflow-hidden rounded-xl border border-border">
										<table className="w-full text-sm">
											<thead>
												<tr className="bg-primary/10">
													<th className="text-center py-3 px-4 font-semibold text-primary">Ballar diapazoni</th>
													<th className="text-center py-3 px-4 font-semibold text-primary">Mukofot ulushi (%)</th>
												</tr>
											</thead>
											<tbody>
												{KPI_TABLE.map((row, i) => {
													const inRange = (() => {
														const [lo, hi] = row.range.split("–").map(s => parseInt(s.trim()));
														return avgScore >= lo && avgScore <= (hi || lo + 29);
													})();
													return (
														<tr key={i} className={`border-b border-border last:border-0 transition-colors ${inRange ? "bg-emerald-50 dark:bg-emerald-900/20" : i % 2 === 0 ? "bg-muted/20" : ""}`}>
															<td className={`text-center py-2.5 px-4 font-mono ${inRange ? "font-bold text-emerald-700" : ""}`}>{row.range}</td>
															<td className="text-center py-2.5 px-4">
																<span className={`inline-flex items-center justify-center w-12 h-7 rounded-full text-xs font-semibold ${
																	row.allowance >= 80 ? "bg-emerald-100 text-emerald-700" :
																	row.allowance >= 50 ? "bg-blue-100 text-blue-700" :
																	row.allowance >= 25 ? "bg-yellow-100 text-yellow-700" :
																	"bg-gray-100 text-gray-600"
																}`}>{row.allowance}%</span>
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
									{avgScore > 0 && (
										<div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
											<p className="text-sm">
												<span className="font-medium text-primary">O'rtacha ball: {avgScore}</span>{" — "}
												{(() => {
													const match = KPI_TABLE.find(r => {
														const [lo, hi] = r.range.split("–").map(s => parseInt(s.trim()));
														return avgScore >= lo && avgScore <= (hi || lo + 29);
													});
													return match
														? <span className="text-emerald-600 font-semibold">Mukofot: {match.allowance}%</span>
														: <span className="text-muted-foreground">Jadval diapazonidan tashqarida</span>;
												})()}
											</p>
										</div>
									)}
								</div>
								<div className="bg-card border border-border rounded-xl p-6">
									<SectionTitle>KPI — Ball va Mukofot bog'liqligi</SectionTitle>
									<ResponsiveContainer width="100%" height={380}>
										<BarChart data={KPI_TABLE} margin={{ top: 4, right: 16, bottom: 40, left: 4 }}>
											<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(210,15%,91%)" />
											<XAxis dataKey="range" tick={{ fontSize: 9, angle: -45, textAnchor: "end", dy: 8 }} axisLine={false} tickLine={false} />
											<YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
											<Tooltip formatter={(v) => [`${v}%`, "Mukofot"]} />
											<Bar dataKey="allowance" radius={[4, 4, 0, 0]} maxBarSize={28}>
												{KPI_TABLE.map((r, i) => (
													<Cell key={i} fill={r.allowance >= 80 ? "hsl(142,71%,45%)" : r.allowance >= 50 ? "hsl(200,100%,43%)" : r.allowance >= 25 ? "hsl(38,92%,50%)" : "hsl(0,72%,51%)"} />
												))}
											</Bar>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</div>

						</div>
					</TabsContent>

					{/* ─── OVERVIEW ───────────────────────────────────────────────── */}
					<TabsContent value="overview">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

							{/* Domain ballar */}
							<div className="bg-card border border-border rounded-xl p-6">
								<SectionTitle>The Statistics of Scientific Activity</SectionTitle>
								<p className="text-xs text-muted-foreground mb-4">Domain bo'yicha jami ballar (2025-2026)</p>
								<ResponsiveContainer width="100%" height={220}>
									<BarChart data={overviewData} margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
										<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(210,15%,91%)" />
										<XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
										<YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
										<Tooltip formatter={(v) => [`${v} ball`, "Jami ball"]}
											contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
										<Bar dataKey="ball" radius={[6, 6, 0, 0]} maxBarSize={60}>
											{overviewData.map((d, i) => <Cell key={i} fill={d.color} />)}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</div>

							{/* Faoliyat taqsimoti */}
							<div className="bg-card border border-border rounded-xl p-6">
								<SectionTitle>Faoliyat taqsimoti (kategoriya bo'yicha)</SectionTitle>
								<div className="space-y-3 mt-2">
									{[
										{ label: "Malakaviy (Qualification)", count: qualStats.reduce((a,x)=>a+x.count,0), color: "bg-blue-500" },
										{ label: "Ilmiy (Scientific)",         count: sciStats.reduce((a,x)=>a+x.count,0),  color: "bg-emerald-500" },
										{ label: "Akademik (Academic)",        count: acadStats.reduce((a,x)=>a+x.count,0), color: "bg-purple-500" },
									].map((item, i) => {
										const pct = totalApproved ? Math.round((item.count / totalApproved) * 100) : 0;
										return (
											<div key={i}>
												<div className="flex justify-between text-sm mb-1">
													<span className="text-muted-foreground">{item.label}</span>
													<span className="font-medium">{item.count} ta ({pct}%)</span>
												</div>
												<div className="w-full h-2 bg-muted rounded-full overflow-hidden">
													<div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
												</div>
											</div>
										);
									})}
								</div>

								<div className="mt-5 pt-4 border-t border-border">
									<SectionTitle>Yillik o'quv yili</SectionTitle>
									<div className="space-y-1 text-sm">
										{years.map(y => (
											<div key={y.id} className="flex justify-between">
												<span className="text-muted-foreground">{y.name}</span>
												<Badge variant="secondary" className={y.is_active ? "bg-emerald-100 text-emerald-700 border-0 text-xs" : "text-xs"}>
													{y.is_active ? "Faol" : "Arxiv"}
												</Badge>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</TabsContent>

					{/* ─── KAFEDRALAR ──────────────────────────────────────────────── */}
					<TabsContent value="department">
						<div className="bg-card border border-border rounded-xl p-6">
							<SectionTitle>Kafedralar bo'yicha KPI ballar</SectionTitle>
							{isSummariesLoading ? (
								<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
							) : deptChartData.length === 0 ? (
								<p className="text-center py-12 text-muted-foreground">Ma'lumot topilmadi</p>
							) : (
								<>
									<ResponsiveContainer width="100%" height={Math.max(deptChartData.length * 64, 250)}>
										<BarChart data={deptChartData} layout="vertical" margin={{ top: 4, right: 30, bottom: 4, left: 8 }}>
											<CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(210,15%,91%)" />
											<XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
											<YAxis type="category" dataKey="name" tick={<CustomYTick />} width={200} axisLine={false} tickLine={false} />
											<Tooltip
												formatter={(v, n) => {
													const labels = { acad: "Akademik", qual: "Malakaviy", sci: "Ilmiy", total: "Jami" };
													return [`${Math.round(v * 10) / 10} ball`, labels[n] || n];
												}}
												contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
											/>
											<Legend formatter={(v) => ({ acad: "Akademik", qual: "Malakaviy", sci: "Ilmiy", total: "Jami" }[v] || v)} />
											<Bar dataKey="sci"   stackId="a" fill={COLORS.sci}  maxBarSize={36} name="sci" />
											<Bar dataKey="qual"  stackId="a" fill={COLORS.qual} maxBarSize={36} name="qual" />
											<Bar dataKey="acad"  stackId="a" fill={COLORS.acad} maxBarSize={36} name="acad" radius={[0, 6, 6, 0]} />
										</BarChart>
									</ResponsiveContainer>
									<div className="mt-4 flex flex-wrap gap-2">
										{deptChartData.map((d, i) => (
											<span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
												<span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: PALETTE[i % PALETTE.length] }} />
												{d.name}
											</span>
										))}
									</div>
								</>
							)}
						</div>
					</TabsContent>

					{/* ─── MALAKAVIY ───────────────────────────────────────────────── */}
					<TabsContent value="qualification">
						<div className="bg-card border border-border rounded-xl p-6">
							<SectionTitle>Qualification — Malakaviy faoliyatlar (tasdiqlangan)</SectionTitle>
							{qualStats.length === 0 ? (
								<p className="text-center py-12 text-muted-foreground">Malakaviy faoliyatlar mavjud emas</p>
							) : (
								<HorizBarChart
									data={qualStats.map(x => ({ name: x.typeName, count: x.count }))}
									dataKey="count"
									color={COLORS.qual}
									colorful
								/>
							)}

							{/* Type breakdown table */}
							<div className="mt-6 overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-border">
											<th className="text-left py-2 text-muted-foreground font-medium">Faoliyat turi</th>
											<th className="text-center py-2 text-muted-foreground font-medium">Soni</th>
											<th className="text-right py-2 text-muted-foreground font-medium">Ulushi</th>
										</tr>
									</thead>
									<tbody>
										{qualStats.map((x, i) => (
											<tr key={i} className="border-b border-border last:border-0">
												<td className="py-2 pr-4">{x.typeName}</td>
												<td className="text-center font-medium">{x.count}</td>
												<td className="text-right text-muted-foreground">
													{totalApproved ? Math.round((x.count / totalApproved) * 100) : 0}%
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</TabsContent>

					{/* ─── ILMIY ───────────────────────────────────────────────────── */}
					<TabsContent value="scientific">
						<div className="bg-card border border-border rounded-xl p-6">
							<SectionTitle>Science & Project — Ilmiy va loyiha faoliyatlari</SectionTitle>
							{sciStats.length === 0 ? (
								<p className="text-center py-12 text-muted-foreground">Ilmiy faoliyatlar mavjud emas</p>
							) : (
								<HorizBarChart
									data={sciStats.map(x => ({ name: x.typeName, count: x.count }))}
									dataKey="count"
									color={COLORS.sci}
									colorful
								/>
							)}

							<div className="mt-6 overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-border">
											<th className="text-left py-2 text-muted-foreground font-medium">Faoliyat turi</th>
											<th className="text-center py-2 text-muted-foreground font-medium">Soni</th>
											<th className="text-right py-2 text-muted-foreground font-medium">Ulushi</th>
										</tr>
									</thead>
									<tbody>
										{sciStats.map((x, i) => (
											<tr key={i} className="border-b border-border last:border-0">
												<td className="py-2 pr-4">{x.typeName}</td>
												<td className="text-center font-medium">{x.count}</td>
												<td className="text-right text-muted-foreground">
													{totalApproved ? Math.round((x.count / totalApproved) * 100) : 0}%
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</TabsContent>

					{/* ─── AKADEMIK ─────────────────────────────────────────────────── */}
					<TabsContent value="academic">
						<div className="bg-card border border-border rounded-xl p-6">
							<SectionTitle>Academic — Akademik faoliyatlar (tasdiqlangan)</SectionTitle>
							{acadStats.length === 0 ? (
								<p className="text-center py-12 text-muted-foreground">Akademik faoliyatlar mavjud emas</p>
							) : (
								<HorizBarChart
									data={acadStats.map(x => ({ name: x.typeName, count: x.count }))}
									dataKey="count"
									color={COLORS.acad}
									colorful
								/>
							)}

							<div className="mt-6 overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-border">
											<th className="text-left py-2 text-muted-foreground font-medium">Faoliyat turi</th>
											<th className="text-center py-2 text-muted-foreground font-medium">Soni</th>
											<th className="text-right py-2 text-muted-foreground font-medium w-20">Ulushi</th>
										</tr>
									</thead>
									<tbody>
										{acadStats.map((x, i) => (
											<tr key={i} className="border-b border-border last:border-0">
												<td className="py-2 pr-4">{x.typeName}</td>
												<td className="text-center font-medium">{x.count}</td>
												<td className="text-right text-muted-foreground">
													{totalApproved ? Math.round((x.count / totalApproved) * 100) : 0}%
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</TabsContent>

					{/* ─── TOP O'QITUVCHILAR ───────────────────────────────────────── */}
					<TabsContent value="top">
						<div className="bg-card border border-border rounded-xl p-6">
							<SectionTitle>Top 10 O'qituvchilar — KPI Ball Reytingi (2025-2026)</SectionTitle>
							{isSummariesLoading ? (
								<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
							) : topTeachers.length === 0 ? (
								<p className="text-center py-12 text-muted-foreground">Ma'lumot topilmadi</p>
							) : (
								<>
									<ResponsiveContainer width="100%" height={Math.max(topTeachers.length * 56, 250)}>
										<BarChart data={topTeachers} layout="vertical" margin={{ top: 4, right: 30, bottom: 4, left: 8 }}>
											<CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(210,15%,91%)" />
											<XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
											<YAxis type="category" dataKey="name" tick={<CustomYTick />} width={200} axisLine={false} tickLine={false} />
											<Tooltip formatter={(v, n) => [`${Math.round(v*10)/10} ball`, { sci:"Ilmiy", qual:"Malakaviy", acad:"Akademik", total:"Jami" }[n]||n]}
												contentStyle={{ borderRadius:"8px", fontSize:"12px" }} />
											<Legend formatter={(v) => ({ sci:"Ilmiy", qual:"Malakaviy", acad:"Akademik" }[v]||v)} />
											<Bar dataKey="sci"  stackId="a" fill={COLORS.sci}  maxBarSize={40} name="sci" />
											<Bar dataKey="qual" stackId="a" fill={COLORS.qual} maxBarSize={40} name="qual" />
											<Bar dataKey="acad" stackId="a" fill={COLORS.acad} maxBarSize={40} name="acad" radius={[0,6,6,0]} />
										</BarChart>
									</ResponsiveContainer>

									{/* Ranking table */}
									<div className="mt-6 overflow-x-auto">
										<table className="w-full text-sm">
											<thead>
												<tr className="border-b border-border bg-muted/50">
													<th className="text-left py-2 px-3 text-muted-foreground font-medium">#</th>
													<th className="text-left py-2 px-3 text-muted-foreground font-medium">O'qituvchi</th>
													<th className="text-center py-2 px-3 text-muted-foreground font-medium">Ilmiy</th>
													<th className="text-center py-2 px-3 text-muted-foreground font-medium">Malakaviy</th>
													<th className="text-center py-2 px-3 text-muted-foreground font-medium">Akademik</th>
													<th className="text-right py-2 px-3 text-muted-foreground font-medium">Jami ball</th>
												</tr>
											</thead>
											<tbody>
												{topTeachers.map((t, i) => (
													<tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
														<td className="py-2 px-3">
															{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
														</td>
														<td className="py-2 px-3 font-medium">{t.name}</td>
														<td className="text-center py-2 px-3 text-emerald-600">{Math.round(t.sci*10)/10}</td>
														<td className="text-center py-2 px-3 text-blue-600">{Math.round(t.qual*10)/10}</td>
														<td className="text-center py-2 px-3 text-purple-600">{Math.round(t.acad*10)/10}</td>
														<td className="text-right py-2 px-3 font-bold text-primary">{Math.round(t.total*10)/10}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</>
							)}
						</div>
					</TabsContent>

					{/* ─── KPI JADVAL ──────────────────────────────────────────────── */}
					<TabsContent value="kpi">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

							{/* KPI Table */}
							<div className="bg-card border border-border rounded-xl p-6">
								<SectionTitle>Key Performance Indicators — Ball sxemasi</SectionTitle>
								<p className="text-xs text-muted-foreground mb-4">
									Yil davomida to'plangan ball va mos ravishda beriladigan mukofot ulushi
								</p>
								<div className="overflow-hidden rounded-xl border border-border">
									<table className="w-full text-sm">
										<thead>
											<tr className="bg-primary/10">
												<th className="text-center py-3 px-4 font-semibold text-primary">Ballar diapazoni</th>
												<th className="text-center py-3 px-4 font-semibold text-primary">Mukofot ulushi (%)</th>
											</tr>
										</thead>
										<tbody>
											{KPI_TABLE.map((row, i) => {
												// Highlight rows where current avg score falls
												const inRange = (() => {
													const [lo, hi] = row.range.split("–").map(s => parseInt(s.trim()));
													return avgScore >= lo && avgScore <= (hi || lo + 29);
												})();
												return (
													<tr
														key={i}
														className={`border-b border-border last:border-0 transition-colors ${
															inRange ? "bg-emerald-50 dark:bg-emerald-900/20" : i % 2 === 0 ? "bg-muted/20" : ""
														}`}
													>
														<td className={`text-center py-2.5 px-4 font-mono ${inRange ? "font-bold text-emerald-700" : ""}`}>
															{row.range}
														</td>
														<td className="text-center py-2.5 px-4">
															<span className={`inline-flex items-center justify-center w-12 h-7 rounded-full text-xs font-semibold ${
																row.allowance >= 80 ? "bg-emerald-100 text-emerald-700" :
																row.allowance >= 50 ? "bg-blue-100 text-blue-700" :
																row.allowance >= 25 ? "bg-yellow-100 text-yellow-700" :
																"bg-gray-100 text-gray-600"
															}`}>
																{row.allowance}%
															</span>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
								{avgScore > 0 && (
									<div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
										<p className="text-sm">
											<span className="font-medium text-primary">O'rtacha ball: {avgScore}</span>
											{" — "}
											{(() => {
												const match = KPI_TABLE.find(r => {
													const [lo, hi] = r.range.split("–").map(s => parseInt(s.trim()));
													return avgScore >= lo && avgScore <= (hi || lo + 29);
												});
												return match
													? <span className="text-emerald-600 font-semibold">Mukofot: {match.allowance}%</span>
													: <span className="text-muted-foreground">Jadval diapazonidan tashqarida</span>;
											})()}
										</p>
									</div>
								)}
							</div>

							{/* KPI Chart */}
							<div className="bg-card border border-border rounded-xl p-6">
								<SectionTitle>KPI — Ball va Mukofot bog'liqligi</SectionTitle>
								<ResponsiveContainer width="100%" height={380}>
									<BarChart
										data={KPI_TABLE}
										margin={{ top: 4, right: 16, bottom: 40, left: 4 }}
									>
										<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(210,15%,91%)" />
										<XAxis
											dataKey="range"
											tick={{ fontSize: 9, angle: -45, textAnchor: "end", dy: 8 }}
											axisLine={false}
											tickLine={false}
										/>
										<YAxis
											tick={{ fontSize: 11 }}
											axisLine={false}
											tickLine={false}
											tickFormatter={(v) => `${v}%`}
										/>
										<Tooltip formatter={(v) => [`${v}%`, "Mukofot"]} />
										<Bar dataKey="allowance" radius={[4, 4, 0, 0]} maxBarSize={28}>
											{KPI_TABLE.map((r, i) => (
												<Cell
													key={i}
													fill={
														r.allowance >= 80 ? "hsl(142,71%,45%)" :
														r.allowance >= 50 ? "hsl(200,100%,43%)" :
														r.allowance >= 25 ? "hsl(38,92%,50%)"  :
														"hsl(0,72%,51%)"
													}
												/>
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
