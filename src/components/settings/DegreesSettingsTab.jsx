import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useLanguage } from "@/context/LanguageContext";
import { GraduationCap, Plus, Pencil, Trash2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchDegrees, createDegree, updateDegree, deleteDegree } from "@/features/degrees/degreesSlice";
import { fetchTitles, createTitle, updateTitle, deleteTitle } from "@/features/titles/titlesSlice";

function CatalogPanel({ icon, heading, items, isLoading, onAdd, onEdit, onDelete }) {
	return (
		<div className="bg-muted/30 border border-border rounded-lg p-4">
			<div className="flex items-center justify-between mb-3">
				<h5 className="font-semibold text-sm flex items-center gap-2">
					{icon}
					{heading}
				</h5>
				<Button variant="ghost" size="icon" onClick={onAdd}>
					<Plus className="w-4 h-4" />
				</Button>
			</div>
			{isLoading ? (
				<div className="flex justify-center py-4">
					<div className="w-5 h-5 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
				</div>
			) : (
				<div className="space-y-2">
					{items.length === 0 && (
						<p className="text-xs text-muted-foreground text-center py-2">—</p>
					)}
					{items.map((item) => (
						<div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
							<p className="text-sm font-medium">{item.title}</p>
							<div className="flex gap-1">
								<Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
									<Pencil className="w-4 h-4" />
								</Button>
								<Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(item)}>
									<Trash2 className="w-4 h-4" />
								</Button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default function DegreesSettingsTab() {
	const { t } = useLanguage();
	const dispatch = useDispatch();

	const { list: degrees, isLoading: degreesLoading, isSaving: degreesSaving, isDeleting: degreesDeleting } = useSelector((s) => s.degrees);
	const { list: titles, isLoading: titlesLoading, isSaving: titlesSaving, isDeleting: titlesDeleting } = useSelector((s) => s.titles);

	const [open, setOpen] = useState(false);
	const [type, setType] = useState("degree");
	const [editing, setEditing] = useState(null);
	const [titleValue, setTitleValue] = useState("");

	const [deleteTarget, setDeleteTarget] = useState(null);
	const [deleteType, setDeleteType] = useState("degree");

	useEffect(() => {
		dispatch(fetchDegrees());
		dispatch(fetchTitles());
	}, [dispatch]);

	const openCreate = (entityType) => {
		setType(entityType); setEditing(null); setTitleValue(""); setOpen(true);
	};
	const openEdit = (entityType, item) => {
		setType(entityType); setEditing(item); setTitleValue(item.title); setOpen(true);
	};

	const handleSave = async () => {
		if (!titleValue.trim()) return;
		const data = { title: titleValue.trim() };
		try {
			if (type === "degree") {
				if (editing) {
					await dispatch(updateDegree({ id: editing.id, data })).unwrap();
					toast.success(t("degree_updated") || "Yangilandi");
				} else {
					await dispatch(createDegree(data)).unwrap();
					toast.success(t("degree_added") || "Qo'shildi");
				}
			} else {
				if (editing) {
					await dispatch(updateTitle({ id: editing.id, data })).unwrap();
					toast.success(t("title_updated") || "Yangilandi");
				} else {
					await dispatch(createTitle(data)).unwrap();
					toast.success(t("title_added") || "Qo'shildi");
				}
			}
			setOpen(false);
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const handleDelete = async () => {
		try {
			if (deleteType === "degree") {
				await dispatch(deleteDegree(deleteTarget.id)).unwrap();
				toast.success(t("degree_deleted") || "O'chirildi");
			} else {
				await dispatch(deleteTitle(deleteTarget.id)).unwrap();
				toast.success(t("title_deleted") || "O'chirildi");
			}
			setDeleteTarget(null);
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const isSaving = type === "degree" ? degreesSaving : titlesSaving;
	const isDeleting = deleteType === "degree" ? degreesDeleting : titlesDeleting;

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">{t("degrees_settings_desc")}</p>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<CatalogPanel
					icon={<GraduationCap className="w-4 h-4 text-primary" />}
					heading={t("academic_degrees")}
					items={degrees}
					isLoading={degreesLoading}
					isSaving={degreesSaving}
					isDeleting={degreesDeleting}
					onAdd={() => openCreate("degree")}
					onEdit={(item) => openEdit("degree", item)}
					onDelete={(item) => { setDeleteTarget(item); setDeleteType("degree"); }}
				/>
				<CatalogPanel
					icon={<GraduationCap className="w-4 h-4 text-primary" />}
					heading={t("academic_ranks")}
					items={titles}
					isLoading={titlesLoading}
					isSaving={titlesSaving}
					isDeleting={titlesDeleting}
					onAdd={() => openCreate("title")}
					onEdit={(item) => openEdit("title", item)}
					onDelete={(item) => { setDeleteTarget(item); setDeleteType("title"); }}
				/>
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editing ? t("edit_item") : t("add_item")} — {type === "degree" ? t("academic_degree_sg") : t("academic_rank_sg")}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label>{t("name_field")}</Label>
							<Input value={titleValue} onChange={(e) => setTitleValue(e.target.value)} placeholder="PhD, DSc, Docent..." />
						</div>
					</div>
					<DialogFooter>
						<Button onClick={handleSave} disabled={!titleValue.trim() || isSaving}>
							{isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
							{t("save")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("delete_item")}</AlertDialogTitle>
						<AlertDialogDescription>{t("delete_item_desc", deleteTarget?.title)}</AlertDialogDescription>
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
