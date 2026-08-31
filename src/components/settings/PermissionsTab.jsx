import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Shield, Check, X, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchRoles } from "@/features/roles/rolesSlice";
import {
	fetchPermissions,
	createPermission,
	updatePermission,
	deletePermission,
} from "@/features/permissions/permissionsSlice";

export default function PermissionsTab() {
	const { t } = useLanguage();
	const dispatch = useDispatch();
	const { list: roles } = useSelector((s) => s.roles);
	const { list: permissions, isLoading, isSaving, isDeleting } = useSelector((s) => s.permissions);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [codename, setCodename] = useState("");
	const [name, setName] = useState("");
	const [desc, setDesc] = useState("");
	const [deleteTarget, setDeleteTarget] = useState(null);

	useEffect(() => {
		dispatch(fetchPermissions());
		dispatch(fetchRoles());
	}, [dispatch]);

	const openCreate = () => {
		setEditing(null);
		setCodename("");
		setName("");
		setDesc("");
		setDialogOpen(true);
	};

	const openEdit = (perm) => {
		setEditing(perm);
		setCodename(perm.codename);
		setName(perm.name);
		setDesc(perm.description || "");
		setDialogOpen(true);
	};

	const handleSave = async () => {
		const payload = { codename, name, description: desc };
		try {
			if (editing) {
				const id = editing.id || editing.codename;
				await dispatch(updatePermission({ id, data: payload })).unwrap();
				toast.success(t("updated_successfully"));
			} else {
				await dispatch(createPermission(payload)).unwrap();
				toast.success(t("created_successfully"));
			}
			setDialogOpen(false);
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const handleDelete = async () => {
		try {
			const id = deleteTarget.id || deleteTarget.codename;
			await dispatch(deletePermission(id)).unwrap();
			toast.success(t("deleted_successfully"));
			setDeleteTarget(null);
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const roleHasPerm = (role, cod) =>
		(role.permissions || []).some((p) => p.codename === cod);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">{t("permissions_desc")}</p>
				<Button size="sm" onClick={openCreate}>
					<Plus className="w-4 h-4 mr-1" />
					{t("add")}
				</Button>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-10">
					<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
				</div>
			) : permissions.length === 0 ? (
				<div className="flex flex-col items-center py-8 text-muted-foreground">
					<Shield className="w-10 h-10 mb-3" />
					<p className="text-sm">{t("no_roles")}</p>
					<p className="text-xs mt-1">{t("no_roles_desc")}</p>
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full text-sm border border-border rounded-lg">
						<thead>
							<tr className="bg-muted/50 border-b border-border">
								<th className="text-left px-3 py-2 font-medium text-muted-foreground min-w-[200px]">
									{t("permission")}
								</th>
								{roles.map((r) => (
									<th
										key={r.id}
										className="text-center px-3 py-2 font-medium text-muted-foreground whitespace-nowrap"
									>
										{r.name}
									</th>
								))}
								<th className="text-right px-3 py-2 font-medium text-muted-foreground w-20">
									{t("actions")}
								</th>
							</tr>
						</thead>
						<tbody>
							{permissions.map((p) => (
								<tr
									key={p.codename}
									className="border-b border-border last:border-0 hover:bg-muted/30"
								>
									<td className="px-3 py-2.5">
										<p className="font-medium text-sm">{p.name}</p>
										<p className="text-xs text-muted-foreground font-mono">{p.codename}</p>
										{p.description && (
											<p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
										)}
									</td>
									{roles.map((r) => (
										<td key={r.id} className="text-center px-3 py-2.5">
											{roleHasPerm(r, p.codename) ? (
												<Check className="w-4 h-4 text-emerald-500 mx-auto" />
											) : (
												<X className="w-4 h-4 text-red-400 mx-auto" />
											)}
										</td>
									))}
									<td className="px-3 py-2.5">
										<div className="flex gap-1 justify-end">
											<Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
												<Pencil className="w-4 h-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="text-destructive"
												onClick={() => setDeleteTarget(p)}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>
							{editing ? t("edit_permission") : t("add_permission")}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>Codename</Label>
							<Input
								className="mt-1 font-mono"
								value={codename}
								onChange={(e) => setCodename(e.target.value)}
								placeholder="view_teachers"
								disabled={!!editing}
							/>
						</div>
						<div>
							<Label>{t("role_name")}</Label>
							<Input
								className="mt-1"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder={t("role_name")}
							/>
						</div>
						<div>
							<Label>{t("description")}</Label>
							<Textarea
								className="mt-1"
								value={desc}
								onChange={(e) => setDesc(e.target.value)}
								rows={2}
								placeholder={t("description")}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={handleSave} disabled={!codename.trim() || !name.trim() || isSaving}>
							{isSaving ? (
								<Loader2 className="w-4 h-4 mr-1 animate-spin" />
							) : (
								<Check className="w-4 h-4 mr-1" />
							)}
							{t("save")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("delete_role")}</AlertDialogTitle>
						<AlertDialogDescription>
							<span className="font-semibold">{deleteTarget?.name}</span>{" "}
							{t("delete_role_desc")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={handleDelete}
							disabled={isDeleting}
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
