import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useLanguage } from "@/context/LanguageContext";
import { Shield, Plus, Pencil, Trash2, Check, Loader2, Globe, Building2 } from "lucide-react";
import { toast } from "sonner";
import { fetchRoles, createRole, updateRole, deleteRole } from "@/features/roles/rolesSlice";
import { fetchPermissions } from "@/features/permissions/permissionsSlice";

export default function RolesTab() {
	const { t } = useLanguage();
	const dispatch = useDispatch();
	const { list: roles, isLoading, isSaving, isDeleting } = useSelector((s) => s.roles);
	const { list: permissions } = useSelector((s) => s.permissions);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState(null);
	const [name, setName] = useState("");
	const [desc, setDesc] = useState("");
	const [scope, setScope] = useState("global");
	const [isAdmin, setIsAdmin] = useState(false);
	const [selectedCodes, setSelectedCodes] = useState([]);
	const [deleteTarget, setDeleteTarget] = useState(null);

	useEffect(() => {
		dispatch(fetchRoles());
		dispatch(fetchPermissions());
	}, [dispatch]);

	const openCreate = () => {
		setEditing(null);
		setName("");
		setDesc("");
		setScope("global");
		setIsAdmin(false);
		setSelectedCodes([]);
		setDialogOpen(true);
	};

	const openEdit = (role) => {
		setEditing(role);
		setName(role.name);
		setDesc(role.description || "");
		setScope(role.scope || "global");
		setIsAdmin(role.is_admin || false);
		setSelectedCodes((role.permissions || []).map((p) => p.codename));
		setDialogOpen(true);
	};

	const toggleCode = (codename) => {
		setSelectedCodes((prev) =>
			prev.includes(codename) ? prev.filter((c) => c !== codename) : [...prev, codename]
		);
	};

	const buildPayload = () => {
		const permission_ids = permissions
			.filter((p) => selectedCodes.includes(p.codename))
			.map((p) => p.id)
			.filter(Boolean);
		return { name, description: desc, scope, is_admin: isAdmin, permission_ids };
	};

	const handleSave = async () => {
		try {
			if (editing) {
				await dispatch(updateRole({ id: editing.id, data: buildPayload() })).unwrap();
				toast.success(t("updated_successfully"));
			} else {
				await dispatch(createRole(buildPayload())).unwrap();
				toast.success(t("created_successfully"));
			}
			setDialogOpen(false);
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const handleDelete = async () => {
		try {
			await dispatch(deleteRole(deleteTarget.id)).unwrap();
			toast.success(t("deleted_successfully"));
			setDeleteTarget(null);
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">{t("roles_desc")}</p>
				<Button size="sm" onClick={openCreate}>
					<Plus className="w-4 h-4 mr-1" />
					{t("add")}
				</Button>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-10">
					<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
				</div>
			) : roles.length === 0 ? (
				<div className="flex flex-col items-center py-10 text-muted-foreground">
					<Shield className="w-10 h-10 mb-3" />
					<p className="text-sm">{t("no_roles")}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{roles.map((role) => (
						<div
							key={role.id}
							className="flex items-start justify-between p-4 rounded-lg border border-border bg-muted/30"
						>
							<div className="flex items-start gap-3">
								<div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
									<Shield className="w-5 h-5" />
								</div>
								<div className="min-w-0">
									<div className="flex items-center gap-1.5 flex-wrap">
										<p className="font-semibold text-sm">{role.name}</p>
										<Badge variant="outline" className="text-xs capitalize">
											{role.scope === "global" ? (
												<Globe className="w-3 h-3 mr-1" />
											) : (
												<Building2 className="w-3 h-3 mr-1" />
											)}
											{role.scope}
										</Badge>
										{role.is_admin && (
											<Badge className="text-xs bg-amber-500/10 text-amber-600 border border-amber-300">
												Admin
											</Badge>
										)}
									</div>
									<p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
										{role.description}
									</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										{(role.permissions || []).length} {t("permissions_count")}
									</p>
								</div>
							</div>
							<div className="flex gap-1 shrink-0 ml-2">
								<Button variant="ghost" size="icon" onClick={() => openEdit(role)}>
									<Pencil className="w-4 h-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="text-destructive"
									onClick={() => setDeleteTarget(role)}
								>
									<Trash2 className="w-4 h-4" />
								</Button>
							</div>
						</div>
					))}
				</div>
			)}

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editing ? t("edit_role") : t("add_role")}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
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
						<div>
							<Label>{t("scope")}</Label>
							<select
								value={scope}
								onChange={(e) => setScope(e.target.value)}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mt-1 focus:outline-none focus:ring-1 focus:ring-ring"
							>
								<option value="global">Global</option>
								<option value="department">Department</option>
							</select>
						</div>
						<div className="flex items-center gap-2">
							<Checkbox
								id="is_admin"
								checked={isAdmin}
								onCheckedChange={(c) => setIsAdmin(!!c)}
							/>
							<Label htmlFor="is_admin" className="cursor-pointer font-normal">
								{t("is_admin")}
							</Label>
						</div>
						<div>
							<Label className="mb-2 block">{t("permissions")}</Label>
							<div className="space-y-2 max-h-52 overflow-y-auto pr-1 border border-border rounded-md p-3">
								{permissions.length === 0 ? (
									<p className="text-xs text-muted-foreground text-center py-2">
										<Loader2 className="w-4 h-4 animate-spin inline mr-1" />
										{t("loading")}...
									</p>
								) : (
									permissions.map((p) => (
										<div key={p.codename} className="flex items-start gap-2">
											<Checkbox
												id={`perm-${p.codename}`}
												checked={selectedCodes.includes(p.codename)}
												onCheckedChange={() => toggleCode(p.codename)}
												className="mt-0.5"
											/>
											<div>
												<Label
													htmlFor={`perm-${p.codename}`}
													className="text-sm cursor-pointer font-normal"
												>
													{p.name}
												</Label>
												{p.description && (
													<p className="text-xs text-muted-foreground">{p.description}</p>
												)}
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={handleSave} disabled={!name.trim() || isSaving}>
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
							{t("delete_role_desc", deleteTarget?.name)}
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
