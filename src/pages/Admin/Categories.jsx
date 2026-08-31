import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { fetchTypes, createType, updateType, deleteType } from "@/features/types/typesSlice";
import { fetchCategories } from "@/features/categories/categoriesSlice";

export default function Categories() {
	const { t } = useLanguage();
	const dispatch = useDispatch();

	const { list: types, isLoading, isSaving, isDeleting } = useSelector((s) => s.types);
	const { list: categories } = useSelector((s) => s.categories);

	const [categoryFilter, setCategoryFilter] = useState("all");
	const [showForm, setShowForm] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [deleteId, setDeleteId] = useState(null);
	const [isPenalty, setIsPenalty] = useState(false);

	useEffect(() => {
		dispatch(fetchTypes());
		dispatch(fetchCategories());
	}, [dispatch]);

	const filtered = categoryFilter === "all"
		? types
		: types.filter((tp) => tp.category === categoryFilter);

	const openCreate = () => { setEditItem(null); setIsPenalty(false); setShowForm(true); };
	const openEdit = (item) => { setEditItem(item); setIsPenalty(item.is_penalty || false); setShowForm(true); };
	const closeForm = () => { setShowForm(false); setEditItem(null); setIsPenalty(false); };

	const handleSubmit = async (e) => {
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
			point_calculation_rule: form.get("point_calculation_rule") || undefined,
		};
		Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

		try {
			if (editItem) {
				await dispatch(updateType({ id: editItem.id, data })).unwrap();
				toast.success(t("category_updated") || "Yangilandi");
			} else {
				await dispatch(createType(data)).unwrap();
				toast.success(t("category_added") || "Qo'shildi");
			}
			closeForm();
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const handleDelete = async () => {
		try {
			await dispatch(deleteType(deleteId)).unwrap();
			toast.success(t("category_deleted") || "O'chirildi");
			setDeleteId(null);
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	return (
		<div>
			<PageHeader title={t("categories_title")} description={t("categories_desc")}>
				<Button onClick={openCreate} className="gap-2">
					<Plus className="w-4 h-4" /> {t("add")}
				</Button>
			</PageHeader>

			<Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="mb-6">
				<TabsList className="flex-wrap h-auto">
					<TabsTrigger value="all">{t("all")}</TabsTrigger>
					{categories.map((c) => (
						<TabsTrigger key={c.id} value={c.id}>{c.name}</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
				</div>
			) : filtered.length === 0 ? (
				<EmptyState title={t("no_categories")} />
			) : (
				<div className="bg-card border border-border rounded-xl overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border bg-muted/50">
									<th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("name")}</th>
									<th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t("category")}</th>
									<th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t("code")}</th>
									<th className="text-center px-4 py-3 font-medium text-muted-foreground">{t("score")}</th>
									<th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t("multiplier_short")}</th>
									<th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t("max_short")}</th>
									<th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t("penalty")}</th>
									<th className="text-right px-4 py-3 font-medium text-muted-foreground">{t("actions")}</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((tp) => (
									<tr key={tp.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
										<td className="px-4 py-3">
											<p className="font-medium">{tp.name}</p>
											{tp.description && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{tp.description}</p>}
										</td>
										<td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
											{tp.category_name || "—"}
										</td>
										<td className="px-4 py-3 hidden md:table-cell text-muted-foreground font-mono text-xs">
											{tp.code || "—"}
										</td>
										<td className="px-4 py-3 text-center font-semibold text-primary">
											{tp.base_points}
										</td>
										<td className="px-4 py-3 text-center hidden lg:table-cell text-muted-foreground">
											{tp.multiplier ?? "—"}x
										</td>
										<td className="px-4 py-3 text-center hidden lg:table-cell text-muted-foreground">
											{tp.max_score || "—"}
										</td>
										<td className="px-4 py-3 text-center hidden lg:table-cell">
											{tp.is_penalty && (
												<Badge variant="secondary" className="bg-red-100 text-red-700">
													{t("penalty_yes")}
												</Badge>
											)}
										</td>
										<td className="px-4 py-3 text-right">
											<div className="flex items-center justify-end gap-1">
												<Button variant="ghost" size="sm" onClick={() => openEdit(tp)}>
													<Pencil className="w-3.5 h-3.5" />
												</Button>
												<Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(tp.id)}>
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
						<DialogTitle>{editItem ? t("edit_category") : t("new_category")}</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label>{t("category")} *</Label>
							<Select name="category" defaultValue={editItem?.category || ""} required>
								<SelectTrigger><SelectValue placeholder={t("select")} /></SelectTrigger>
								<SelectContent>
									{categories.map((c) => (
										<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="col-span-2">
								<Label>{t("name_req")} *</Label>
								<Input name="name" required defaultValue={editItem?.name || ""} />
							</div>
							<div>
								<Label>{t("code")}</Label>
								<Input name="code" defaultValue={editItem?.code || ""} placeholder="KPI-001" />
							</div>
							<div>
								<Label>{t("base_score")}</Label>
								<Input name="base_points" type="number" step="0.01" defaultValue={editItem?.base_points || "0"} />
							</div>
							<div>
								<Label>{t("multiplier_field")}</Label>
								<Input name="multiplier" type="number" step="1" defaultValue={editItem?.multiplier ?? 1} />
							</div>
							<div>
								<Label>{t("max_score")}</Label>
								<Input name="max_score" type="number" step="0.01" defaultValue={editItem?.max_score || ""} />
							</div>
							<div className="col-span-2">
								<Label>{t("description")}</Label>
								<Textarea name="description" rows={2} defaultValue={editItem?.description || ""} />
							</div>
							<div className="col-span-2">
								<Label>{t("point_calculation_rule") || "Hisoblash qoidasi"}</Label>
								<Input name="point_calculation_rule" defaultValue={editItem?.point_calculation_rule || ""} />
							</div>
							<div className="col-span-2 flex items-center gap-3">
								<Switch checked={isPenalty} onCheckedChange={setIsPenalty} id="is_penalty" />
								<Label htmlFor="is_penalty" className="cursor-pointer">{t("is_penalty")}</Label>
							</div>
						</div>
						<div className="flex justify-end gap-3 pt-2">
							<Button type="button" variant="outline" onClick={closeForm}>{t("cancel")}</Button>
							<Button type="submit" disabled={isSaving}>
								{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
								{t("save")}
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
