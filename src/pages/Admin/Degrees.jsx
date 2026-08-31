import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { fetchDegrees, createDegree, updateDegree, deleteDegree } from "@/features/degrees/degreesSlice";
import { fetchTitles, createTitle, updateTitle, deleteTitle } from "@/features/titles/titlesSlice";

function CatalogTable({ items, isLoading, onEdit, onDelete, t }) {
	if (isLoading) return (
		<div className="flex justify-center py-16">
			<div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
		</div>
	);
	if (items.length === 0) return <EmptyState title={t("no_data")} />;
	return (
		<div className="bg-card border border-border rounded-xl overflow-hidden">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-border bg-muted/50">
						<th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("name")}</th>
						<th className="text-right px-4 py-3 font-medium text-muted-foreground">{t("actions")}</th>
					</tr>
				</thead>
				<tbody>
					{items.map((item) => (
						<tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
							<td className="px-4 py-3 font-medium">{item.title}</td>
							<td className="px-4 py-3 text-right">
								<div className="flex items-center justify-end gap-1">
									<Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
										<Pencil className="w-3.5 h-3.5" />
									</Button>
									<Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(item.id)}>
										<Trash2 className="w-3.5 h-3.5" />
									</Button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default function Degrees() {
	const { t } = useLanguage();
	const dispatch = useDispatch();

	const { list: degrees, isLoading: degreesLoading, isSaving: degreesSaving, isDeleting: degreesDeleting } = useSelector((s) => s.degrees);
	const { list: titles, isLoading: titlesLoading, isSaving: titlesSaving, isDeleting: titlesDeleting } = useSelector((s) => s.titles);

	const [tab, setTab] = useState("degrees");
	const [showForm, setShowForm] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [deleteId, setDeleteId] = useState(null);

	useEffect(() => {
		dispatch(fetchDegrees());
		dispatch(fetchTitles());
	}, [dispatch]);

	const isDegreeTab = tab === "degrees";
	const isSaving = isDegreeTab ? degreesSaving : titlesSaving;
	const isDeleting = isDegreeTab ? degreesDeleting : titlesDeleting;

	const openCreate = () => { setEditItem(null); setShowForm(true); };
	const openEdit = (item) => { setEditItem(item); setShowForm(true); };
	const closeForm = () => { setShowForm(false); setEditItem(null); };

	const handleSubmit = async (e) => {
		e.preventDefault();
		const form = new FormData(e.target);
		const data = { title: form.get("title") };
		try {
			if (isDegreeTab) {
				if (editItem) {
					await dispatch(updateDegree({ id: editItem.id, data })).unwrap();
					toast.success(t("degree_updated") || "Yangilandi");
				} else {
					await dispatch(createDegree(data)).unwrap();
					toast.success(t("degree_added") || "Qo'shildi");
				}
			} else {
				if (editItem) {
					await dispatch(updateTitle({ id: editItem.id, data })).unwrap();
					toast.success(t("title_updated") || "Yangilandi");
				} else {
					await dispatch(createTitle(data)).unwrap();
					toast.success(t("title_added") || "Qo'shildi");
				}
			}
			closeForm();
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const handleDelete = async () => {
		try {
			if (isDegreeTab) {
				await dispatch(deleteDegree(deleteId)).unwrap();
				toast.success(t("degree_deleted") || "O'chirildi");
			} else {
				await dispatch(deleteTitle(deleteId)).unwrap();
				toast.success(t("title_deleted") || "O'chirildi");
			}
			setDeleteId(null);
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	return (
		<div>
			<PageHeader title={t("degrees_title")} description={t("degrees_desc")}>
				<Button onClick={openCreate} className="gap-2">
					<Plus className="w-4 h-4" /> {t("add")}
				</Button>
			</PageHeader>

			<Tabs value={tab} onValueChange={(v) => { setTab(v); setEditItem(null); }} className="mb-6">
				<TabsList>
					<TabsTrigger value="degrees">{t("degrees_tab")}</TabsTrigger>
					<TabsTrigger value="ranks">{t("ranks_tab")}</TabsTrigger>
				</TabsList>
			</Tabs>

			{isDegreeTab ? (
				<CatalogTable items={degrees} isLoading={degreesLoading} onEdit={openEdit} onDelete={setDeleteId} t={t} />
			) : (
				<CatalogTable items={titles} isLoading={titlesLoading} onEdit={openEdit} onDelete={setDeleteId} t={t} />
			)}

			<Dialog open={showForm} onOpenChange={closeForm}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{editItem
								? t("edit")
								: isDegreeTab ? t("new_degree") : t("new_rank")}
						</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label>{t("name_req")}</Label>
							<Input name="title" required defaultValue={editItem?.title || ""} placeholder="PhD, DSc, Docent..." />
						</div>
						<div className="flex justify-end gap-3">
							<Button type="button" variant="outline" onClick={closeForm}>{t("cancel")}</Button>
							<Button type="submit" disabled={isSaving}>
								{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
								{t("save")}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

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
