import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	Plus, Search, Pencil, Trash2, Loader2, Users,
	ShieldCheck, Copy, Check, Camera, Upload, FileSpreadsheet,
	CheckCircle2, XCircle, AlertTriangle, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProtectedAvatarImage from "@/components/shared/ProtectedAvatarImage";
import ErrorState from "@/components/shared/ErrorState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
	AlertDialog, AlertDialogAction, AlertDialogCancel,
	AlertDialogContent, AlertDialogDescription,
	AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { fetchUsers, createUser, updateUser, deleteUser, batchImportUsers } from "@/features/users/usersSlice";
import { fetchRoles } from "@/features/roles/rolesSlice";
import { fetchDepartments } from "@/features/departments/departmentsSlice";
import { useUserRole } from "@/hooks/useUserRole";

const EMPTY_FORM = {
	first_name: "", last_name: "", username: "",
	email: "", role: "", department: "",
	is_active: true, is_staff: false,
	photo: null,
};

function seedColor(str) {
	let h = 0;
	for (let i = 0; i < (str || "").length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
	return `hsl(${h},60%,48%)`;
}

function userInitials(u) {
	const fn = (u.first_name?.[0] || "").toUpperCase();
	const ln = (u.last_name?.[0] || "").toUpperCase();
	return fn + ln || (u.username?.[0] || "?").toUpperCase();
}

export default function UsersPage() {
	const dispatch = useDispatch();
	const { list: users, isLoading, isSaving, isDeleting, isImporting, error } = useSelector((s) => s.users);
	const { list: roles }       = useSelector((s) => s.roles);
	const { list: departments } = useSelector((s) => s.departments);
	const { isAdmin } = useUserRole();

	const [search, setSearch]         = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [statusFilter, setStatus]   = useState("all");
	const [showForm, setShowForm]     = useState(false);
	const [editItem, setEditItem]     = useState(null);
	const [deleteId, setDeleteId]     = useState(null);
	const [form, setForm]             = useState(EMPTY_FORM);
	const [copied, setCopied]         = useState(false);
	const [photoPreview, setPhotoPreview] = useState(null);
	const fileInputRef = useRef(null);

	const [showImport, setShowImport]       = useState(false);
	const [importFile, setImportFile]       = useState(null);
	const [importResult, setImportResult]   = useState(null);
	const [importDragging, setImportDragging] = useState(false);
	const importFileRef = useRef(null);

	useEffect(() => {
		dispatch(fetchUsers());
		if (!roles.length)       dispatch(fetchRoles());
		if (!departments.length) dispatch(fetchDepartments());
	}, [dispatch]);

	const autoPassword = form.username ? `${form.username}@2026_kiut` : "";

	const filtered = useMemo(() => {
		return users.filter((u) => {
			const q = search.toLowerCase();
			const fullName = `${u.first_name} ${u.last_name}`.trim().toLowerCase();
			if (q && !fullName.includes(q) && !u.username.toLowerCase().includes(q) && !(u.email || "").toLowerCase().includes(q)) return false;
			if (roleFilter !== "all" && u.role !== roleFilter) return false;
			if (statusFilter === "active"   && !u.is_active) return false;
			if (statusFilter === "inactive" &&  u.is_active) return false;
			return true;
		});
	}, [users, search, roleFilter, statusFilter]);

	const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

	const openCreate = () => {
		setEditItem(null);
		setForm(EMPTY_FORM);
		setPhotoPreview(null);
		setShowForm(true);
	};

	const openEdit = (item) => {
		setEditItem(item);
		setForm({
			first_name:  item.first_name  || "",
			last_name:   item.last_name   || "",
			username:    item.username    || "",
			email:       item.email       || "",
			role:        item.role        || "",
			department:  item.department  || "",
			is_active:   item.is_active   ?? true,
			is_staff:    item.is_staff    ?? false,
			photo:       null,
		});
		setPhotoPreview(item.photo || null);
		setShowForm(true);
	};

	const closeForm = () => {
		setShowForm(false);
		setEditItem(null);
		setForm(EMPTY_FORM);
		setPhotoPreview(null);
	};

	const handlePhotoChange = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		set("photo")(file);
		const url = URL.createObjectURL(file);
		setPhotoPreview(url);
	};

	const handleCopy = () => {
		if (!autoPassword) return;
		navigator.clipboard.writeText(autoPassword).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		// Defence in depth: the buttons are hidden for non-admins, but the
		// handler must not be the only thing standing between a stale bit of
		// UI state and a role change. The backend stays the real authority.
		if (!isAdmin) return toast.error("Bu amal uchun ruxsat yo'q");
		if (!form.username.trim()) return toast.error("Username kiritilmagan");
		if (!form.role)            return toast.error("Rol tanlanmagan");

		const buildPayload = () => {
			if (form.photo) {
				const fd = new FormData();
				fd.append("username",   form.username.trim());
				fd.append("email",      form.email.trim() || "");
				fd.append("first_name", form.first_name.trim());
				fd.append("last_name",  form.last_name.trim());
				if (form.role)       fd.append("role",       form.role);
				if (form.department) fd.append("department", form.department);
				fd.append("is_active", form.is_active);
				fd.append("is_staff",  form.is_staff);
				fd.append("photo",     form.photo);
				if (!editItem) fd.append("password", autoPassword);
				return fd;
			}
			const data = {
				username:   form.username.trim(),
				email:      form.email.trim() || "",
				first_name: form.first_name.trim(),
				last_name:  form.last_name.trim(),
				role:       form.role || null,
				department: form.department || null,
				is_active:  form.is_active,
				is_staff:   form.is_staff,
			};
			if (!editItem) data.password = autoPassword;
			return data;
		};

		try {
			const payload = buildPayload();
			if (editItem) {
				await dispatch(updateUser({ id: editItem.id, data: payload })).unwrap();
				toast.success("Foydalanuvchi yangilandi");
			} else {
				await dispatch(createUser(payload)).unwrap();
				toast.success("Foydalanuvchi qo'shildi");
			}
			closeForm();
		} catch (err) {
			const msg = typeof err === "string" ? err : (err?.username?.[0] || err?.detail || "Xatolik yuz berdi");
			toast.error(msg);
		}
	};

	const handleDelete = async () => {
		if (!isAdmin) return toast.error("Bu amal uchun ruxsat yo'q");
		try {
			await dispatch(deleteUser(deleteId)).unwrap();
			toast.success("Foydalanuvchi o'chirildi");
			setDeleteId(null);
		} catch (err) {
			toast.error(typeof err === "string" ? err : "Xatolik yuz berdi");
		}
	};

	const openImport = () => {
		setImportFile(null);
		setImportResult(null);
		setShowImport(true);
	};

	const closeImport = () => {
		setShowImport(false);
		setImportFile(null);
		setImportResult(null);
	};

	const handleImportFileChange = (file) => {
		if (!file) return;
		const ext = file.name.split(".").pop().toLowerCase();
		if (!["csv", "xlsx"].includes(ext)) {
			toast.error("Faqat .csv yoki .xlsx formatdagi fayllar qabul qilinadi");
			return;
		}
		setImportFile(file);
		setImportResult(null);
	};

	const handleImportDrop = (e) => {
		e.preventDefault();
		setImportDragging(false);
		const file = e.dataTransfer.files?.[0];
		handleImportFileChange(file);
	};

	const handleImportSubmit = async () => {
		if (!importFile) return;
		try {
			const result = await dispatch(batchImportUsers(importFile)).unwrap();
			setImportResult(result);
			dispatch(fetchUsers());
			toast.success(`Import yakunlandi: ${result.created} ta yaratildi`);
		} catch (err) {
			toast.error(typeof err === "string" ? err : "Import xatolik bilan tugadi");
		}
	};

	return (
		<div>
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Foydalanuvchilar</h1>
					<p className="text-muted-foreground text-sm mt-0.5">Tizim foydalanuvchilarini boshqarish</p>
				</div>
				<div className="flex items-center gap-2">
					{isAdmin && (
						<Button variant="outline" onClick={openImport} className="gap-2">
							<Upload className="w-4 h-4" /> xlsx / csv yuklash
						</Button>
					)}
					{isAdmin && (
						<Button onClick={openCreate} className="gap-2">
							<Plus className="w-4 h-4" /> Yangi foydalanuvchi
						</Button>
					)}
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap gap-3 mb-5">
				<div className="relative flex-1 min-w-[220px]">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Ism, username yoki email bo'yicha qidirish..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9 h-9"
					/>
				</div>
				<Select value={roleFilter} onValueChange={setRoleFilter}>
					<SelectTrigger className="w-44 h-9 text-sm">
						<SelectValue placeholder="Barcha rollar" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Barcha rollar</SelectItem>
						{roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
					</SelectContent>
				</Select>
				<Select value={statusFilter} onValueChange={setStatus}>
					<SelectTrigger className="w-32 h-9 text-sm">
						<SelectValue placeholder="Holati" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Barchasi</SelectItem>
						<SelectItem value="active">Faol</SelectItem>
						<SelectItem value="inactive">Nofaol</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Table */}
			{isLoading ? (
				<div className="flex justify-center py-20">
					<Loader2 className="w-7 h-7 animate-spin text-primary" />
				</div>
			) : error ? (
				<ErrorState
					title="Foydalanuvchilarni yuklab bo'lmadi"
					error={error}
					onRetry={() => dispatch(fetchUsers())}
				/>
			) : filtered.length === 0 ? (
				<div className="flex flex-col items-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
					<Users className="w-12 h-12 mb-3 opacity-30" />
					<p className="font-medium">Foydalanuvchi topilmadi</p>
					<p className="text-sm mt-1">Yangi foydalanuvchi qo'shing yoki filtrlarni o'zgartiring</p>
				</div>
			) : (
				<div className="bg-card border border-border rounded-xl overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border bg-muted/50">
									<th className="text-left px-4 py-3 font-medium text-muted-foreground w-10">№</th>
									<th className="text-left px-4 py-3 font-medium text-muted-foreground w-10"></th>
									<th className="text-left px-4 py-3 font-medium text-muted-foreground">F.I.O</th>
									<th className="text-left px-4 py-3 font-medium text-muted-foreground">Username</th>
									<th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
									<th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
									<th className="text-center px-4 py-3 font-medium text-muted-foreground">Holat</th>
									<th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Staff</th>
									<th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Qo'shilgan</th>
									<th className="text-right px-4 py-3 font-medium text-muted-foreground">Amal</th>
								</tr>
							</thead>
							<tbody>
								{filtered.map((u, i) => {
									const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
									return (
										<tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
											<td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
											<td className="px-3 py-2.5">
												<Avatar className="w-9 h-9">
													<ProtectedAvatarImage src={u.photo} alt={fullName} className="object-cover" />
													<AvatarFallback
														style={{ background: seedColor(u.username) }}
														className="text-white text-xs font-semibold"
													>
														{userInitials(u)}
													</AvatarFallback>
												</Avatar>
											</td>
											<td className="px-4 py-3">
												<p className="font-medium">{fullName || "—"}</p>
												{u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
											</td>
											<td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.username}</td>
											<td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">{u.email || "—"}</td>
											<td className="px-4 py-3">
												<Badge variant="secondary" className="text-[11px] border-0 bg-primary/10 text-primary">
													{u.role_details?.name || "—"}
												</Badge>
											</td>
											<td className="px-4 py-3 text-center">
												{u.is_active
													? <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0 text-[11px]">Faol</Badge>
													: <Badge variant="secondary" className="bg-red-100 text-red-700 border-0 text-[11px]">Nofaol</Badge>
												}
											</td>
											<td className="px-4 py-3 text-center hidden sm:table-cell">
												{u.is_staff
													? <ShieldCheck className="w-4 h-4 text-primary mx-auto" />
													: <span className="text-muted-foreground text-xs">—</span>
												}
											</td>
											<td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
												{u.date_joined ? format(new Date(u.date_joined), "dd.MM.yyyy") : "—"}
											</td>
											<td className="px-4 py-3 text-right">
												<div className="flex items-center justify-end gap-1">
													{isAdmin ? (
														<>
															<Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
																<Pencil className="w-3.5 h-3.5" />
															</Button>
															<Button
																variant="ghost" size="sm"
																className="text-destructive hover:text-destructive"
																onClick={() => setDeleteId(u.id)}
															>
																<Trash2 className="w-3.5 h-3.5" />
															</Button>
														</>
													) : (
														<span className="text-xs text-muted-foreground">—</span>
													)}
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
					<div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between">
						<p className="text-xs text-muted-foreground">Jami {filtered.length} ta foydalanuvchi</p>
						<p className="text-xs text-muted-foreground">{users.filter((u) => u.is_active).length} ta faol</p>
					</div>
				</div>
			)}

			{/* Form Dialog */}
			<Dialog open={showForm} onOpenChange={closeForm}>
				<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{editItem ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}
						</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Rasm */}
						<div className="flex flex-col items-center gap-3">
							<div className="relative">
								<Avatar className="w-20 h-20 ring-4 ring-border">
									{photoPreview
										? <AvatarImage src={photoPreview} alt="Rasm" className="object-cover" />
										: null
									}
									<AvatarFallback
										style={{ background: form.username ? seedColor(form.username) : "hsl(215,20%,65%)" }}
										className="text-white text-2xl font-bold"
									>
										{form.first_name?.[0]?.toUpperCase() || form.username?.[0]?.toUpperCase() || "?"}
									</AvatarFallback>
								</Avatar>
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
								>
									<Camera className="w-3.5 h-3.5" />
								</button>
							</div>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handlePhotoChange}
							/>
							<p className="text-xs text-muted-foreground">Rasm yuklash uchun kamera belgisini bosing</p>
						</div>

						{/* F.I.O */}
						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label className="text-xs">Ism</Label>
								<Input
									className="mt-1"
									value={form.first_name}
									onChange={(e) => set("first_name")(e.target.value)}
									placeholder="Ism"
								/>
							</div>
							<div>
								<Label className="text-xs">Familiya</Label>
								<Input
									className="mt-1"
									value={form.last_name}
									onChange={(e) => set("last_name")(e.target.value)}
									placeholder="Familiya"
								/>
							</div>
						</div>

						{/* Username */}
						<div>
							<Label className="text-xs">Username *</Label>
							<Input
								className="mt-1"
								required
								value={form.username}
								onChange={(e) => set("username")(e.target.value.replace(/\s/g, ""))}
								placeholder="username (bo'sh joy bo'lmasin)"
							/>
						</div>

						{/* Auto password — only on create */}
						{!editItem && (
							<div>
								<Label className="text-xs">Parol (avtomatik, o'zgartirilmaydi)</Label>
								<div className="flex gap-2 mt-1">
									<Input
										value={autoPassword || "Avval username kiriting..."}
										disabled
										className="bg-muted font-mono text-xs flex-1"
										readOnly
									/>
									<Button
										type="button"
										variant="outline"
										size="icon"
										className="shrink-0"
										onClick={handleCopy}
										disabled={!autoPassword}
										title="Nusxa olish"
									>
										{copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
									</Button>
								</div>
								<p className="text-[11px] text-muted-foreground mt-1">
									Format: {"{username}"}@2026_kiut
								</p>
							</div>
						)}

						{/* Email */}
						<div>
							<Label className="text-xs">Email</Label>
							<Input
								type="email"
								className="mt-1"
								value={form.email}
								onChange={(e) => set("email")(e.target.value)}
								placeholder="email@kiut.uz"
							/>
						</div>

						{/* Role */}
						<div>
							<Label className="text-xs">Rol *</Label>
							<Select value={form.role} onValueChange={set("role")} disabled={!isAdmin}>
								<SelectTrigger className="mt-1 h-9">
									<SelectValue placeholder="Rol tanlang" />
								</SelectTrigger>
								<SelectContent>
									{isAdmin && roles.map((r) => (
										<SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
							{!isAdmin && (
								<p className="text-[11px] text-muted-foreground mt-1">
									Rolni faqat administrator o'zgartira oladi.
								</p>
							)}
						</div>

						{/* Department */}
						<div>
							<Label className="text-xs">Kafedra</Label>
							<Select value={form.department} onValueChange={set("department")}>
								<SelectTrigger className="mt-1 h-9">
									<SelectValue placeholder="Kafedra (ixtiyoriy)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">— Kafedrasiz —</SelectItem>
									{departments.map((d) => (
										<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Flags */}
						<div className="flex items-center gap-6 pt-1 border-t border-border">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={form.is_active}
									onChange={(e) => set("is_active")(e.target.checked)}
									className="w-4 h-4 rounded"
								/>
								<span className="text-sm">Faol</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={form.is_staff}
									onChange={(e) => set("is_staff")(e.target.checked)}
									className="w-4 h-4 rounded"
								/>
								<span className="text-sm">Staff (admin panel)</span>
							</label>
						</div>

						<div className="flex justify-end gap-3 pt-1">
							<Button type="button" variant="outline" onClick={closeForm}>
								Bekor qilish
							</Button>
							<Button type="submit" disabled={isSaving}>
								{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
								{editItem ? "Saqlash" : "Qo'shish"}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete Confirm */}
			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>O'chirishni tasdiqlash</AlertDialogTitle>
						<AlertDialogDescription>
							Bu foydalanuvchi tizimdan butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Bekor qilish</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive hover:bg-destructive/90"
						>
							{isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							O'chirish
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Batch Import Dialog */}
			<Dialog open={showImport} onOpenChange={closeImport}>
				<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<FileSpreadsheet className="w-5 h-5 text-primary" />
							Ommaviy foydalanuvchi yuklash
						</DialogTitle>
					</DialogHeader>

					{!importResult ? (
						<div className="space-y-4">
							{/* Drop zone */}
							<div
								onDragOver={(e) => { e.preventDefault(); setImportDragging(true); }}
								onDragLeave={() => setImportDragging(false)}
								onDrop={handleImportDrop}
								onClick={() => importFileRef.current?.click()}
								className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
									importDragging
										? "border-primary bg-primary/5"
										: importFile
										? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
										: "border-border hover:border-primary/50 hover:bg-muted/40"
								}`}
							>
								<input
									ref={importFileRef}
									type="file"
									accept=".csv,.xlsx"
									className="hidden"
									onChange={(e) => handleImportFileChange(e.target.files?.[0])}
								/>
								{importFile ? (
									<div className="flex flex-col items-center gap-2">
										<FileSpreadsheet className="w-10 h-10 text-emerald-500" />
										<p className="font-medium text-emerald-700 dark:text-emerald-400">{importFile.name}</p>
										<p className="text-xs text-muted-foreground">
											{(importFile.size / 1024).toFixed(1)} KB
										</p>
										<button
											type="button"
											onClick={(e) => { e.stopPropagation(); setImportFile(null); }}
											className="mt-1 text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
										>
											<X className="w-3 h-3" /> Olib tashlash
										</button>
									</div>
								) : (
									<div className="flex flex-col items-center gap-2 text-muted-foreground">
										<Upload className="w-10 h-10 opacity-40" />
										<p className="font-medium">Faylni bu yerga tashlang yoki bosing</p>
										<p className="text-xs">.xlsx yoki .csv formatdagi fayl</p>
									</div>
								)}
							</div>

							{/* Format hint */}
							<div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
								<p className="font-medium text-foreground mb-1.5">Fayl ustunlari (tartib muhim emas):</p>
								<div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
									<span><span className="font-mono text-primary">No</span> — Tartib raqami</span>
									<span><span className="font-mono text-primary">First Name</span> — Ism</span>
									<span><span className="font-mono text-primary">Last Name</span> — Familiya</span>
									<span><span className="font-mono text-primary">Username</span> — Login *</span>
									<span><span className="font-mono text-primary">Password</span> — Parol</span>
									<span><span className="font-mono text-primary">Email</span> — Email</span>
									<span><span className="font-mono text-primary">Role</span> — Rol *</span>
									<span><span className="font-mono text-primary">Department</span> — Kafedra</span>
									<span><span className="font-mono text-primary">Active</span> — Faollik (✔️/✘)</span>
									<span><span className="font-mono text-primary">Staff</span> — Admin panel (✔️/✘)</span>
								</div>
							</div>

							<div className="flex justify-end gap-3">
								<Button type="button" variant="outline" onClick={closeImport}>
									Bekor qilish
								</Button>
								<Button
									onClick={handleImportSubmit}
									disabled={!importFile || isImporting}
									className="gap-2"
								>
									{isImporting
										? <><Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...</>
										: <><Upload className="w-4 h-4" /> Yuklash</>
									}
								</Button>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							{/* Summary cards */}
							<div className="grid grid-cols-3 gap-3">
								<div className="flex flex-col items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
									<CheckCircle2 className="w-6 h-6 text-emerald-500" />
									<p className="text-2xl font-bold text-emerald-600">{importResult.created ?? 0}</p>
									<p className="text-xs text-emerald-700 dark:text-emerald-400">Yaratildi</p>
								</div>
								<div className="flex flex-col items-center gap-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
									<CheckCircle2 className="w-6 h-6 text-blue-500" />
									<p className="text-2xl font-bold text-blue-600">{importResult.updated ?? 0}</p>
									<p className="text-xs text-blue-700 dark:text-blue-400">Yangilandi</p>
								</div>
								<div className="flex flex-col items-center gap-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
									<AlertTriangle className="w-6 h-6 text-amber-500" />
									<p className="text-2xl font-bold text-amber-600">{importResult.skipped ?? 0}</p>
									<p className="text-xs text-amber-700 dark:text-amber-400">O'tkazib yuborildi</p>
								</div>
							</div>

							{importResult.message && (
								<p className="text-sm text-center text-muted-foreground">{importResult.message}</p>
							)}

							{/* Skipped reasons */}
							{importResult.skipped_reasons?.length > 0 && (
								<div className="space-y-1.5">
									<p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
										<XCircle className="w-3.5 h-3.5 text-destructive" />
										O'tkazib yuborilgan qatorlar:
									</p>
									<div className="bg-muted/50 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
										{importResult.skipped_reasons.map((reason, i) => (
											<p key={i} className="text-xs text-muted-foreground font-mono leading-relaxed">
												{reason}
											</p>
										))}
									</div>
								</div>
							)}

							<div className="flex justify-end gap-3">
								<Button variant="outline" onClick={() => { setImportResult(null); setImportFile(null); }}>
									Yana yuklash
								</Button>
								<Button onClick={closeImport}>
									Yopish
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
