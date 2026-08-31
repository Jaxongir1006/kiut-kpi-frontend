import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Search, Filter, X, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ProtectedAvatarImage from "@/components/shared/ProtectedAvatarImage";
import ProtectedFileLink from "@/components/shared/ProtectedFileLink";
import ErrorState from "@/components/shared/ErrorState";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { fetchTeachers, createTeacher, updateTeacher, deleteTeacher } from "@/features/teachers/teachersSlice";
import { fetchDepartments } from "@/features/departments/departmentsSlice";
import { fetchDegrees } from "@/features/degrees/degreesSlice";

const EMPLOYMENT_TYPES = [
	{ value: "staff", label: "Shtat (Staff)" },
	{ value: "part_time", label: "Yarim stavka (Part-time)" },
	{ value: "hourly", label: "Soatbay (Hourly)" },
];

export default function Teachers() {
	const { t } = useLanguage();
	const dispatch = useDispatch();

	const { list: teachers, isLoading, isSaving, isDeleting, error } = useSelector((s) => s.teachers);
	const { list: departments } = useSelector((s) => s.departments);
	const { list: degrees } = useSelector((s) => s.degrees);

	const [search, setSearch] = useState("");
	const [deptFilter, setDeptFilter] = useState("all");
	const [positionFilter, setPositionFilter] = useState("all");
	const [employmentFilter, setEmploymentFilter] = useState("all");
	const [showForm, setShowForm] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [deleteId, setDeleteId] = useState(null);

	useEffect(() => {
		dispatch(fetchTeachers());
		dispatch(fetchDepartments());
		dispatch(fetchDegrees());
	}, [dispatch]);

	const positions = [...new Set(teachers.map((t) => t.position).filter(Boolean))];

	const filtered = teachers.filter((tchr) => {
		const matchSearch = (tchr.full_name || "").toLowerCase().includes(search.toLowerCase());
		const matchDept = deptFilter === "all" || tchr.department === deptFilter;
		const matchPosition = positionFilter === "all" || tchr.position === positionFilter;
		const matchEmployment = employmentFilter === "all" || tchr.employment_type === employmentFilter;
		return matchSearch && matchDept && matchPosition && matchEmployment;
	});

	const openCreate = () => { setEditItem(null); setShowForm(true); };
	const openEdit = (tchr) => { setEditItem(tchr); setShowForm(true); };
	const closeForm = () => { setShowForm(false); setEditItem(null); };

	const handleSubmit = async (e) => {
		e.preventDefault();
		const formValues = new FormData(e.target);

		const data = new FormData();
		data.append("full_name", formValues.get("full_name"));
		data.append("employee_id", formValues.get("employee_id"));
		data.append("department", formValues.get("department"));
		data.append("is_active", "true");

		const degree = formValues.get("degree");
		if (degree && degree !== "none") data.append("degree", degree);

		const position = formValues.get("position");
		if (position) data.append("position", position);

		const employment_type = formValues.get("employment_type");
		if (employment_type) data.append("employment_type", employment_type);

		const email = formValues.get("email");
		if (email) data.append("email", email);

		const phone = formValues.get("phone");
		if (phone) data.append("phone", phone);

		const photo = formValues.get("photo");
		if (photo && photo.size > 0) data.append("photo", photo);

		try {
			if (editItem) {
				await dispatch(updateTeacher({ id: editItem.id, data })).unwrap();
				toast.success(t("teacher_updated"));
			} else {
				await dispatch(createTeacher(data)).unwrap();
				toast.success(t("teacher_added"));
			}
			closeForm();
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const handleDelete = async () => {
		try {
			await dispatch(deleteTeacher(deleteId)).unwrap();
			toast.success(t("teacher_deleted") || "O'chirildi");
			setDeleteId(null);
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};
	
	return (
		<div>
			<PageHeader title={t("teachers_title")} description={t("teachers_desc")}>
				<Button onClick={openCreate} className="gap-2">
					<Plus className="w-4 h-4" /> {t("add_teacher")}
				</Button>
			</PageHeader>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-3 mb-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input placeholder={t("search_by_name")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
				</div>
				<Select value={deptFilter} onValueChange={setDeptFilter}>
					<SelectTrigger className="w-48">
						<Filter className="w-4 h-4 mr-2 text-muted-foreground" />
						<SelectValue placeholder={t("department")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("all_departments")}</SelectItem>
						{departments.map((d) => (
							<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={positionFilter} onValueChange={setPositionFilter}>
					<SelectTrigger className="w-48">
						<Filter className="w-4 h-4 mr-2 text-muted-foreground" />
						<SelectValue placeholder={t("position")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("all_positions")}</SelectItem>
						{positions.map((p) => (
							<SelectItem key={p} value={p}>{p}</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={employmentFilter} onValueChange={setEmploymentFilter}>
					<SelectTrigger className="w-48">
						<Filter className="w-4 h-4 mr-2 text-muted-foreground" />
						<SelectValue placeholder={t("employment_type")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("all")}</SelectItem>
						{EMPLOYMENT_TYPES.map((e) => (
							<SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
						))}
					</SelectContent>
				</Select>
				{(search || deptFilter !== "all" || positionFilter !== "all" || employmentFilter !== "all") && (
					<Button variant="ghost" size="sm" onClick={() => { setSearch(""); setDeptFilter("all"); setPositionFilter("all"); setEmploymentFilter("all"); }}>
						<X className="w-4 h-4 mr-1" /> {t("clear")}
					</Button>
				)}
			</div>

			{/* Table */}
			{isLoading ? (
				<div className="flex justify-center py-16">
					<div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
				</div>
			) : error ? (
				<ErrorState
					title="O'qituvchilar ro'yxatini yuklab bo'lmadi"
					error={error}
					onRetry={() => dispatch(fetchTeachers())}
				/>
			) : filtered.length === 0 ? (
				<EmptyState title={t("no_teachers")} description={t("no_teachers_desc")} />
			) : (
				<div className="bg-card border border-border rounded-xl overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border bg-muted/50">
									<th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("teacher")}</th>
									<th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t("department")}</th>
									<th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t("position")}</th>
									<th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t("employment_type")}</th>
									<th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t("academic_degree")}</th>
									<th className="text-center px-4 py-3 font-medium text-muted-foreground">{t("status")}</th>
									<th className="text-right px-4 py-3 font-medium text-muted-foreground">{t("actions")}</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((tchr) => (
									<tr key={tchr.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
										<td className="px-4 py-3">
											<div className="flex items-center gap-3">
												<Avatar className="w-8 h-8">
													<ProtectedAvatarImage src={tchr.photo} alt={tchr.full_name} />
													<AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
														{tchr?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div>
													<p className="font-medium">{tchr?.full_name}</p>
													<p className="text-xs text-muted-foreground">{tchr?.email}</p>
												</div>
											</div>
										</td>
										<td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
											{tchr.department_details?.name || "—"}
										</td>
										<td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
											{tchr?.position || "—"}
										</td>
										<td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
											{tchr.employment_type_display || tchr.employment_type || "—"}
										</td>
										<td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
											{tchr?.degree_details?.title || "—"}
										</td>
										<td className="px-4 py-3 text-center">
											<Badge
												variant="secondary"
												className={tchr.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}
											>
												{tchr.is_active ? t("active_state") : t("inactive_state")}
											</Badge>
										</td>
										<td className="px-4 py-3 text-right">
											<div className="flex items-center justify-end gap-1">
												<Button variant="ghost" size="sm" onClick={() => openEdit(tchr)}>
													<Pencil className="w-3.5 h-3.5 mr-1" /> {t("edit")}
												</Button>
												<Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(tchr.id)}>
													<Trash2 className="w-3.5 h-3.5" />
												</Button>
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
						<DialogTitle>{editItem ? t("edit_teacher") : t("new_teacher")}</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="col-span-2">
								<Label>{t("full_name")} *</Label>
								<Input name="full_name" required defaultValue={editItem?.full_name || ""} />
							</div>
							<div className="col-span-2">
								<Label>{t("employee_id")} *</Label>
								<Input name="employee_id" required defaultValue={editItem?.employee_id || ""} />
							</div>
							<div>
								<Label>{t("department")} *</Label>
								<Select name="department" defaultValue={editItem?.department || ""} required>
									<SelectTrigger><SelectValue placeholder={t("select")} /></SelectTrigger>
									<SelectContent>
										{departments.map((d) => (
											<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label>{t("academic_degree_sg") || "Ilmiy daraja"}</Label>
								<Select name="degree" defaultValue={editItem?.degree || "none"}>
									<SelectTrigger><SelectValue placeholder={t("select") || "Tanlang"} /></SelectTrigger>
									<SelectContent>
										<SelectItem value="none">{t("not_selected") || "Tanlanmagan"}</SelectItem>
										{degrees.map((d) => (
											<SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label>{t("position")}</Label>
								<Input name="position" defaultValue={editItem?.position || ""} />
							</div>
							<div>
								<Label>{t("employment_type")}</Label>
								<Select name="employment_type" defaultValue={editItem?.employment_type || "staff"}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>
										{EMPLOYMENT_TYPES.map((e) => (
											<SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label>{t("email")}</Label>
								<Input name="email" type="email" defaultValue={editItem?.email || ""} />
							</div>
							<div>
								<Label>{t("phone")}</Label>
								<Input name="phone" defaultValue={editItem?.phone || ""} />
							</div>
							<div className="col-span-2">
								<Label>{t("photo")}</Label>
								<Input name="photo" type="file" accept="image/*" className="cursor-pointer" />
								{editItem?.photo && (
									<p className="text-xs text-muted-foreground mt-1">
										{t("current_photo") || "Joriy rasm"}:{" "}
										<ProtectedFileLink url={editItem.photo} className="text-xs align-middle">
											{t("view") || "Ko'rish"}
										</ProtectedFileLink>
									</p>
								)}
							</div>
						</div>
						<div className="flex justify-end gap-3 pt-2">
							<Button type="button" variant="outline" onClick={closeForm}>{t("cancel")}</Button>
							<Button type="submit" disabled={isSaving}>
								{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
								{editItem ? t("save") : t("add")}
							</Button>
						</div>
					</form>
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
