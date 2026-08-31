// @ts-nocheck
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	CheckCircle, XCircle, Eye, Loader2, Building2, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import ProofLink from "@/components/shared/ProofLink";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { fetchSubmissions, departmentReview, reviewSubmission } from "@/features/submissions/submissionsSlice";

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_CFG = {
	pending:             { label: "Kafedra kutmoqda",     cls: "bg-yellow-100 text-yellow-700" },
	department_approved: { label: "Kafedra tasdiqladi",   cls: "bg-blue-100 text-blue-700" },
	department_rejected: { label: "Kafedra rad etdi",     cls: "bg-orange-100 text-orange-700" },
	approved:            { label: "Tasdiqlangan",         cls: "bg-emerald-100 text-emerald-700" },
	rejected:            { label: "Rad etilgan",          cls: "bg-red-100 text-red-700" },
	overridden:          { label: "Komissiya o'zgartirdi", cls: "bg-purple-100 text-purple-700" },
};

function StatusBadge({ status }) {
	const cfg = STATUS_CFG[status] || { label: status, cls: "bg-gray-100 text-gray-600" };
	return (
		<Badge variant="secondary" className={`border-0 ${cfg.cls}`}>{cfg.label}</Badge>
	);
}

// ─── Filter tabs ─────────────────────────────────────────────────────────────
const FILTERS = [
	{ key: "pending",             label: "Kafedra tekshiruvi",    badge: "bg-yellow-100 text-yellow-700" },
	{ key: "department_approved", label: "Komissiya tekshiruvi",  badge: "bg-blue-100 text-blue-700" },
	{ key: "reviewed",            label: "Yakunlangan",           badge: "bg-emerald-100 text-emerald-700" },
	{ key: "all",                 label: "Barchasi",              badge: "bg-gray-100 text-gray-600" },
];

export default function Review() {
	const { t } = useLanguage();
	const dispatch = useDispatch();
	const { list: submissions, isLoading, isSaving, error } = useSelector((s) => s.submissions);

	const [filter, setFilter]               = useState("pending");
	const [selected, setSelected]           = useState(null);
	// action: "dept_approve" | "dept_reject" | "approve" | "reject" | "override"
	const [action, setAction]               = useState(null);
	const [comment, setComment]             = useState("");
	const [pointsOverride, setPointsOverride] = useState("");

	useEffect(() => { dispatch(fetchSubmissions()); }, [dispatch]);

	const filtered = submissions.filter((s) => {
		if (filter === "pending")             return s.status === "pending";
		if (filter === "department_approved") return s.status === "department_approved";
		if (filter === "reviewed")            return ["approved", "rejected", "overridden", "department_rejected"].includes(s.status);
		return true; // all
	});

	// Count badges for tab labels
	const counts = {
		pending:             submissions.filter((s) => s.status === "pending").length,
		department_approved: submissions.filter((s) => s.status === "department_approved").length,
		reviewed:            submissions.filter((s) => ["approved", "rejected", "overridden", "department_rejected"].includes(s.status)).length,
		all:                 submissions.length,
	};

	const openDetail = (sub) => { setSelected(sub); setAction(null); setComment(""); setPointsOverride(""); };
	const openAction = (sub, act) => { setSelected(sub); setAction(act); setComment(""); setPointsOverride(""); };
	const closeDialog = () => { setSelected(null); setAction(null); setComment(""); setPointsOverride(""); };

	const handleReview = async () => {
		if (!selected || !action) return;

		// Dept actions → department-review endpoint
		const isDeptAction = action === "dept_approve" || action === "dept_reject";

		try {
			if (isDeptAction) {
				const data = {
					status: action === "dept_approve" ? "department_approved" : "department_rejected",
					department_review_comments: comment || undefined,
				};
				await dispatch(departmentReview({ id: selected.id, data })).unwrap();
				toast.success(action === "dept_approve" ? "Kafedra tasdiqlovchisi tasdiqladi" : "Kafedra tasdiqlovchisi rad etdi");
			} else {
				const statusMap = { approve: "approved", reject: "rejected", override: "overridden" };
				const data = {
					status: statusMap[action],
					review_comments: comment || undefined,
					points_override: pointsOverride ? parseFloat(pointsOverride) : null,
				};
				await dispatch(reviewSubmission({ id: selected.id, data })).unwrap();
				const labels = { approve: "Tasdiqlandi", reject: "Rad etildi", override: "Komissiya o'zgartirdi" };
				toast.success(labels[action]);
			}
			closeDialog();
		} catch (err) {
			toast.error(typeof err === "string" ? err : t("error_occurred"));
		}
	};

	const ACTION_META = {
		dept_approve: { label: "Kafedra tasdiqlashi",   btnCls: "bg-blue-600 hover:bg-blue-700 text-white",     confirmText: "Kafedra tasdiqlovchisi sifatida tasdiqlaysizmi?" },
		dept_reject:  { label: "Kafedra rad etishi",    btnCls: "bg-orange-600 hover:bg-orange-700 text-white", confirmText: "Kafedra tasdiqlovchisi sifatida rad etasizmi?" },
		approve:      { label: "Tasdiqlash",            btnCls: "bg-emerald-600 hover:bg-emerald-700 text-white", confirmText: "Ushbu topshiriqni tasdiqlaysizmi?" },
		reject:       { label: "Rad etish",             btnCls: "bg-destructive hover:bg-destructive/90 text-white", confirmText: "Ushbu topshiriqni rad etasizmi?" },
		override:     { label: "Ball o'zgartirish",     btnCls: "bg-purple-600 hover:bg-purple-700 text-white", confirmText: "Ball miqdorini o'zgartirib tasdiqlash:" },
	};

	return (
		<div>
			<PageHeader title={t("review_title")} description={t("review_desc")}>
				{/* Filter tabs */}
				<div className="flex gap-1 bg-muted p-1 rounded-lg">
					{FILTERS.map((f) => (
						<button
							key={f.key}
							onClick={() => setFilter(f.key)}
							className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
								filter === f.key
									? "bg-background shadow-sm text-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{f.label}
							{counts[f.key] > 0 && (
								<span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
									filter === f.key ? f.badge : "bg-muted-foreground/20 text-muted-foreground"
								}`}>
									{counts[f.key]}
								</span>
							)}
						</button>
					))}
				</div>
			</PageHeader>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
				</div>
			) : error ? (
				<ErrorState
					title="Topshiriqlarni yuklab bo'lmadi"
					error={error}
					onRetry={() => dispatch(fetchSubmissions())}
				/>
			) : filtered.length === 0 ? (
				<EmptyState title="Bu filtrdagi topshiriqlar yo'q" />
			) : (
				<div className="space-y-3">
					{filtered.map((sub) => (
						<div key={sub.id} className="bg-card border border-border rounded-xl p-4 sm:p-5 hover:shadow-sm transition-shadow">
							<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1 flex-wrap">
										<h3 className="font-semibold truncate">{sub.title}</h3>
										<StatusBadge status={sub.status} />
									</div>
									<div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
										<span>{sub.teacher_details?.full_name || "—"}</span>
										<span>{sub.activity_type_details?.name || "—"}</span>
										{sub.submission_date && <span>{format(new Date(sub.submission_date), "dd.MM.yyyy")}</span>}
										{sub.co_authors_count > 1 && (
											<span className="text-xs bg-amber-100 text-amber-700 rounded px-2 py-0.5">
												{sub.co_authors_count} muallif
											</span>
										)}
									</div>
									<div className="flex items-center gap-4 mt-2 text-sm">
										<span className="text-muted-foreground">
											Ball: <span className="font-semibold text-primary">{sub.points ?? sub.activity_type_details?.base_points ?? "—"}</span>
										</span>
										{sub.math_trace?.calculation && (
											<span className="text-xs text-muted-foreground font-mono">{sub.math_trace.calculation}</span>
										)}
									</div>
									{/* Dept review info */}
									{sub.department_review_comments && (
										<p className="mt-1.5 text-xs text-blue-600 italic">
											Kafedra izohi: "{sub.department_review_comments}"
										</p>
									)}
									{/* Commission review info */}
									{sub.review_comments && (
										<p className="mt-1 text-xs text-muted-foreground italic">
											Komissiya izohi: "{sub.review_comments}"
										</p>
									)}
								</div>

								<div className="flex items-center gap-2 shrink-0 flex-wrap">
									<Button variant="ghost" size="sm" onClick={() => openDetail(sub)}>
										<Eye className="w-4 h-4 mr-1" /> Ko'rish
									</Button>

									{/* 1-bosqich: Kafedra mudiri tekshiruvi */}
									{sub.status === "pending" && (
										<>
											<Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"
												onClick={() => openAction(sub, "dept_approve")}>
												<Building2 className="w-4 h-4 mr-1" /> Kafedra tasdiqlaydi
											</Button>
											<Button variant="outline" size="sm"
												className="text-orange-600 border-orange-300 hover:bg-orange-50"
												onClick={() => openAction(sub, "dept_reject")}>
												<XCircle className="w-4 h-4 mr-1" /> Kafedra rad etadi
											</Button>
										</>
									)}

									{/* 2-bosqich: Komissiya tekshiruvi */}
									{sub.status === "department_approved" && (
										<>
											<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
												onClick={() => openAction(sub, "approve")}>
												<CheckCircle className="w-4 h-4 mr-1" /> Tasdiqlash
											</Button>
											<Button variant="outline" size="sm"
												className="text-destructive border-destructive/40 hover:bg-destructive/10"
												onClick={() => openAction(sub, "reject")}>
												<XCircle className="w-4 h-4 mr-1" /> Rad etish
											</Button>
											<Button variant="outline" size="sm"
												className="text-purple-600 border-purple-300 hover:bg-purple-50"
												onClick={() => openAction(sub, "override")}>
												<Award className="w-4 h-4 mr-1" /> Ball o'zgartirish
											</Button>
										</>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* ─── Detail / Action Dialog ─────────────────────────────────────── */}
			<Dialog open={!!selected} onOpenChange={closeDialog}>
				<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{action ? ACTION_META[action]?.label : "Topshiriq tafsiloti"}
						</DialogTitle>
					</DialogHeader>

					{selected && (
						<div className="space-y-4">
							{/* Detail grid */}
							<div className="grid grid-cols-2 gap-3 text-sm">
								<div>
									<p className="text-xs text-muted-foreground">Sarlavha</p>
									<p className="font-medium">{selected.title}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Holat</p>
									<StatusBadge status={selected.status} />
								</div>
								<div>
									<p className="text-xs text-muted-foreground">O'qituvchi</p>
									<p className="font-medium">{selected.teacher_details?.full_name || "—"}</p>
									<p className="text-xs text-muted-foreground">{selected.teacher_details?.employee_id}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Kategoriya</p>
									<p className="font-medium">{selected.activity_type_details?.name || "—"}</p>
									<p className="text-xs text-muted-foreground">{selected.activity_type_details?.base_points} ball (bazaviy)</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Topshirilgan sana</p>
									<p className="font-medium">
										{selected.submission_date ? format(new Date(selected.submission_date), "dd.MM.yyyy") : "—"}
									</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Mualliflar soni</p>
									<p className="font-medium">{selected.co_authors_count ?? 1}</p>
								</div>
								<div className="col-span-2">
									<p className="text-xs text-muted-foreground">Hisoblangan ball</p>
									<p className="text-2xl font-bold text-primary">{selected.points ?? selected.activity_type_details?.base_points ?? "—"}</p>
								</div>
								{selected.math_trace && Object.keys(selected.math_trace).length > 0 && (
									<div className="col-span-2 bg-muted/50 rounded-lg p-3">
										<p className="text-xs text-muted-foreground mb-1">Hisob-kitob</p>
										<p className="text-xs font-mono text-muted-foreground">{selected.math_trace.formula}</p>
										<p className="text-sm font-medium mt-1">{selected.math_trace.calculation}</p>
									</div>
								)}
								{selected.description && (
									<div className="col-span-2">
										<p className="text-xs text-muted-foreground">Izoh</p>
										<p className="text-sm mt-0.5">{selected.description}</p>
									</div>
								)}
								{(selected.proof_file || selected.proof_url || selected.proof) && (
									<div className="col-span-2 flex flex-col items-start gap-1">
										<p className="text-xs text-muted-foreground mb-1">Hujjat</p>
										<ProofLink value={selected.proof_file || selected.proof} label="Hujjatni ko'rish" />
										<ProofLink value={selected.proof_url} />
									</div>
								)}

								{/* Dept review info */}
								{selected.department_review_comments && (
									<div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
										<p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
											<Building2 className="w-3 h-3" /> Kafedra izohi
										</p>
										<p className="text-sm">{selected.department_review_comments}</p>
										{selected.department_reviewed_at && (
											<p className="text-xs text-muted-foreground mt-1">
												{format(new Date(selected.department_reviewed_at), "dd.MM.yyyy HH:mm")}
											</p>
										)}
									</div>
								)}

								{/* Commission review info */}
								{selected.review_comments && (
									<div className="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
										<p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
											<Award className="w-3 h-3" /> Komissiya izohi
										</p>
										<p className="text-sm">{selected.review_comments}</p>
										{selected.reviewed_at && (
											<p className="text-xs text-muted-foreground mt-1">
												{format(new Date(selected.reviewed_at), "dd.MM.yyyy HH:mm")}
											</p>
										)}
									</div>
								)}
							</div>

							{/* Action form */}
							{action && (
								<div className="border-t border-border pt-4 space-y-3">
									<p className="text-sm font-medium">{ACTION_META[action]?.confirmText}</p>
									<div>
										<Label>
											Izoh{" "}
											{(action === "dept_reject" || action === "reject") ? "(sabab ko'rsating)" : "(ixtiyoriy)"}
										</Label>
										<Textarea
											value={comment}
											onChange={(e) => setComment(e.target.value)}
											placeholder={
												(action === "dept_reject" || action === "reject")
													? "Rad etish sababini yozing..."
													: "Qo'shimcha izoh..."
											}
											rows={3}
											className="mt-1"
										/>
									</div>
									{action === "override" && (
										<div>
											<Label>Qo'shimcha ball (masalan: 15 yoki -5)</Label>
											<Input
												type="number"
												step="0.01"
												value={pointsOverride}
												onChange={(e) => setPointsOverride(e.target.value)}
												placeholder="0.00"
												className="mt-1"
											/>
										</div>
									)}
								</div>
							)}
						</div>
					)}

					<DialogFooter className="gap-2">
						<Button variant="outline" onClick={action ? () => setAction(null) : closeDialog}>
							{action ? "Orqaga" : "Yopish"}
						</Button>

						{/* Quick action buttons in detail view */}
						{!action && selected?.status === "pending" && (
							<>
								<Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setAction("dept_approve")}>
									<Building2 className="w-4 h-4 mr-1" /> Kafedra tasdiqlaydi
								</Button>
								<Button variant="outline" size="sm" className="text-orange-600 border-orange-300" onClick={() => setAction("dept_reject")}>
									<XCircle className="w-4 h-4 mr-1" /> Rad etish
								</Button>
							</>
						)}
						{!action && selected?.status === "department_approved" && (
							<>
								<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setAction("approve")}>
									<CheckCircle className="w-4 h-4 mr-1" /> Tasdiqlash
								</Button>
								<Button variant="outline" size="sm" className="text-destructive border-destructive/40" onClick={() => setAction("reject")}>
									<XCircle className="w-4 h-4 mr-1" /> Rad etish
								</Button>
								<Button variant="outline" size="sm" className="text-purple-600" onClick={() => setAction("override")}>
									<Award className="w-4 h-4 mr-1" /> Ball o'zgartirish
								</Button>
							</>
						)}

						{action && (
							<Button
								onClick={handleReview}
								disabled={
									isSaving ||
									((action === "dept_reject" || action === "reject") && !comment.trim())
								}
								className={ACTION_META[action]?.btnCls}
							>
								{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
								{ACTION_META[action]?.label}
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
