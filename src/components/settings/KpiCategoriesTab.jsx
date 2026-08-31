import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useLanguage } from "@/context/LanguageContext";
import { Plus, Pencil, Trash2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchTypes, createType, updateType, deleteType } from "@/features/types/typesSlice";
import { fetchCategories } from "@/features/categories/categoriesSlice";

export default function KpiCategoriesTab() {
	const { t } = useLanguage();
	const dispatch = useDispatch();

	const { list: types, isLoading, isSaving, isDeleting } = useSelector((s) => s.types);
	const { list: categories } = useSelector((s) => s.categories);

	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [isPenalty, setIsPenalty] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState(null);

	useEffect(() => {
		dispatch(fetchTypes());
		dispatch(fetchCategories());
	}, [dispatch]);

	const openCreate = () => { setEditing(null); setIsPenalty(false); setOpen(true); };
	const openEdit = (item) => { setEditing(item); setIsPenalty(item.is_penalty || false); setOpen(true); };

	const handleSave = async (e) => {
		e.preventDefault();
		const form = new FormData(e.target);
		const data = {
			category: form.get("category"),
			name: form.get("name"),
			description: form.get("description") || undefined,
			code: form.get("code") || undefined,
			base_points: form.get("base_points") || "0",
			is_penalty: isPenalty,
			multiplier: Number(form.get("multiplier")) || 1,
			max_score: form.get("max_score") || undefined,
		};
		Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

		try {
			if (editing) {
				await dispatch(updateType({ id: editing.id, data })).unwrap();
				toast.success(t("category_updated") || "Yangilandi");
			} else {
				await dispatch(createType(data)).unwrap();
				toast.success(t("category_added") || "Qo'shildi");
			}
			setOpen(false);
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const handleDelete = async () => {
		try {
			await dispatch(deleteType(deleteTarget.id)).unwrap();
			toast.success(t("category_deleted") || "O'chirildi");
			setDeleteTarget(null);
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const grouped = categories.map((cat) => ({
		...cat,
		items: types.filter((tp) => tp.category === cat.id),
	})).filter((g) => g.items.length > 0);

	const ungrouped = types.filter((tp) => !categories.some((c) => c.id === tp.category));

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">{t("categories_settings_desc")}</p>
				<Button size="sm" onClick={openCreate}>
					<Plus className="w-4 h-4 mr-1" />{t("add")}
				</Button>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-8">
					<div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
				</div>
			) : (
				<div className="space-y-4">
					{grouped.map((group) => (
						<div key={group.id}>
							<h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{group.name}</h5>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
								{group.items.map((tp) => (
									<div key={tp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
										<div className="min-w-0">
											<span className="text-sm font-medium block truncate">{tp.name}</span>
											<span className="text-xs text-muted-foreground">
												{tp.base_points} ball × {tp.multiplier ?? 1} | max {tp.max_score || "—"}
											</span>
										</div>
										<div className="flex gap-1 shrink-0 ml-2">
											<Button variant="ghost" size="icon" onClick={() => openEdit(tp)}><Pencil className="w-4 h-4" /></Button>
											<Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(tp)}><Trash2 className="w-4 h-4" /></Button>
										</div>
									</div>
								))}
							</div>
						</div>
					))}
					{ungrouped.length > 0 && (
						<div>
							<h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("other") || "Boshqa"}</h5>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
								{ungrouped.map((tp) => (
									<div key={tp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
										<span className="text-sm font-medium truncate">{tp.name}</span>
										<div className="flex gap-1 shrink-0 ml-2">
											<Button variant="ghost" size="icon" onClick={() => openEdit(tp)}><Pencil className="w-4 h-4" /></Button>
											<Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(tp)}><Trash2 className="w-4 h-4" /></Button>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
					{types.length === 0 && (
						<p className="text-sm text-muted-foreground text-center py-4">{t("no_categories")}</p>
					)}
				</div>
			)}

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editing ? t("edit_category") : t("add_category")}</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSave} className="space-y-3">
						<div>
							<Label>{t("category")}</Label>
							<Select name="category" defaultValue={editing?.category || ""}>
								<SelectTrigger><SelectValue placeholder={t("select")} /></SelectTrigger>
								<SelectContent>
									{categories.map((c) => (
										<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div><Label>{t("name_field")}</Label><Input name="name" required defaultValue={editing?.name || ""} /></div>
						<div><Label>{t("code")}</Label><Input name="code" defaultValue={editing?.code || ""} /></div>
						<div className="grid grid-cols-3 gap-3">
							<div><Label>{t("base_score")}</Label><Input name="base_points" type="number" step="0.01" defaultValue={editing?.base_points || "0"} /></div>
							<div><Label>{t("multiplier_field")}</Label><Input name="multiplier" type="number" defaultValue={editing?.multiplier ?? 1} /></div>
							<div><Label>{t("max_score")}</Label><Input name="max_score" type="number" step="0.01" defaultValue={editing?.max_score || ""} /></div>
						</div>
						<div><Label>{t("description")}</Label><Textarea name="description" rows={2} defaultValue={editing?.description || ""} /></div>
						<div className="flex items-center gap-2">
							<Switch checked={isPenalty} onCheckedChange={setIsPenalty} id="kpi_is_penalty" />
							<Label htmlFor="kpi_is_penalty">{t("is_penalty")}</Label>
						</div>
						<DialogFooter>
							<Button type="submit" disabled={isSaving}>
								{isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
								{t("save")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("delete_category")}</AlertDialogTitle>
						<AlertDialogDescription>{t("delete_category_desc", deleteTarget?.name)}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive hover:bg-destructive/90"
							disabled={isDeleting}
							onClick={handleDelete}
						>
							{isDeleting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
							{t("delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
