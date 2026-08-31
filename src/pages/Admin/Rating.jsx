import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Trophy, Medal, Award, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { fetchSummaries } from "@/features/scoring/scoringSlice";
import { fetchYears } from "@/features/academicYears/academicYearsSlice";
import { fetchDepartments } from "@/features/departments/departmentsSlice";

const rankIcons = [Trophy, Medal, Award];
const rankColors = ["text-amber-500", "text-gray-400", "text-amber-700"];
const rankBg = [
	"bg-amber-50 border-amber-200",
	"bg-gray-50 border-gray-200",
	"bg-amber-50/50 border-amber-100",
];

function initials(name) {
	return name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?";
}

export default function Rating() {
	const { t } = useLanguage();
	const dispatch = useDispatch();

	const { summaries, isLoading } = useSelector((s) => s.scoring);
	const { list: years } = useSelector((s) => s.academicYears);
	const { list: departments } = useSelector((s) => s.departments);

	// null = not picked yet -> fall back to the active year.
	// "" is a real user choice here ("Barcha yillar"), so it must not be
	// confused with "unset"; hence the null sentinel and ??.
	const [yearChoice, setYearChoice] = useState(null);
	const [deptFilter, setDeptFilter] = useState("all");
	const [search, setSearch] = useState("");

	const defaultYearId = years.find((y) => y.is_active)?.id || years[0]?.id || "";
	const selectedYear = yearChoice ?? defaultYearId;

	useEffect(() => {
		dispatch(fetchYears());
		dispatch(fetchDepartments());
	}, [dispatch]);

	useEffect(() => {
		dispatch(fetchSummaries(selectedYear || undefined));
	}, [dispatch, selectedYear]);

	const filtered = summaries
		.filter((s) =>
			deptFilter === "all" || s.teacher_details?.department_details?.name === deptFilter
		)
		.filter((s) =>
			!search || s.teacher_details?.full_name?.toLowerCase().includes(search.toLowerCase())
		)
		.sort((a, b) => parseFloat(b.total_points || 0) - parseFloat(a.total_points || 0));

	const handleYearChange = (val) => {
		setYearChoice(val === "all" ? "" : val);
	};

	return (
		<div>
			<PageHeader title={t("rating_title")} description={t("rating_desc")}>
				<Select value={selectedYear || "all"} onValueChange={handleYearChange}>
					<SelectTrigger className="w-44">
						<SelectValue placeholder="O'quv yili" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Barcha yillar</SelectItem>
						{years.map((y) => (
							<SelectItem key={y.id} value={y.id}>
								{y.name}{y.is_active ? " (faol)" : ""}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</PageHeader>

			<div className="flex flex-col sm:flex-row gap-3 mb-8">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder={t("search")}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Select value={deptFilter} onValueChange={setDeptFilter}>
					<SelectTrigger className="w-56">
						<SelectValue placeholder={t("department")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("all_departments")}</SelectItem>
						{departments.map((d) => (
							<SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<Loader2 className="w-8 h-8 animate-spin text-primary" />
				</div>
			) : filtered.length === 0 ? (
				<EmptyState title="Ma'lumot topilmadi" />
			) : (
				<>
					{filtered.length >= 3 && (
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
							{filtered.slice(0, 3).map((item, i) => {
								const Icon = rankIcons[i];
								const name = item.teacher_details?.full_name || "—";
								const dept = item.teacher_details?.department_details?.name || "—";
								return (
									<div
										key={item.id}
										className={cn("border rounded-xl p-6 text-center hover:shadow-md transition-shadow", rankBg[i])}
									>
										<Icon className={cn("w-8 h-8 mx-auto mb-3", rankColors[i])} />
										<Avatar className="w-14 h-14 mx-auto mb-3">
											<AvatarFallback className="bg-primary/10 text-primary font-semibold">
												{initials(name)}
											</AvatarFallback>
										</Avatar>
										<h3 className="font-semibold">{name}</h3>
										<p className="text-sm text-muted-foreground">{dept}</p>
										<p className="text-2xl font-bold text-primary mt-2">
											{parseFloat(item.total_points || 0).toFixed(1)}
										</p>
										<p className="text-xs text-muted-foreground">{t("points")}</p>
									</div>
								);
							})}
						</div>
					)}

					<div className="bg-card border border-border rounded-xl overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border bg-muted/50">
										<th className="text-center px-4 py-3 font-medium text-muted-foreground w-14">#</th>
										<th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("teacher")}</th>
										<th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t("department")}</th>
										<th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Akademik</th>
										<th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Ilmiy</th>
										<th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Tashkiliy</th>
										<th className="text-center px-4 py-3 font-medium text-muted-foreground">{t("score")}</th>
									</tr>
								</thead>
								<tbody>
									{filtered.map((item, i) => {
										const name = item.teacher_details?.full_name || "—";
										const dept = item.teacher_details?.department_details?.name || "—";
										return (
											<tr
												key={item.id}
												className={cn(
													"border-b border-border last:border-0 hover:bg-muted/30 transition-colors",
													i < 3 && "bg-primary/[0.02]"
												)}
											>
												<td className="px-4 py-3 text-center">
													<span className={cn("font-bold", i < 3 ? "text-primary" : "text-muted-foreground")}>
														{i + 1}
													</span>
												</td>
												<td className="px-4 py-3">
													<div className="flex items-center gap-3">
														<Avatar className="w-8 h-8">
															<AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
																{initials(name)}
															</AvatarFallback>
														</Avatar>
														<div>
															<p className="font-medium">{name}</p>
															<p className="text-xs text-muted-foreground">
																{item.teacher_details?.employee_id}
															</p>
														</div>
													</div>
												</td>
												<td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{dept}</td>
												<td className="px-4 py-3 hidden lg:table-cell text-center text-muted-foreground">
													{parseFloat(item.academic_points || 0).toFixed(1)}
												</td>
												<td className="px-4 py-3 hidden lg:table-cell text-center text-muted-foreground">
													{parseFloat(item.scientific_points || 0).toFixed(1)}
												</td>
												<td className="px-4 py-3 hidden lg:table-cell text-center text-muted-foreground">
													{parseFloat(item.qualification_points || 0).toFixed(1)}
												</td>
												<td className="px-4 py-3 text-center">
													<span className="font-bold text-primary">
														{parseFloat(item.total_points || 0).toFixed(1)}
													</span>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
