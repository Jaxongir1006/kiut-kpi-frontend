import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "@/features/categories/categoriesSlice";

const DOMAINS = [
	{ value: "academic", label: "Akademik" },
	{ value: "scientific", label: "Ilmiy" },
	{ value: "social", label: "Ijtimoiy" },
	{ value: "administrative", label: "Ma'muriy" },
];

export default function Groups() {
	const { t } = useLanguage();
	const dispatch = useDispatch();

	const { list: categories, isLoading, isSaving, isDeleting } = useSelector((s) => s.categories);

	const [domainFilter, setDomainFilter] = useState("all");
	const [showForm, setShowForm] = useState(false);
	const [editItem, setEditItem] = useState(null);
	const [deleteId, setDeleteId] = useState(null);

	useEffect(() => {
		dispatch(fetchCategories());
	}, [dispatch]);

	const filtered = domainFilter === "all"
		? categories
		: categories.filter((c) => c.domain === domainFilter);

	const openCreate = () => { setEditItem(null); setShowForm(true); };
	const openEdit = (item) => { setEditItem(item); setShowForm(true); };
	const closeForm = () => { setShowForm(false); setEditItem(null); };

	const handleSubmit = async (e) => {
		e.preventDefault();
		const form = new FormData(e.target);
		const data = {
			domain: form.get("domain"),
			name: form.get("name"),
			description: form.get("description") || undefined,
		};
		Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

		try {
			if (editItem) {
				await dispatch(updateCategory({ id: editItem.id, data })).unwrap();
				toast.success(t("group_updated") || "Yangilandi");
			} else {
				await dispatch(createCategory(data)).unwrap();
				toast.success(t("group_added") || "Qo'shildi");
			}
			closeForm();
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const handleDelete = async () => {
		try {
			await dispatch(deleteCategory(deleteId)).unwrap();
			toast.success(t("group_deleted") || "O'chirildi");
			setDeleteId(null);
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const getDomainLabel = (domain) => DOMAINS.find((d) => d.value === domain)?.label || domain;

	const domainColors = {
		academic: "bg-blue-100 text-blue-700",
		scientific: "bg-purple-100 text-purple-700",
		social: "bg-green-100 text-green-700",
		administrative: "bg-orange-100 text-orange-700",
	};

	return (
		<div>
			<PageHeader title={t("groups_title") || "KPI Guruhlari"} description={t("groups_desc") || "Kategoriyalar guruhlarini boshqarish"}>
				<Button onClick={openCreate} className="gap-2">
					<Plus className="w-4 h-4" /> {t("add")}
				</Button>
			</PageHeader>

			<Tabs value={domainFilter} onValueChange={setDomainFilter} className="mb-6">
				<TabsList>
					<TabsTrigger value="all">{t("all")}</TabsTrigger>
					{DOMAINS.map((d) => (
						<TabsTrigger key={d.value} value={d.value}>{d.label}</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
				</div>
			) : filtered.length === 0 ? (
				<EmptyState title={t("no_groups") || "Guruhlar yo'q"} />
			) : (
				<div className="bg-card border border-border rounded-xl overflow-hidden">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border bg-muted/50">
								<th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("name")}</th>
								<th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t("domain") || "Soha"}</th>
								<th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t("description")}</th>
								<th className="text-right px-4 py-3 font-medium text-muted-foreground">{t("actions")}</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map((cat) => (
								<tr key={cat.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
									<td className="px-4 py-3 font-medium">{cat.name}</td>
									<td className="px-4 py-3 hidden md:table-cell">
										<Badge variant="secondary" className={domainColors[cat.domain] || "bg-gray-100 text-gray-600"}>
											{getDomainLabel(cat.domain)}
										</Badge>
									</td>
									<td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs truncate max-w-xs">
										{cat.description || "—"}
									</td>
									<td className="px-4 py-3 text-right">
										<div className="flex items-center justify-end gap-1">
											<Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
												<Pencil className="w-3.5 h-3.5" />
											</Button>
											<Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(cat.id)}>
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

			{/* Form Dialog */}
			<Dialog open={showForm} onOpenChange={closeForm}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{editItem ? t("edit_group") || "Guruhni tahrirlash" : t("new_group") || "Yangi guruh"}</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label>{t("name_req")} *</Label>
							<Input name="name" required defaultValue={editItem?.name || ""} />
						</div>
						<div>
							<Label>{t("domain") || "Soha"} *</Label>
							<Select name="domain" defaultValue={editItem?.domain || "academic"} required>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									{DOMAINS.map((d) => (
										<SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("description")}</Label>
							<Textarea name="description" rows={3} defaultValue={editItem?.description || ""} />
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
