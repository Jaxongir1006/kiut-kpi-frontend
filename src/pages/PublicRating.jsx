import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  LogIn, Search, Loader2,
  Users, Building2, TrendingUp, Star, Trophy, Medal, Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchSummaries } from "@/features/scoring/scoringSlice";
import { fetchDepartments } from "@/features/departments/departmentsSlice";
import { fetchYears } from "@/features/academicYears/academicYearsSlice";

// A guest receives the redacted summary (flat `full_name` / `department`);
// a signed-in visitor receives the full one (nested `teacher_details`). The
// page is reachable both ways, so every read goes through these two.
const nameOf = (s) => s.full_name || s.teacher_details?.full_name || "";
const deptOf = (s) => s.department || s.teacher_details?.department_details?.name || "";

// ── Palitlari ────────────────────────────────────────────────────────────────
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
];

const RANK_ICONS  = [Trophy, Medal, Award];
const RANK_COLORS = ["text-amber-500", "text-slate-400", "text-amber-700"];

function seedColor(str) {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return `hsl(${h},65%,48%)`;
}
function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ── Gauge ────────────────────────────────────────────────────────────────────
function GaugeCard({ label, value, max = 100, color = "hsl(200,100%,43%)", displayValue }) {
  const pct = max > 0 ? Math.min(parseFloat(value) / max, 1) : 0;
  const r = 38, sw = 9;
  const circ = 2 * Math.PI * r;
  const arc  = circ * 0.75;
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

// ── Stat hero card ───────────────────────────────────────────────────────────
function HeroStat({ icon: Icon, label, value, bg }) {
  return (
    <div className={`${bg} rounded-2xl p-4 flex items-center gap-3 border border-white/20`}>
      <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xl font-bold text-white leading-tight">{value}</p>
        <p className="text-xs text-white/70">{label}</p>
      </div>
    </div>
  );
}

export default function PublicRating() {
  const dispatch = useDispatch();
  const { summaries, isLoading } = useSelector((s) => s.scoring);
  const { list: departments }    = useSelector((s) => s.departments);
  const { list: years }          = useSelector((s) => s.academicYears);
  const activeYearId = years.find((y) => y.is_active)?.id || years[0]?.id || null;

  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch]         = useState("");
  const [deptMetric, setDeptMetric] = useState("total");

  useEffect(() => {
    dispatch(fetchYears());
    dispatch(fetchDepartments());
  }, [dispatch]);

  // Without a year the API returns every year a signed-in visitor may see, so
  // one person appears once per year at two different ranks.
  useEffect(() => {
    if (activeYearId) dispatch(fetchSummaries(activeYearId));
  }, [dispatch, activeYearId]);

  // ── Global stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const count = summaries.length;
    const pts   = summaries.map((s) => parseFloat(s.final_kpi_score || 0));
    const total = pts.reduce((a, v) => a + v, 0);
    const avg   = count ? Math.round(total / count) : 0;
    const max   = count ? Math.round(Math.max(...pts)) : 0;
    const deptSet = new Set(
      summaries.map((s) => deptOf(s)).filter(Boolean)
    );
    return { count, avg, max, depts: deptSet.size || departments.length };
  }, [summaries, departments]);

  // ── Department chart data ─────────────────────────────────────────────────
  const deptChartData = useMemo(() => {
    const map = {};
    summaries.forEach((s) => {
      const name = deptOf(s) || "Noma'lum";
      if (!map[name]) map[name] = { name, total: 0, academic: 0, scientific: 0, qualification: 0, count: 0 };
      map[name].total         += parseFloat(s.final_kpi_score         || 0);
      map[name].academic      += parseFloat(s.academic_points      || 0);
      map[name].scientific    += parseFloat(s.scientific_points    || 0);
      map[name].qualification += parseFloat(s.qualification_points || 0);
      map[name].count         += 1;
    });
    return Object.values(map)
      .map((d) => ({
        ...d,
        total:         Math.round(d.total         * 10) / 10,
        academic:      Math.round(d.academic      * 10) / 10,
        scientific:    Math.round(d.scientific    * 10) / 10,
        qualification: Math.round(d.qualification * 10) / 10,
      }))
      .sort((a, b) => b[deptMetric] - a[deptMetric]);
  }, [summaries, deptMetric]);

  // ── Score breakdown pie ───────────────────────────────────────────────────
  const pieData = useMemo(() => {
    const acad  = summaries.reduce((a, s) => a + parseFloat(s.academic_points      || 0), 0);
    const sci   = summaries.reduce((a, s) => a + parseFloat(s.scientific_points    || 0), 0);
    const qual  = summaries.reduce((a, s) => a + parseFloat(s.qualification_points || 0), 0);
    return [
      { name: "Akademik",  value: Math.round(acad)  },
      { name: "Ilmiy",     value: Math.round(sci)   },
      { name: "Tashkiliy", value: Math.round(qual)  },
    ].filter((d) => d.value > 0);
  }, [summaries]);

  // ── Department stats table ────────────────────────────────────────────────
  const deptTableData = useMemo(() => {
    const map = {};
    summaries.forEach((s) => {
      const name = deptOf(s) || "Noma'lum";
      if (!map[name]) map[name] = { name, total: 0, count: 0 };
      map[name].total += parseFloat(s.final_kpi_score || 0);
      map[name].count += 1;
    });
    return Object.values(map)
      .map((d) => ({ ...d, avg: d.count ? Math.round(d.total / d.count) : 0, total: Math.round(d.total) }))
      .sort((a, b) => b.avg - a.avg);
  }, [summaries]);

  // ── Top performers ────────────────────────────────────────────────────────
  const topPerformers = useMemo(() =>
    [...summaries]
      .sort((a, b) => parseFloat(b.final_kpi_score || 0) - parseFloat(a.final_kpi_score || 0))
      .slice(0, 15),
    [summaries]
  );

  // ── Filtered full table ───────────────────────────────────────────────────
  const filtered = useMemo(() =>
    [...summaries]
      .filter((s) =>
        deptFilter === "all" || deptOf(s) === deptFilter
      )
      .filter((s) =>
        !search.trim() ||
        nameOf(s).toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => parseFloat(b.final_kpi_score || 0) - parseFloat(a.final_kpi_score || 0)),
    [summaries, deptFilter, search]
  );

  const top3 = filtered.slice(0, 3);

  const deptMetricLabels = {
    total: "Jami ball", academic: "Akademik", scientific: "Ilmiy", qualification: "Tashkiliy",
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <div className="bg-primary text-primary-foreground sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <img
                src="/favicon.svg"
                alt="KIUT"
                className="w-8 h-8 object-contain"
              />
              <div className="leading-tight hidden sm:block">
                <p className="font-bold text-sm leading-none">KIUT KPI Tizimi</p>
                <p className="text-white/60 text-[11px]">Ochiq reyting portali</p>
              </div>
            </div>
            <Link to="/login">
              <Button variant="secondary" size="sm" className="gap-1.5 font-semibold h-8 text-xs px-3">
                <LogIn className="w-3.5 h-3.5" /> Tizimga kirish
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              O'qituvchilar KPI Reytingi
            </h1>
            <p className="text-white/70 text-base max-w-xl mx-auto">
              KIUT professor-o'qituvchilarining KPI ko'rsatkichlari va faoliyat natijalari
            </p>
          </div>

          {/* Hero stats */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-7 h-7 animate-spin text-white/50" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <HeroStat icon={Users}      label="Jami o'qituvchilar" value={stats.count} bg="bg-white/10 backdrop-blur-sm" />
              <HeroStat icon={Building2}  label="Kafedralar soni"    value={stats.depts} bg="bg-white/10 backdrop-blur-sm" />
              <HeroStat icon={TrendingUp} label="O'rtacha ball"      value={stats.avg}   bg="bg-white/10 backdrop-blur-sm" />
              <HeroStat icon={Star}       label="Eng yuqori ball"    value={stats.max}   bg="bg-white/10 backdrop-blur-sm" />
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* ── Row 1: Top Performance + Department chart ─────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

              {/* Top Performance */}
              <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold">Top Performance</h3>
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                    {topPerformers.length} ta o'qituvchi
                  </Badge>
                </div>

                {topPerformers.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Ma'lumot yo'q</p>
                ) : (
                  <div className="space-y-0.5 overflow-y-auto flex-1 max-h-[420px] pr-1">
                    {topPerformers.map((item, i) => {
                      const name  = nameOf(item) || "—";
                      const dept  = deptOf(item) || "";
                      const color = seedColor(name);
                      const rankBg =
                        i === 0 ? "bg-yellow-400 text-white" :
                        i === 1 ? "bg-gray-400 text-white"   :
                        i === 2 ? "bg-amber-600 text-white"  :
                        "bg-muted text-muted-foreground";
                      return (
                        <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                          <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${rankBg}`}>
                            {i + 1}
                          </span>
                          <Avatar className="w-9 h-9 shrink-0 ring-2 ring-offset-1" style={{ "--tw-ring-color": color }}>
                            <AvatarFallback style={{ background: color }} className="text-white text-xs font-semibold">
                              {initials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate leading-tight">{name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{dept}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold" style={{ color }}>
                              {parseFloat(item.final_kpi_score || 0).toFixed(1)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">ball</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Department chart + Pie */}
              <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <h3 className="font-semibold">Kafedra natijalari</h3>
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
                </div>

                {deptChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={deptChartData} layout="vertical" margin={{ left: 8, right: 20, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(210,15%,91%)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(v) => [`${Number(v).toFixed(1)} ball`, deptMetricLabels[deptMetric]]}
                        contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                      />
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

                {/* Score breakdown pie */}
                {pieData.length > 0 && (
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    <PieChart width={110} height={90}>
                      <Pie data={pieData} cx={52} cy={44} innerRadius={26} outerRadius={42} dataKey="value" stroke="none">
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                    </PieChart>
                    <div className="flex flex-col gap-1.5">
                      {pieData.map((item, i) => (
                        <div key={item.name} className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-muted-foreground">
                            {item.name} <span className="font-medium text-foreground">({item.value} ball)</span>
                          </span>
                        </div>
                      ))}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Jami: <span className="font-semibold text-foreground">
                          {pieData.reduce((a, d) => a + d.value, 0)} ball
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Row 2: Dept table + KPI gauges ───────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Department table */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold mb-4">Kafedralar reytingi</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left pb-2 text-xs text-muted-foreground font-medium w-7">#</th>
                        <th className="text-left pb-2 text-xs text-muted-foreground font-medium">Kafedra</th>
                        <th className="text-center pb-2 text-xs text-muted-foreground font-medium">O'qituvchi</th>
                        <th className="text-center pb-2 text-xs text-muted-foreground font-medium">O'rtacha</th>
                        <th className="text-center pb-2 text-xs text-muted-foreground font-medium">Jami</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptTableData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                            Ma'lumot topilmadi
                          </td>
                        </tr>
                      ) : deptTableData.map((d, i) => (
                        <tr key={d.name} className="border-b border-border last:border-0">
                          <td className="py-2.5 text-muted-foreground text-xs">{i + 1}</td>
                          <td className="py-2.5 pr-2">
                            <p className="font-medium leading-snug line-clamp-1">{d.name}</p>
                          </td>
                          <td className="py-2.5 text-center text-sm text-muted-foreground">{d.count}</td>
                          <td className="py-2.5 text-center font-semibold text-primary">{d.avg}</td>
                          <td className="py-2.5 text-center text-sm font-medium">{d.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* KPI Gauges */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold mb-2">KPI ko'rsatkichlari</h3>
                <div className="grid grid-cols-2 gap-2">
                  <GaugeCard
                    label={`Jami o'qituvchilar (${stats.count})`}
                    value={stats.count}
                    max={Math.max(stats.count * 1.2, 10)}
                    color="hsl(200,100%,43%)"
                    displayValue={stats.count}
                  />
                  <GaugeCard
                    label="O'rtacha ball (300 dan)"
                    value={stats.avg}
                    max={300}
                    color="hsl(142,71%,45%)"
                    displayValue={stats.avg}
                  />
                  <GaugeCard
                    label="Eng yuqori ball (300 dan)"
                    value={stats.max}
                    max={300}
                    color="hsl(38,92%,50%)"
                    displayValue={stats.max}
                  />
                  <GaugeCard
                    label={`Kafedralar (${stats.depts})`}
                    value={stats.depts}
                    max={Math.max(stats.depts * 1.2, 5)}
                    color="hsl(271,76%,53%)"
                    displayValue={stats.depts}
                  />
                </div>
              </div>
            </div>

            {/* ── To'liq reyting ────────────────────────────────────────── */}
            <div>
              <h2 className="text-xl font-bold mb-4">To'liq reyting</h2>

              {/* Search + filter */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="O'qituvchi ismi bilan qidiring..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="w-full sm:w-60">
                    <SelectValue placeholder="Kafedra bo'yicha filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha kafedralar</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Podium top 3 */}
              {top3.length >= 3 && (
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[1, 0, 2].map((pos) => {
                    const item  = top3[pos];
                    if (!item) return null;
                    const Icon  = RANK_ICONS[pos];
                    const name  = nameOf(item) || "—";
                    const dept  = deptOf(item) || "—";
                    const color = seedColor(name);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "bg-card border rounded-xl p-4 sm:p-5 text-center shadow-sm hover:shadow-md transition-shadow",
                          pos === 0 && "border-amber-200 sm:-mt-4",
                          pos === 1 && "border-slate-200",
                          pos === 2 && "border-amber-100",
                          pos === 0 ? "sm:order-2" : pos === 1 ? "sm:order-1" : "sm:order-3"
                        )}
                      >
                        <Icon className={cn("w-7 h-7 mx-auto mb-2", RANK_COLORS[pos])} />
                        <Avatar className={cn("mx-auto mb-2 ring-2 ring-offset-1", pos === 0 ? "w-14 h-14" : "w-11 h-11")}
                          style={{ "--tw-ring-color": color }}>
                          <AvatarFallback style={{ background: color }} className="text-white font-semibold">
                            {initials(name)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className={cn("font-semibold leading-snug", pos === 0 ? "text-base" : "text-sm")}>{name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{dept}</p>
                        <p className={cn("font-bold text-primary mt-2", pos === 0 ? "text-3xl" : "text-2xl")}>
                          {parseFloat(item.final_kpi_score || 0).toFixed(1)}
                        </p>
                        <p className="text-xs text-muted-foreground">ball</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Full table */}
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
                  Ma'lumot topilmadi
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm mb-10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground w-14">#</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">O'qituvchi</th>
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Kafedra</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground">Jami</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Akademik</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Ilmiy</th>
                          <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Tashkiliy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((item, i) => {
                          const name  = nameOf(item) || "—";
                          const dept  = deptOf(item) || "—";
                          const color = seedColor(name);
                          return (
                            <tr key={item.id}
                              className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3 text-center">
                                {i < 3 ? (
                                  <span className={cn("font-bold text-base",
                                    i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : "text-amber-700"
                                  )}>{i + 1}</span>
                                ) : (
                                  <span className="text-muted-foreground text-sm">{i + 1}</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8 shrink-0">
                                    <AvatarFallback style={{ background: color }} className="text-white text-xs font-semibold">
                                      {initials(name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium leading-tight">{name}</p>
                                    <p className="text-xs text-muted-foreground md:hidden">{dept}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-sm">{dept}</td>
                              <td className="px-4 py-3 text-center font-bold text-primary">
                                {parseFloat(item.final_kpi_score || 0).toFixed(1)}
                              </td>
                              <td className="px-4 py-3 text-center text-muted-foreground hidden lg:table-cell">
                                {parseFloat(item.academic_points || 0).toFixed(1)}
                              </td>
                              <td className="px-4 py-3 text-center text-muted-foreground hidden lg:table-cell">
                                {parseFloat(item.scientific_points || 0).toFixed(1)}
                              </td>
                              <td className="px-4 py-3 text-center text-muted-foreground hidden lg:table-cell">
                                {parseFloat(item.qualification_points || 0).toFixed(1)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
