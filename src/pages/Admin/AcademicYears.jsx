import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Pencil, Trash2, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { format } from "date-fns";
import {
	fetchYears,
	createYear,
	updateYear,
	deleteYear,
} from "@/features/academicYears/academicYearsSlice";

export default function AcademicYears() {
	const { t } = useLanguage();
	const dispatch = useDispatch();
	const { list: years, isLoading, isSaving, isDeleting } = useSelector((s) => s.academicYears);

	const [showForm, setShowForm] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [deleteId, setDeleteId] = useState(null);

	useEffect(() => {
		dispatch(fetchYears());
	}, [dispatch]);

	const openCreate = () => { setEditItem(null); setShowForm(true); };
	const openEdit = (y) => { setEditItem(y); setShowForm(true); };
	const closeForm = () => { setShowForm(false); setEditItem(null); };

	const handleSubmit = async (e) => {
		e.preventDefault();
		const form = new FormData(e.target);
		const data = {
			name: form.get("name"),
			start_date: form.get("start_date") || null,
			end_date: form.get("end_date") || null,
			is_active: editItem ? editItem.is_active : true,
		};
		try {
			if (editItem) {
				await dispatch(updateYear({ id: editItem.id, data })).unwrap();
				toast.success(t("year_updated"));
			} else {
				await dispatch(createYear(data)).unwrap();
				toast.success(t("year_added"));
			}
			closeForm();
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const handleToggleActive = async (year) => {
		try {
			await dispatch(updateYear({ id: year.id, data: { is_active: !year.is_active } })).unwrap();
			toast.success(t("saved"));
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const handleDelete = async () => {
		try {
			await dispatch(deleteYear(deleteId)).unwrap();
			toast.success(t("year_deleted"));
			setDeleteId(null);
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	return (
		<div>
			<PageHeader title={t("years_title")} description={t("years_desc")}>
				<p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 mt-2 border border-border">
					{t("years_purpose")}
				</p>
				<Button onClick={openCreate} className="gap-2">
					<Plus className="w-4 h-4" /> {t("add")}
				</Button>
			</PageHeader>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
				</div>
			) : years.length === 0 ? (
				<EmptyState title={t("no_years")} icon={Calendar} />
			) : (
				<div className="bg-card border border-border rounded-xl overflow-hidden">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border bg-muted/50">
								<th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("name")}</th>
								<th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t("start_label")}</th>
								<th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t("end_label")}</th>
								<th className="text-center px-4 py-3 font-medium text-muted-foreground">{t("state")}</th>
								<th className="text-right px-4 py-3 font-medium text-muted-foreground">{t("actions")}</th>
							</tr>
						</thead>
						<tbody>
							{years.map((y) => (
								<tr key={y.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
									<td className="px-4 py-3 font-medium">{y.name}</td>
									<td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
										{y.start_date ? format(new Date(y.start_date), "dd.MM.yyyy") : "—"}
									</td>
									<td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
										{y.end_date ? format(new Date(y.end_date), "dd.MM.yyyy") : "—"}
									</td>
									<td className="px-4 py-3 text-center">
										<Badge
											variant="secondary"
											className={y.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}
										>
											{y.is_active ? t("active_state") : t("inactive_state")}
										</Badge>
									</td>
									<td className="px-4 py-3 text-right">
										<div className="flex items-center justify-end gap-1">
											<Button variant="ghost" size="sm" onClick={() => handleToggleActive(y)}>
												{y.is_active ? t("inactive") : t("active")}
											</Button>
											<Button variant="ghost" size="sm" onClick={() => openEdit(y)}>
												<Pencil className="w-3.5 h-3.5" />
											</Button>
											<Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(y.id)}>
												<Trash2 className="w-3.5 h-3.5" />
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Form dialog */}
			<Dialog open={showForm} onOpenChange={closeForm}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{editItem ? t("edit_year") : t("new_year")}</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label>{t("name_req")}</Label>
							<Input name="name" required defaultValue={editItem?.name || ""} placeholder={t("year_placeholder")} />
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label>{t("start_date")}</Label>
								<Input name="start_date" type="date" defaultValue={editItem?.start_date || ""} />
							</div>
							<div>
								<Label>{t("end_date")}</Label>
								<Input name="end_date" type="date" defaultValue={editItem?.end_date || ""} />
							</div>
						</div>
						<div className="flex justify-end gap-3">
							<Button type="button" variant="outline" onClick={closeForm}>
								{t("cancel")}
							</Button>
							<Button type="submit" disabled={isSaving}>
								{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
								{t("save")}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete confirm */}
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
