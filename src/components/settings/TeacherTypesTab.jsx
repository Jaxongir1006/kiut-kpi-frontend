import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useLanguage } from "@/context/LanguageContext";
import { Briefcase, Plus, Pencil, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

export default function TeacherTypesTab() {
	const { t } = useLanguage();
	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [name, setName] = useState("");
	const [desc, setDesc] = useState("");
	const [deleteTarget, setDeleteTarget] = useState(null);

	const [types, setTypes] = useState([]);

	const saveMutation = { mutate: () => {} };
	const deleteMutation = { mutate: () => {} };

	const openCreate = () => { setEditing(null); setName(""); setDesc(""); setOpen(true); };
	const openEdit = (t) => { setEditing(t); setName(t.name); setDesc(t.description || ""); setOpen(true); };

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">{t("teacher_types_desc")}</p>
				<Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />{t("add")}</Button>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{types.map(item => (
					<div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Briefcase className="w-5 h-5" /></div>
							<div>
								<p className="font-semibold text-sm">{item.name}</p>
								{item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
							</div>
						</div>
						<div className="flex gap-1">
							<Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button>
							<Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(item)}><Trash2 className="w-4 h-4" /></Button>
						</div>
					</div>
				))}
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader><DialogTitle>{editing ? t("edit_type") : t("add_type")}</DialogTitle></DialogHeader>
					<div className="space-y-3"><div><Label>{t("name_field")}</Label><Input value={name} onChange={e => setName(e.target.value)} /></div><div><Label>{t("description")}</Label><Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} /></div></div>
					<DialogFooter><Button onClick={() => saveMutation.mutate({ name, description: desc })} disabled={!name}><Check className="w-4 h-4 mr-1" />{t("save")}</Button></DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader><AlertDialogTitle>{t("delete_type")}</AlertDialogTitle><AlertDialogDescription>{t("delete_type_desc", deleteTarget?.name)}</AlertDialogDescription></AlertDialogHeader>
					<AlertDialogFooter><AlertDialogCancel>{t("cancel")}</AlertDialogCancel><AlertDialogAction className="bg-destructive" onClick={() => deleteMutation.mutate(deleteTarget.id)}>{t("delete")}</AlertDialogAction></AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}