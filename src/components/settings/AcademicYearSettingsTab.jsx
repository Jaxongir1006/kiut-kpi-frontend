import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useLanguage } from "@/context/LanguageContext";
import { Calendar, Plus, Pencil, Trash2, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
	fetchYears,
	createYear,
	updateYear,
	deleteYear,
} from "@/features/academicYears/academicYearsSlice";

export default function AcademicYearSettingsTab() {
	const { t } = useLanguage();
	const dispatch = useDispatch();
	const { list: years, isLoading, isSaving, isDeleting } = useSelector((s) => s.academicYears);

	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [name, setName] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [deleteTarget, setDeleteTarget] = useState(null);

	useEffect(() => {
		dispatch(fetchYears());
	}, [dispatch]);

	const openCreate = () => {
		setEditing(null); setName(""); setStartDate(""); setEndDate(""); setIsActive(true); setOpen(true);
	};
	const openEdit = (y) => {
		setEditing(y); setName(y.name); setStartDate(y.start_date || ""); setEndDate(y.end_date || ""); setIsActive(y.is_active); setOpen(true);
	};

	const handleSave = async () => {
		if (!name) return;
		const data = { name, start_date: startDate || null, end_date: endDate || null, is_active: isActive };
		try {
			if (editing) {
				await dispatch(updateYear({ id: editing.id, data })).unwrap();
				toast.success(t("year_updated"));
			} else {
				await dispatch(createYear(data)).unwrap();
				toast.success(t("year_added"));
			}
			setOpen(false);
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const handleToggleActive = async (y) => {
		try {
			await dispatch(updateYear({ id: y.id, data: { is_active: !y.is_active } })).unwrap();
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const handleDelete = async () => {
		try {
			await dispatch(deleteYear(deleteTarget.id)).unwrap();
			toast.success(t("year_deleted"));
			setDeleteTarget(null);
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">{t("academic_year_settings_desc")}</p>
				<Button size="sm" onClick={openCreate}>
					<Plus className="w-4 h-4 mr-1" />{t("add")}
				</Button>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-8">
					<div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
				</div>
			) : (
				<div className="bg-card border border-border rounded-lg divide-y divide-border">
					{years.length === 0 ? (
						<div className="p-4 text-sm text-muted-foreground text-center">{t("no_years")}</div>
					) : years.map((y) => (
						<div key={y.id} className="flex items-center justify-between p-3">
							<div className="flex items-center gap-3">
								<Calendar className="w-4 h-4 text-muted-foreground" />
								<div>
									<p className="font-medium text-sm">{y.name}</p>
									<p className="text-xs text-muted-foreground">
										{y.start_date ? format(new Date(y.start_date), "dd.MM.yyyy") : "—"} — {y.end_date ? format(new Date(y.end_date), "dd.MM.yyyy") : "—"}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Badge
									variant="secondary"
									className={y.is_active ? "bg-emerald-100 text-emerald-700 cursor-pointer" : "bg-gray-100 text-gray-600 cursor-pointer"}
									onClick={() => handleToggleActive(y)}
								>
									{y.is_active ? t("active") : t("inactive")}
								</Badge>
								<Button variant="ghost" size="icon" onClick={() => openEdit(y)}>
									<Pencil className="w-4 h-4" />
								</Button>
								<Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(y)}>
									<Trash2 className="w-4 h-4" />
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{editing ? t("edit_year") : t("add_year")}</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<Label>{t("name_field")}</Label>
							<Input value={name} onChange={(e) => setName(e.target.value)} placeholder="2025-2026" />
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label>{t("start_date")}</Label>
								<Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
							</div>
							<div>
								<Label>{t("end_date")}</Label>
								<Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Switch checked={isActive} onCheckedChange={setIsActive} />
							<Label>{t("is_active")}</Label>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={handleSave} disabled={!name || isSaving}>
							{isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
							{t("save")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("delete_year")}</AlertDialogTitle>
						<AlertDialogDescription>{t("delete_year_desc", deleteTarget?.name)}</AlertDialogDescription>
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
