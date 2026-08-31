import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Search, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ProofLink from "@/components/shared/ProofLink";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { format } from "date-fns";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { fetchSubmissions, createSubmission, updateSubmission, deleteSubmission } from "@/features/submissions/submissionsSlice";
import { fetchTeachers } from "@/features/teachers/teachersSlice";
import { fetchTypes } from "@/features/types/typesSlice";
import { fetchYears } from "@/features/academicYears/academicYearsSlice";
import { fetchDepartments } from "@/features/departments/departmentsSlice";
import { useUserRole } from "@/hooks/useUserRole";

const STATUS_COLORS = {
	pending: "bg-yellow-100 text-yellow-700",
	approved: "bg-emerald-100 text-emerald-700",
	rejected: "bg-red-100 text-red-700",
	overridden: "bg-purple-100 text-purple-700",
};

const STATUS_LABELS = {
	pending: "Kutilmoqda",
	approved: "Tasdiqlangan",
	rejected: "Rad etilgan",
	overridden: "Qaytarilgan",
};

function StatusBadge({ status }) {
	return (
		<Badge variant="secondary" className={STATUS_COLORS[status] || "bg-gray-100 text-gray-600"}>
			{STATUS_LABELS[status] || status}
		</Badge>
	);
}

export default function Activities() {
	const { t } = useLanguage();
	const dispatch = useDispatch();

	const { isTeacher, teacherProfile, user } = useUserRole();
	const { list: submissions, isLoading, isSaving, isDeleting } = useSelector((s) => s.submissions);
	const { list: teachers } = useSelector((s) => s.teachers);
	const { list: types } = useSelector((s) => s.types);
	const { list: years } = useSelector((s) => s.academicYears);
	const { list: departments } = useSelector((s) => s.departments);

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [showForm, setShowForm] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [isCoauthor, setIsCoauthor] = useState(false);
	const [selectedDept, setSelectedDept] = useState("");
	const [selectedTeacher, setSelectedTeacher] = useState("");
	const [selectedType, setSelectedType] = useState("");
	const [selectedYear, setSelectedYear] = useState("");
	const [showDetail, setShowDetail] = useState(null);
	const [deleteId, setDeleteId] = useState(null);

	// Teacher's own department and profile ids
	const myDeptId = teacherProfile?.department || teacherProfile?.department_id || "";
	const myTeacherId = teacherProfile?.id || "";

	useEffect(() => {
		dispatch(fetchSubmissions());
		dispatch(fetchTeachers());
		dispatch(fetchTypes());
		dispatch(fetchYears());
		dispatch(fetchDepartments());
	}, [dispatch]);

	const filtered = submissions.filter((s) => {
		const matchSearch =
			(s.title || "").toLowerCase().includes(search.toLowerCase()) ||
			(s.teacher_details?.full_name || "").toLowerCase().includes(search.toLowerCase());
		const matchStatus = statusFilter === "all" || s.status === statusFilter;
		return matchSearch && matchStatus;
	});

	// Teachers filtered by selected department
	const filteredTeachers = selectedDept
		? teachers.filter((t) => t.department === selectedDept || t.department_details?.id === selectedDept)
		: teachers;

	const openCreate = () => {
		setEditItem(null); setIsCoauthor(false);
		// Auto-fill for teacher role
		setSelectedDept(isTeacher ? myDeptId : "");
		setSelectedTeacher(isTeacher ? myTeacherId : "");
		setSelectedType(""); setSelectedYear("");
		setShowForm(true);
	};
	const openEdit = (item) => {
		setEditItem(item); setIsCoauthor((item.co_authors_count ?? 1) > 1);
		const deptId = item.teacher_details?.department || item.teacher_details?.department_details?.id || (isTeacher ? myDeptId : "");
		setSelectedDept(deptId);
		setSelectedTeacher(item.teacher || "");
		setSelectedType(item.activity_type || "");
		setSelectedYear(item.academic_year || "");
		setShowForm(true);
	};
	const closeForm = () => {
		setShowForm(false); setEditItem(null); setIsCoauthor(false);
		setSelectedDept(""); setSelectedTeacher(""); setSelectedType(""); setSelectedYear("");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const formValues = new FormData(e.target);

		const data = new FormData();
		data.append("teacher", selectedTeacher);
		data.append("activity_type", selectedType);
		data.append("academic_year", selectedYear);
		data.append("title", formValues.get("title"));
		data.append("submission_date", formValues.get("submission_date"));

		const description = formValues.get("description");
		if (description) data.append("description", description);

		data.append("co_authors_count", isCoauthor ? (formValues.get("co_authors_count") || "2") : "1");

		const proofFile = formValues.get("proof_file");
		const proofUrl = formValues.get("proof_url");
		if (proofFile && proofFile.size > 0) {
			data.append("proof_file", proofFile);
		} else if (proofUrl) {
			data.append("proof_file", proofUrl);
		}

		try {
			if (editItem) {
				await dispatch(updateSubmission({ id: editItem.id, data })).unwrap();
				toast.success(t("activity_updated") || "Yangilandi");
			} else {
				await dispatch(createSubmission(data)).unwrap();
				toast.success(t("activity_added") || "Topshirildi");
			}
			closeForm();
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const handleDelete = async () => {
		try {
			await dispatch(deleteSubmission(deleteId)).unwrap();
			toast.success(t("activity_deleted") || "O'chirildi");
			setDeleteId(null);
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	return (
		<div>
			<PageHeader title={t("activities_title")} description={t("activities_desc")}>
				<Button onClick={openCreate} className="gap-2">
					<Plus className="w-4 h-4" /> {t("new_activity")}
				</Button>
			</PageHeader>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-3 mb-6">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input placeholder={t("search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
				</div>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-48">
						<SelectValue placeholder={t("status")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("all_statuses")}</SelectItem>
						{Object.entries(STATUS_LABELS).map(([k, v]) => (
							<SelectItem key={k} value={k}>{v}</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Table */}
			{isLoading ? (
				<div className="flex justify-center py-16">
					<div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
				</div>
			) : filtered.length === 0 ? (
				<EmptyState title={t("no_activities")} description={t("no_activities_desc")} />
			) : (
				<div className="bg-card border border-border rounded-xl overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border bg-muted/50">
									<th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("title")}</th>
									<th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t("teacher")}</th>
									<th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t("category")}</th>
									<th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t("date")}</th>
									<th className="text-center px-4 py-3 font-medium text-muted-foreground">{t("score")}</th>
									<th className="text-center px-4 py-3 font-medium text-muted-foreground">{t("status")}</th>
									<th className="text-right px-4 py-3 font-medium text-muted-foreground">{t("actions")}</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((sub) => (
									<tr key={sub.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
										<td className="px-4 py-3">
											<p className="font-medium">{sub.title}</p>
											<p className="text-xs text-muted-foreground md:hidden">{sub.teacher_details?.full_name}</p>
										</td>
										<td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
											{sub.teacher_details?.full_name || "—"}
										</td>
										<td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
											{sub.activity_type_details?.name || "—"}
										</td>
										<td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
											{sub.submission_date ? format(new Date(sub.submission_date), "dd.MM.yyyy") : "—"}
										</td>
										<td className="px-4 py-3 text-center font-semibold text-primary">
											{sub?.points ?? "—"}
										</td>
										<td className="px-4 py-3 text-center">
											<StatusBadge status={sub.status} />
										</td>
										<td className="px-4 py-3 text-right">
											<div className="flex items-center justify-end gap-1">
												<Button variant="ghost" size="sm" onClick={() => setShowDetail(sub)}>
													<Eye className="w-3.5 h-3.5" />
												</Button>
												{user?.role_details?.name !== "Department Head" && (
													<>
														{sub.status === "pending" && (
															<Button variant="ghost" size="sm" onClick={() => openEdit(sub)}>
																<Pencil className="w-3.5 h-3.5" />
															</Button>
														)}
														<Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(sub.id)}>
															<Trash2 className="w-3.5 h-3.5" />
														</Button>
													</>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Form Dialog */}
			<Dialog open={showForm} onOpenChange={closeForm}>
				<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editItem ? t("edit_activity") : t("new_activity")}</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label>{t("title")} *</Label>
							<Input name="title" required defaultValue={editItem?.title || ""} />
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="sm:col-span-2">
								<Label>Kafedra</Label>
								<SearchableSelect
									value={selectedDept}
									onValueChange={(v) => { setSelectedDept(v); setSelectedTeacher(""); }}
									placeholder="Kafedra qidiring..."
									disabled={isTeacher}
									options={departments.map((d) => ({ value: d.id, label: d.name }))}
								/>
							</div>
							<div className="sm:col-span-2">
								<Label>{t("teacher")} *</Label>
								<SearchableSelect
									value={selectedTeacher}
									onValueChange={setSelectedTeacher}
									placeholder="O'qituvchi qidiring..."
									disabled={isTeacher}
									options={filteredTeachers.map((tchr) => ({
										value: tchr.id,
										label: tchr.full_name || `${tchr.user_details?.first_name || ""} ${tchr.user_details?.last_name || ""}`.trim() || tchr.employee_id,
									}))}
								/>
							</div>
							<div className="sm:col-span-2">
								<Label>Kategoriya *</Label>
								<SearchableSelect
									value={selectedType}
									onValueChange={setSelectedType}
									placeholder="Kategoriya qidiring..."
									options={types.map((tp) => ({
										value: tp.id,
										label: `${tp.name} (${tp.base_points} ball)`,
									}))}
								/>
							</div>
							<div>
								<Label>{t("academic_year")} *</Label>
								<SearchableSelect
									value={selectedYear}
									onValueChange={setSelectedYear}
									placeholder={t("select")}
									options={years.map((y) => ({ value: y.id, label: y.name }))}
								/>
							</div>
							<div>
								<Label>{t("date")} *</Label>
								<Input name="submission_date" type="date" required defaultValue={editItem?.submission_date || ""} />
							</div>
							<div className="sm:col-span-2">
								<div className="flex items-center gap-2">
									<input
										type="checkbox"
										id="is_coauthor"
										checked={isCoauthor}
										onChange={(e) => setIsCoauthor(e.target.checked)}
										className="w-4 h-4 cursor-pointer"
									/>
									<Label htmlFor="is_coauthor" className="cursor-pointer">Hammualliflik</Label>
								</div>
								{isCoauthor && (
									<div className="mt-2">
										<Label>{t("co_authors_count") || "Mualliflar soni"}</Label>
										<Input
											name="co_authors_count"
											type="number"
											min="2"
											defaultValue={editItem?.co_authors_count ?? 2}
											placeholder="2"
											className="mt-1"
										/>
										<p className="text-xs text-muted-foreground mt-1">
											{t("co_authors_hint") || "Ball shu songa bo'linadi."}
										</p>
									</div>
								)}
							</div>
						</div>
						<div>
							<Label>{t("description")}</Label>
							<Textarea name="description" rows={3} defaultValue={editItem?.description || ""} />
						</div>
						<div className="space-y-2">
							<Label>Hujjat</Label>
							<div>
								<p className="text-xs text-muted-foreground mb-1">Fayl yuklash</p>
								<Input name="proof_file" type="file" accept=".pdf,.png,.jpg,.jpeg" className="cursor-pointer" />
								{editItem?.proof_file && (
									<div className="mt-1">
										<ProofLink value={editItem.proof_file} label={t("current_file") || "Joriy fayl"} className="text-xs" />
									</div>
								)}
								<p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG — max 10 MB</p>
							</div>
							<div>
								<p className="text-xs text-muted-foreground mb-1">Yoki URL kiriting</p>
								<Input
									name="proof_url"
									type="url"
									placeholder="https://..."
									defaultValue={editItem?.proof_file?.startsWith("http") && !editItem.proof_file.includes("/media/") ? editItem.proof_file : ""}
								/>
							</div>
							<p className="text-xs text-muted-foreground">Fayl va URL ikkalasi ham ixtiyoriy. Fayl yuklansa URL e'tiborga olinmaydi.</p>
						</div>
						<div className="flex justify-end gap-3 pt-2">
							<Button type="button" variant="outline" onClick={closeForm}>{t("cancel")}</Button>
							<Button type="submit" disabled={isSaving}>
								{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
								{editItem ? t("save") : t("submit")}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Detail Dialog */}
			<Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
				<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t("activity_details")}</DialogTitle>
					</DialogHeader>
					{showDetail && (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-3 text-sm">
								<div>
									<p className="text-xs text-muted-foreground">{t("title")}</p>
									<p className="font-medium">{showDetail.title}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">{t("status")}</p>
									<StatusBadge status={showDetail.status} />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">{t("teacher")}</p>
									<p className="font-medium">{showDetail.teacher_details?.full_name || "—"}</p>
									<p className="text-xs text-muted-foreground">{showDetail.teacher_details?.employee_id}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">{t("activity_type") || "Faoliyat turi"}</p>
									<p className="font-medium">{showDetail.activity_type_details?.name || "—"}</p>
									<p className="text-xs text-muted-foreground">{showDetail.activity_type_details?.base_points} ball (bazaviy)</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">{t("date")}</p>
									<p className="font-medium">
										{showDetail.submission_date ? format(new Date(showDetail.submission_date), "dd.MM.yyyy") : "—"}
									</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">{t("co_authors_count") || "Mualliflar soni"}</p>
									<p className="font-medium">{showDetail.co_authors_count ?? 1}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">{t("final_score")}</p>
									<p className="font-bold text-primary text-xl">{showDetail.points ?? "—"}</p>
								</div>
								{showDetail.math_trace && (
									<div className="col-span-2 bg-muted/50 rounded-lg p-3">
										<p className="text-xs text-muted-foreground mb-1">{t("calculation") || "Hisob-kitob"}</p>
										<p className="text-xs font-mono text-muted-foreground">{showDetail.math_trace.formula}</p>
										<p className="text-sm font-medium mt-1">{showDetail.math_trace.calculation}</p>
									</div>
								)}
							</div>
							{showDetail.description && (
								<div>
									<p className="text-xs text-muted-foreground mb-1">{t("description")}</p>
									<p className="text-sm">{showDetail.description}</p>
								</div>
							)}
							{showDetail.proof_file && (
								<div className="flex flex-col items-start">
									<p className="text-xs text-muted-foreground mb-1">{t("proof_file") || "Tasdiqlovchi fayl"}</p>
									<ProofLink value={showDetail.proof_file} />
								</div>
							)}
							{showDetail.review_comments && (
								<div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
									<p className="text-xs text-muted-foreground mb-1">{t("reviewer_comment")}</p>
									<p className="text-sm">{showDetail.review_comments}</p>
								</div>
							)}
							{showDetail.reviewed_at && (
								<p className="text-xs text-muted-foreground">
									{t("reviewed_at") || "Ko'rib chiqilgan"}:{" "}
									{format(new Date(showDetail.reviewed_at), "dd.MM.yyyy HH:mm")}
								</p>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Delete Confirm */}
			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("delete_confirm_title")}</AlertDialogTitle>
						<AlertDialogDescription>{t("delete_confirm_desc")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive hover:bg-destructive/90"
						>
							{isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							{t("delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
