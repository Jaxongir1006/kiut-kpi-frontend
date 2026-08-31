import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import {
	fetchDepartments,
	createDepartment,
	updateDepartment,
	deleteDepartment,
} from "@/features/departments/departmentsSlice";

export default function Departments() {
	const { t } = useLanguage();
	const dispatch = useDispatch();
	const { list: departments, isLoading, isSaving, isDeleting } = useSelector((s) => s.departments);

	const [showForm, setShowForm] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [deleteId, setDeleteId] = useState(null);

	useEffect(() => {
		dispatch(fetchDepartments());
	}, [dispatch]);

	const openCreate = () => { setEditItem(null); setShowForm(true); };
	const openEdit = (d) => { setEditItem(d); setShowForm(true); };
	const closeForm = () => { setShowForm(false); setEditItem(null); };

	const handleSubmit = async (e) => {
		e.preventDefault();
		const form = new FormData(e.target);
		const data = {
			name: form.get("name"),
			code: form.get("code"),
		};
		try {
			if (editItem) {
				await dispatch(updateDepartment({ id: editItem.id, data })).unwrap();
				toast.success(t("dep_updated"));
			} else {
				await dispatch(createDepartment(data)).unwrap();
				toast.success(t("dep_added"));
			}
			closeForm();
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const handleDelete = async () => {
		try {
			await dispatch(deleteDepartment(deleteId)).unwrap();
			toast.success(t("dep_deleted"));
			setDeleteId(null);
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	return (
		<div>
			<PageHeader title={t("departments_title")} description={t("departments_desc")}>
				<Button onClick={openCreate} className="gap-2">
					<Plus className="w-4 h-4" /> {t("add")}
				</Button>
			</PageHeader>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
				</div>
			) : departments.length === 0 ? (
				<EmptyState title={t("no_departments")} />
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{departments.map((d) => (
						<div key={d.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow">
							<div className="flex items-start justify-between">
								<div>
									<h3 className="font-semibold">{d.name}</h3>
									{d.code && (
										<p className="text-xs text-muted-foreground mt-0.5">
											{t("code")}: {d.code}
										</p>
									)}
								</div>
							</div>
							<div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
								<Button variant="ghost" size="sm" onClick={() => openEdit(d)}>
									<Pencil className="w-3.5 h-3.5 mr-1" /> {t("edit")}
								</Button>
								<Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(d.id)}>
									<Trash2 className="w-3.5 h-3.5 mr-1" /> {t("delete")}
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Form dialog */}
			<Dialog open={showForm} onOpenChange={closeForm}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{editItem ? t("edit_department") : t("new_department")}</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label>{t("name_req")}</Label>
							<Input name="name" required defaultValue={editItem?.name || ""} />
						</div>
						<div>
							<Label>{t("code")}</Label>
							<Input name="code" defaultValue={editItem?.code || ""} />
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
