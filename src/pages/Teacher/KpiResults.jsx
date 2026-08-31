import React, {useState, useEffect, useMemo} from "react";
import {useDispatch, useSelector} from "react-redux";
import {useLocation, useNavigate} from "react-router-dom";
import {
	Plus, Eye, Pencil, Trash2, Loader2, Search,
	FileText, ChevronLeft, ChevronRight,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {
	AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
	AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {toast} from "sonner";
import {format} from "date-fns";
import SearchableSelect from "@/components/shared/SearchableSelect";
import ProofLink from "@/components/shared/ProofLink";
import ErrorState from "@/components/shared/ErrorState";
import {
	fetchSubmissions, createSubmission, updateSubmission, deleteSubmission,
} from "@/features/submissions/submissionsSlice";
import {fetchTypes} from "@/features/types/typesSlice";
import {fetchYears} from "@/features/academicYears/academicYearsSlice";
import {fetchDepartments} from "@/features/departments/departmentsSlice";
import {fetchTeachers} from "@/features/teachers/teachersSlice";
import {useUserRole} from "@/hooks/useUserRole";

const STATUS_CFG = {
	pending:             { label: "Kafedra kutmoqda",      cls: "bg-yellow-100 text-yellow-700" },
	department_approved: { label: "Kafedra tasdiqladi",    cls: "bg-blue-100 text-blue-700" },
	department_rejected: { label: "Kafedra rad etdi",      cls: "bg-orange-100 text-orange-700" },
	approved:            { label: "Tasdiqlangan",          cls: "bg-emerald-100 text-emerald-700" },
	rejected:            { label: "Rad etilgan",           cls: "bg-red-100 text-red-700" },
	overridden:          { label: "Komissiya o'zgartirdi", cls: "bg-purple-100 text-purple-700" },
};

const PAGE_SIZE = 10;

// The backend rejects anything outside this set and validates the real magic
// bytes, so a renamed .exe still fails there — this check only exists to fail
// fast with a message that says WHICH rule was broken.
const MAX_PROOF_BYTES = 10 * 1024 * 1024;
const ALLOWED_PROOF_EXT = ["pdf", "png", "jpg", "jpeg"];
const ALLOWED_PROOF_MIME = ["application/pdf", "image/png", "image/jpeg"];

function validateProofFile(file) {
	const ext = (file.name.split(".").pop() || "").toLowerCase();
	if (!ALLOWED_PROOF_EXT.includes(ext)) {
		return `"${ext || "noma'lum"}" formatdagi fayl qabul qilinmaydi. Faqat PDF, PNG yoki JPG yuklang (ZIP qabul qilinmaydi).`;
	}
	// Empty type happens on some browsers/OSes; extension check already passed.
	if (file.type && !ALLOWED_PROOF_MIME.includes(file.type)) {
		return `Fayl turi (${file.type}) qo'llab-quvvatlanmaydi. Faqat PDF, PNG yoki JPG yuklang.`;
	}
	if (file.size > MAX_PROOF_BYTES) {
		const mb = (file.size / (1024 * 1024)).toFixed(1);
		return `Fayl hajmi ${mb} MB — ruxsat etilgan eng katta hajm 10 MB.`;
	}
	return null;
}

export default function TeacherKpiResults() {
	const dispatch = useDispatch();
	const location = useLocation();
	const navigate = useNavigate();
	const {teacherProfile, user} = useUserRole();

	const {list: submissions, isLoading, isSaving, isDeleting, error} = useSelector((s) => s.submissions);
	const {list: types} = useSelector((s) => s.types);
	const {list: years} = useSelector((s) => s.academicYears);
	const {list: departments} = useSelector((s) => s.departments);
	const {list: teachers} = useSelector((s) => s.teachers);

	const [search, setSearch] = useState("");
	const [yearFilter, setYearFilter] = useState("all");
	const [statusFilter, setStatus] = useState("all");
	const [typeFilter, setTypeFilter] = useState("all");
	const [page, setPage] = useState(1);
	const [showForm, setShowForm] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [showDetail, setShowDetail] = useState(null);
	const [deleteId, setDeleteId] = useState(null);
	const [isCoauthor, setIsCoauthor] = useState(false);
	const [selectedType, setSelectedType] = useState("");
	const [selectedYear, setSelectedYear] = useState("");

	// Derive teacher ID and department from teacherProfile or user
	const teacherId = teacherProfile?.id || null;
	const teacherName =
		teacherProfile?.full_name ||
		(user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "") ||
		user?.username ||
		"O'qituvchi";

	const myDeptId = teacherProfile?.department || user?.department || null;
	const myDeptName = useMemo(() => {
		if (teacherProfile?.department_details?.name) return teacherProfile.department_details.name;
		if (teacherProfile?.department_name) return teacherProfile.department_name;
		if (myDeptId) {
			const d = departments.find((d) => d.id === myDeptId);
			if (d) return d.name;
		}
		return "—";
	}, [teacherProfile, myDeptId, departments]);

	// Auto-open form if navigated to /my-kpi/new
	useEffect(() => {
		if (location.pathname.endsWith("/new")) openCreate();
	}, [location.pathname]);

	useEffect(() => {
		dispatch(fetchSubmissions());
		dispatch(fetchTypes());
		dispatch(fetchYears());
		dispatch(fetchDepartments());
		dispatch(fetchTeachers());
	}, [dispatch]);

	// Filter submissions for this teacher only
	const mySubmissions = useMemo(() => {
		if (!teacherId) return submissions;
		return submissions.filter(
			(s) => s.teacher === teacherId || s.teacher_details?.id === teacherId,
		);
	}, [submissions, teacherId]);

	// Summary stats
	const totalCount = mySubmissions.length;
	const approvedCount = mySubmissions.filter((s) => s.status === "approved").length;
	const pendingCount = mySubmissions.filter((s) => s.status === "pending").length;
	const rejectedCount = mySubmissions.filter((s) => s.status === "rejected").length;
	const overriddenCount = mySubmissions.filter((s) => s.status === "overridden").length;

	// Filter + search
	const filtered = useMemo(() => {
		return mySubmissions.filter((s) => {
			const q = search.toLowerCase();
			if (q && !(s.title || "").toLowerCase().includes(q) && !(s.activity_type_details?.name || "").toLowerCase().includes(q)) return false;
			if (yearFilter !== "all" && s.academic_year !== yearFilter && s.academic_year_details?.id !== yearFilter) return false;
			if (statusFilter !== "all" && s.status !== statusFilter) return false;
			if (typeFilter !== "all" && s.activity_type !== typeFilter && s.activity_type_details?.id !== typeFilter) return false;
			return true;
		});
	}, [mySubmissions, search, yearFilter, statusFilter, typeFilter]);

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	const openCreate = () => {
		setEditItem(null);
		setIsCoauthor(false);
		setSelectedType("");
		// Pre-select active year
		const active = years.find((y) => y.is_active);
		setSelectedYear(active?.id || years[0]?.id || "");
		setShowForm(true);
	};

	const openEdit = (item) => {
		setEditItem(item);
		setIsCoauthor((item.co_authors_count ?? 1) > 1);
		setSelectedType(item.activity_type || "");
		setSelectedYear(item.academic_year || "");
		setShowForm(true);
	};

	const closeForm = () => {
		setShowForm(false);
		setEditItem(null);
		setIsCoauthor(false);
		setSelectedType("");
		setSelectedYear("");
		if (location.pathname.endsWith("/new")) navigate("/my-kpi", {replace: true});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!teacherId) {
			toast.error("O'qituvchi profili topilmadi. Iltimos, administrator bilan bog'laning.");
			return;
		}
		if (!selectedType) return toast.error("Kategoriya tanlanmagan");
		if (!selectedYear) return toast.error("Akademik yil tanlanmagan");

		const fv = new FormData(e.target);
		const data = new FormData();
		data.append("teacher", teacherId);
		data.append("activity_type", selectedType);
		data.append("academic_year", selectedYear);
		data.append("title", fv.get("title"));
		data.append("submission_date", fv.get("submission_date"));
		const desc = fv.get("description");
		if (desc) data.append("description", desc);
		data.append("co_authors_count", isCoauthor ? (fv.get("co_authors_count") || "2") : "1");
		const proofFile = fv.get("proof_file");
		const proofUrl = fv.get("proof_url");
		if (proofFile && proofFile.size > 0) {
			const fileError = validateProofFile(proofFile);
			if (fileError) return toast.error(fileError);
			data.append("proof_file", proofFile);
		} else if (proofUrl) data.append("proof_file", proofUrl);

		try {
			if (editItem) {
				await dispatch(updateSubmission({id: editItem.id, data})).unwrap();
				toast.success("Yangilandi");
			} else {
				await dispatch(createSubmission(data)).unwrap();
				toast.success("Muvaffaqiyatli topshirildi");
			}
			closeForm();
		} catch (err) {
			toast.error(typeof err === "string" ? err : "Xatolik yuz berdi");
		}
	};

	const handleDelete = async () => {
		try {
			await dispatch(deleteSubmission(deleteId)).unwrap();
			toast.success("O'chirildi");
			setDeleteId(null);
		} catch (err) {
			toast.error(typeof err === "string" ? err : "Xatolik yuz berdi");
		}
	};

	return (
		<div>
			{/* Page Header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">KPI natijalarim</h1>
					<p className="text-muted-foreground text-sm mt-0.5">
						Topshirgan KPI arizalaringiz va ularning holatini kuzatib boring.
					</p>
				</div>
				<Button onClick={openCreate} className="gap-2">
					<Plus className="w-4 h-4"/> Yangi natija kiritish
				</Button>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap gap-3 mb-5 items-center">
				<Select value={yearFilter} onValueChange={(v) => {
					setYearFilter(v);
					setPage(1);
				}}>
					<SelectTrigger className="w-36 h-9 text-sm">
						<SelectValue placeholder="Akademik yil"/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Barcha yillar</SelectItem>
						{years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
					</SelectContent>
				</Select>
				<Select value={statusFilter} onValueChange={(v) => {
					setStatus(v);
					setPage(1);
				}}>
					<SelectTrigger className="w-40 h-9 text-sm">
						<SelectValue placeholder="Holati"/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Barchasi</SelectItem>
						{Object.entries(STATUS_CFG).map(([k, v]) => (
							<SelectItem key={k} value={k}>{v.label}</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={typeFilter} onValueChange={(v) => {
					setTypeFilter(v);
					setPage(1);
				}}>
					<SelectTrigger className="w-44 h-9 text-sm">
						<SelectValue placeholder="Faoliyat turi"/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Barcha turlar</SelectItem>
						{types.map((tp) => <SelectItem key={tp.id} value={tp.id}>{tp.name}</SelectItem>)}
					</SelectContent>
				</Select>
				<div className="relative flex-1 min-w-[180px]">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
					<Input
						placeholder="Qidirish..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="pl-9 h-9"
					/>
				</div>
			</div>

			{/* Stat chips */}
			<div className="flex flex-wrap gap-2 mb-5">
				{[
					{label: "Jami", count: totalCount, cls: "bg-blue-50 text-blue-700 border-blue-200"},
					{label: "Tasdiqlangan", count: approvedCount, cls: "bg-emerald-50 text-emerald-700 border-emerald-200"},
					{label: "Ko'rib chiqilmoqda", count: pendingCount, cls: "bg-yellow-50 text-yellow-700 border-yellow-200"},
					{label: "Qaytarilgan", count: overriddenCount, cls: "bg-purple-100 text-purple-700 border-purple-200"},
					{label: "Rad etilgan", count: rejectedCount, cls: "bg-red-50 text-red-700 border-red-200"},
				].map((s) => (
					<div key={s.label}
					     className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${s.cls}`}>
						<span className="text-lg font-bold">{s.count}</span>
						<span>{s.label}</span>
					</div>
				))}
			</div>

			{/* Table */}
			{isLoading ? (
				<div className="flex justify-center py-20">
					<Loader2 className="w-7 h-7 animate-spin text-primary"/>
				</div>
			) : error ? (
				<ErrorState
					title="Arizalaringizni yuklab bo'lmadi"
					error={error}
					onRetry={() => dispatch(fetchSubmissions())}
				/>
			) : filtered.length === 0 ? (
				<div className="flex flex-col items-center py-16 text-muted-foreground">
					<FileText className="w-12 h-12 mb-3 opacity-30"/>
					<p className="font-medium">Arizalar topilmadi</p>
					<p className="text-sm mt-1">Yangi KPI natijasi qo'shing yoki filtrlarni o'zgartiring</p>
				</div>
			) : (
				<div className="bg-card border border-border rounded-xl overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
							<tr className="border-b border-border bg-muted/50">
								<th className="text-left px-4 py-3 font-medium text-muted-foreground w-10">№</th>
								<th className="text-left px-4 py-3 font-medium text-muted-foreground">KPI mezoni</th>
								<th className="text-left px-4 py-3 font-medium text-muted-foreground">Natija nomi</th>
								<th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Faoliyat
									turi
								</th>
								<th className="text-center px-4 py-3 font-medium text-muted-foreground">Taxminiy ball</th>
								<th className="text-center px-4 py-3 font-medium text-muted-foreground">Yakuniy ball</th>
								<th className="text-center px-4 py-3 font-medium text-muted-foreground">Holati</th>
								<th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Sana</th>
								<th className="text-right px-4 py-3 font-medium text-muted-foreground">Amal</th>
							</tr>
							</thead>
							<tbody>
							{paginated.map((sub, i) => {
								const cfg = STATUS_CFG[sub.status] || {label: sub.status, cls: "bg-gray-100 text-gray-600"};
								const canEdit = sub.status === "pending" || sub.status === "department_rejected";
								const rowNum = (page - 1) * PAGE_SIZE + i + 1;
								return (
									<tr key={sub.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
										<td className="px-4 py-3 text-muted-foreground">{rowNum}</td>
										<td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px]">
											<span className="line-clamp-2">{sub.activity_type_details?.name || "—"}</span>
										</td>
										<td className="px-4 py-3 max-w-[200px]">
											<span className="line-clamp-2 font-medium">{sub.title}</span>
										</td>
										<td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
											{sub.academic_year_details?.name || "—"}
										</td>
										<td className="px-4 py-3 text-center text-muted-foreground">
											{sub.activity_type_details?.base_points ?? "—"}
										</td>
										<td className="px-4 py-3 text-center font-semibold text-primary">
											{sub.points ?? "—"}
										</td>
										<td className="px-4 py-3 text-center">
											<Badge variant="secondary" className={`text-[11px] border-0 ${cfg.cls}`}>
												{cfg.label}
											</Badge>
										</td>
										<td
											className="px-4 py-3 text-center text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
											{sub.submission_date ? format(new Date(sub.submission_date), "dd.MM.yyyy") : "—"}
										</td>
										<td className="px-4 py-3 text-right">
											<div className="flex items-center justify-end gap-1">
												<Button variant="ghost" size="sm" onClick={() => setShowDetail(sub)}>
													<Eye className="w-3.5 h-3.5"/>
												</Button>
												{canEdit && (
													<Button variant="ghost" size="sm" onClick={() => openEdit(sub)}>
														<Pencil className="w-3.5 h-3.5"/>
													</Button>
												)}
												{canEdit && (
													<Button variant="ghost" size="sm" className="text-destructive"
													        onClick={() => setDeleteId(sub.id)}>
														<Trash2 className="w-3.5 h-3.5"/>
													</Button>
												)}
											</div>
										</td>
									</tr>
								);
							})}
							</tbody>
						</table>
					</div>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex items-center justify-between px-4 py-3 border-t border-border">
							<p className="text-xs text-muted-foreground">Jami {filtered.length} ta ariza</p>
							<div className="flex items-center gap-1">
								<Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 1}
								        onClick={() => setPage((p) => p - 1)}>
									<ChevronLeft className="w-4 h-4"/>
								</Button>
								{Array.from({length: totalPages}, (_, i) => i + 1).map((p) => (
									<Button key={p} variant={p === page ? "default" : "outline"} size="icon" className="h-7 w-7 text-xs"
									        onClick={() => setPage(p)}>
										{p}
									</Button>
								))}
								<Button variant="outline" size="icon" className="h-7 w-7" disabled={page === totalPages}
								        onClick={() => setPage((p) => p + 1)}>
									<ChevronRight className="w-4 h-4"/>
								</Button>
							</div>
						</div>
					)}
				</div>
			)}

			{/* ── Form Dialog ── */}
			<Dialog open={showForm} onOpenChange={closeForm}>
				<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editItem ? "Arizani tahrirlash" : "Yangi KPI natijasi"}</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label>Sarlavha *</Label>
							<Input name="title" required className="mt-1" defaultValue={editItem?.title || ""}/>
						</div>

						{/* Kafedra — auto-filled & disabled */}
						<div>
							<Label>Kafedra</Label>
							<Input
								value={myDeptName}
								disabled
								className="mt-1 bg-muted text-muted-foreground"
							/>
						</div>

						{/* O'qituvchi — auto-filled & disabled */}
						<div>
							<Label>O'qituvchi</Label>
							<Input
								value={teacherName}
								disabled
								className="mt-1 bg-muted text-muted-foreground"
							/>
						</div>

						{/* Kategoriya */}
						<div>
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

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label>Akademik yil *</Label>
								<SearchableSelect
									value={selectedYear}
									onValueChange={setSelectedYear}
									placeholder="Yil"
									options={years.map((y) => ({value: y.id, label: y.name}))}
								/>
							</div>
							<div>
								<Label>Sana *</Label>
								<Input
									name="submission_date"
									type="date"
									required
									className="mt-0"
									defaultValue={editItem?.submission_date || ""}
								/>
							</div>
						</div>

						<div>
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
									<Label>Mualliflar soni</Label>
									<Input
										name="co_authors_count"
										type="number"
										min="2"
										defaultValue={editItem?.co_authors_count ?? 2}
										className="mt-1"
									/>
								</div>
							)}
						</div>

						<div>
							<Label>Izoh</Label>
							<Textarea name="description" rows={2} className="mt-1" defaultValue={editItem?.description || ""}/>
						</div>

						<div className="space-y-2">
							<Label>Hujjat (ixtiyoriy)</Label>
							<Input name="proof_file" type="file" accept=".pdf,.png,.jpg,.jpeg"/>
							<Input name="proof_url" type="url" placeholder="Yoki URL: https://..."/>
							<p className="text-xs text-muted-foreground">PDF, PNG yoki JPG — eng ko'pi 10 MB.</p>
						</div>

						<div className="flex justify-end gap-3 pt-2">
							<Button type="button" variant="outline" onClick={closeForm}>Bekor qilish</Button>
							<Button type="submit" disabled={!selectedType || !selectedYear || isSaving}>
								{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
								{editItem ? "Saqlash" : "Topshirish"}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* ── Detail Dialog ── */}
			<Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
				<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
					<DialogHeader><DialogTitle>Ariza tafsilotlari</DialogTitle></DialogHeader>
					{showDetail && (
						<div className="space-y-4 text-sm">
							<div className="grid grid-cols-2 gap-3">
								<div>
									<p className="text-xs text-muted-foreground">Sarlavha</p>
									<p className="font-medium">{showDetail.title}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Holat</p>
									<Badge variant="secondary" className={`text-[11px] border-0 ${STATUS_CFG[showDetail.status]?.cls}`}>
										{STATUS_CFG[showDetail.status]?.label}
									</Badge>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">KPI mezoni</p>
									<p className="font-medium">{showDetail.activity_type_details?.name || "—"}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Yakuniy ball</p>
									<p className="text-xl font-bold text-primary">{showDetail.points ?? "—"}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Sana</p>
									<p>{showDetail.submission_date ? format(new Date(showDetail.submission_date), "dd.MM.yyyy") : "—"}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Mualliflar soni</p>
									<p>{showDetail.co_authors_count ?? 1}</p>
								</div>
								{showDetail.math_trace && (
									<div className="col-span-2 bg-muted/50 rounded-lg p-3">
										<p className="text-xs text-muted-foreground mb-1">Hisob-kitob</p>
										<p className="text-xs font-mono">{showDetail.math_trace.formula}</p>
										<p className="text-sm font-medium mt-1">{showDetail.math_trace.calculation}</p>
									</div>
								)}
							</div>
							{showDetail.description && (
								<div>
									<p className="text-xs text-muted-foreground mb-1">Izoh</p>
									<p>{showDetail.description}</p>
								</div>
							)}
							{showDetail.proof_file && (
								<div className="flex flex-col items-start">
									<p className="text-xs text-muted-foreground mb-1">Tasdiqlovchi fayl</p>
									<ProofLink value={showDetail.proof_file}/>
								</div>
							)}
							{showDetail.review_comments && (
								<div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
									<p className="text-xs text-muted-foreground mb-1">Izoh (mutaxassis tomonidan)</p>
									<p>{showDetail.review_comments}</p>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* ── Delete Confirm ── */}
			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>O'chirishni tasdiqlash</AlertDialogTitle>
						<AlertDialogDescription>Bu ariza o'chiriladi va qaytarib bo'lmaydi.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Bekor qilish</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive hover:bg-destructive/90"
						>
							{isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
							O'chirish
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
