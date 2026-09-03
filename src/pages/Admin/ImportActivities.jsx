import { useRef, useState } from "react";
import {
	Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
	Loader2, X, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "sonner";

const TEMPLATE_URL = "/api/activities/submissions/import-template/";
const IMPORT_URL = "/api/activities/submissions/import/";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Bulk import of activity submissions from a spreadsheet.
 *
 * The flow is deliberately two-step: "Tekshirish" (dry run) never writes, and
 * the "Yuklash" button stays disabled until a dry run has come back clean. An
 * import that half-lands is the worst outcome for the operator -- they cannot
 * tell which rows were saved, and re-uploading duplicates the good ones -- so
 * the UI pushes them through the check rather than offering both buttons as
 * equals.
 */
export default function ImportActivities() {
	const fileInput = useRef(null);
	const [file, setFile] = useState(null);
	const [busy, setBusy] = useState(null); // "check" | "apply" | null
	const [result, setResult] = useState(null);
	const [fileError, setFileError] = useState("");

	const verified = result && result.dry_run && result.failed === 0 && result.created > 0;
	const applied = result && result.applied;

	function pickFile(selected) {
		setResult(null);
		setFileError("");
		if (!selected) {
			setFile(null);
			return;
		}
		if (!selected.name.toLowerCase().endsWith(".xlsx")) {
			setFileError("Faqat .xlsx fayl qabul qilinadi.");
			setFile(null);
			return;
		}
		if (selected.size > MAX_BYTES) {
			setFileError("Fayl 5 MB dan katta bo'lmasligi kerak.");
			setFile(null);
			return;
		}
		setFile(selected);
	}

	async function downloadTemplate() {
		try {
			// responseType blob: the endpoint returns binary xlsx, and the default
			// JSON transform would corrupt it into an unopenable file.
			const response = await axiosInstance.get(TEMPLATE_URL, { responseType: "blob" });
			const url = URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement("a");
			link.href = url;
			link.download = "kiut_kpi_import_namuna.xlsx";
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);
		} catch (err) {
			toast.error(err?.message || "Namunani yuklab bo'lmadi.");
		}
	}

	async function send(dryRun) {
		if (!file) return;
		setBusy(dryRun ? "check" : "apply");
		try {
			const form = new FormData();
			form.append("file", file);
			if (dryRun) form.append("dry_run", "true");
			// Content-Type is deleted, not set: the browser must generate the
			// multipart boundary itself, and the axios instance's JSON default
			// would override it.
			const { data } = await axiosInstance.post(IMPORT_URL, form, {
				headers: { "Content-Type": undefined },
			});
			setResult(data);
			if (data.failed > 0) toast.error(data.message);
			else if (dryRun) toast.success(data.message);
			else toast.success(data.message);
		} catch (err) {
			const detail = err?.file || err?.detail || err?.message || "Yuklashda xatolik.";
			setResult(null);
			setFileError(Array.isArray(detail) ? detail.join(" ") : String(detail));
			toast.error(Array.isArray(detail) ? detail.join(" ") : String(detail));
		} finally {
			setBusy(null);
		}
	}

	function reset() {
		setFile(null);
		setResult(null);
		setFileError("");
		if (fileInput.current) fileInput.current.value = "";
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Faoliyatlarni Excel orqali yuklash"
				subtitle="Bir vaqtning o'zida ko'p faoliyatni .xlsx fayldan kiritish"
			/>

			{/* Step 1 — template */}
			<section className="rounded-xl border bg-white p-6">
				<div className="flex items-start justify-between gap-4 flex-wrap">
					<div className="flex gap-3">
						<div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
							1
						</div>
						<div>
							<h3 className="font-semibold">Namunani yuklab oling</h3>
							<p className="mt-1 text-sm text-muted-foreground max-w-2xl">
								Namunada ustunlar tartibi, bitta to'ldirilgan misol qator, shuningdek
								barcha <strong>ko'rsatkich kodlari</strong> va{" "}
								<strong>xodimlar tabel raqamlari</strong> alohida varaqlarda beriladi.
							</p>
						</div>
					</div>
					<Button variant="outline" onClick={downloadTemplate} className="gap-2">
						<Download className="h-4 w-4" />
						Namunani yuklab olish
					</Button>
				</div>
			</section>

			{/* Step 2 — file */}
			<section className="rounded-xl border bg-white p-6">
				<div className="flex gap-3">
					<div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
						2
					</div>
					<div className="flex-1">
						<h3 className="font-semibold">To'ldirilgan faylni tanlang</h3>

						<input
							ref={fileInput}
							type="file"
							accept=".xlsx"
							className="hidden"
							onChange={(e) => pickFile(e.target.files?.[0] || null)}
						/>

						{!file ? (
							<button
								type="button"
								onClick={() => fileInput.current?.click()}
								className="mt-3 flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-muted-foreground transition hover:border-primary hover:text-primary"
							>
								<FileSpreadsheet className="h-8 w-8" />
								<span className="text-sm font-medium">.xlsx faylni tanlash</span>
								<span className="text-xs">maksimal 5 MB, 500 tagacha qator</span>
							</button>
						) : (
							<div className="mt-3 flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
								<FileSpreadsheet className="h-5 w-5 text-emerald-600" />
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">{file.name}</p>
									<p className="text-xs text-muted-foreground">
										{(file.size / 1024).toFixed(0)} KB
									</p>
								</div>
								<Button variant="ghost" size="icon" onClick={reset} aria-label="Bekor qilish">
									<X className="h-4 w-4" />
								</Button>
							</div>
						)}

						{fileError && (
							<p className="mt-2 text-sm text-red-600">{fileError}</p>
						)}

						<div className="mt-4 flex flex-wrap gap-2">
							<Button
								variant="outline"
								disabled={!file || busy !== null}
								onClick={() => send(true)}
								className="gap-2"
							>
								{busy === "check" ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<ShieldCheck className="h-4 w-4" />
								)}
								Tekshirish (saqlanmaydi)
							</Button>
							<Button
								disabled={!verified || busy !== null}
								onClick={() => send(false)}
								className="gap-2"
							>
								{busy === "apply" ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Upload className="h-4 w-4" />
								)}
								Yuklash
							</Button>
						</div>
						{!verified && !applied && (
							<p className="mt-2 text-xs text-muted-foreground">
								Avval tekshiruvdan o'tkazing — xatosiz bo'lsa «Yuklash» faollashadi.
							</p>
						)}
					</div>
				</div>
			</section>

			{/* Step 3 — result */}
			{result && (
				<section className="rounded-xl border bg-white p-6">
					<div className="flex gap-3">
						<div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
							3
						</div>
						<div className="min-w-0 flex-1">
							<h3 className="font-semibold">Natija</h3>

							<div
								className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-sm ${
									result.failed > 0
										? "bg-red-50 text-red-800"
										: "bg-emerald-50 text-emerald-800"
								}`}
							>
								{result.failed > 0 ? (
									<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
								) : (
									<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
								)}
								<span>{result.message}</span>
							</div>

							<div className="mt-4 flex flex-wrap gap-4 text-sm">
								<span>
									Jami qator: <strong>{result.total_rows}</strong>
								</span>
								<span className="text-emerald-700">
									To'g'ri: <strong>{result.created}</strong>
								</span>
								<span className="text-red-700">
									Xato: <strong>{result.failed}</strong>
								</span>
							</div>

							{result.failed > 0 && (
								<div className="mt-4 overflow-x-auto rounded-lg border">
									<table className="w-full text-sm">
										<thead className="bg-muted/60">
											<tr>
												<th className="px-3 py-2 text-left font-medium">Qator</th>
												<th className="px-3 py-2 text-left font-medium">Ustun</th>
												<th className="px-3 py-2 text-left font-medium">Xatolik</th>
											</tr>
										</thead>
										<tbody>
											{result.errors.map((e, i) => (
												<tr key={`${e.row}-${e.field}-${i}`} className="border-t">
													<td className="px-3 py-2 font-mono">{e.row}</td>
													<td className="px-3 py-2 font-mono text-xs">{e.field}</td>
													<td className="px-3 py-2">{e.message}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}

							{result.failed === 0 && result.rows?.length > 0 && (
								<div className="mt-4 overflow-x-auto rounded-lg border">
									<table className="w-full text-sm">
										<thead className="bg-muted/60">
											<tr>
												<th className="px-3 py-2 text-left font-medium">Qator</th>
												<th className="px-3 py-2 text-left font-medium">Xodim</th>
												<th className="px-3 py-2 text-left font-medium">Kod</th>
												<th className="px-3 py-2 text-left font-medium">Nomi</th>
												<th className="px-3 py-2 text-left font-medium">Sana</th>
											</tr>
										</thead>
										<tbody>
											{result.rows.slice(0, 100).map((r) => (
												<tr key={r.row} className="border-t">
													<td className="px-3 py-2 font-mono">{r.row}</td>
													<td className="px-3 py-2">{r.teacher}</td>
													<td className="px-3 py-2 font-mono text-xs">{r.indicator_code}</td>
													<td className="px-3 py-2">{r.title}</td>
													<td className="px-3 py-2 font-mono text-xs">{r.submission_date}</td>
												</tr>
											))}
										</tbody>
									</table>
									{result.rows.length > 100 && (
										<p className="border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
											Yana {result.rows.length - 100} ta qator ko'rsatilmadi.
										</p>
									)}
								</div>
							)}

							{applied && (
								<div className="mt-4">
									<Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
										Saqlandi — barcha qatorlar «Kutilmoqda» holatida
									</Badge>
									<p className="mt-2 text-xs text-muted-foreground">
										Import — bu ma'lumot kiritish, tasdiqlash emas. Har bir qator
										kafedra mudiri va komissiya ko'rigidan o'tadi, ball faqat
										tasdiqlangandan keyin hisoblanadi.
									</p>
									<Button variant="outline" className="mt-3" onClick={reset}>
										Yangi fayl yuklash
									</Button>
								</div>
							)}
						</div>
					</div>
				</section>
			)}

			<section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
				<p className="font-medium">Eslatma</p>
				<ul className="mt-2 list-disc space-y-1 pl-5">
					<li>
						Hujjat talab qiladigan ko'rsatkichlar uchun <code>proof_url</code> majburiy —
						Excel orqali fayl yuborib bo'lmaydi (Nizom VI).
					</li>
					<li>Bitta xato qator butun faylni bekor qiladi; hech narsa yarim saqlanmaydi.</li>
					<li>Natijalari e'lon qilingan o'quv yiliga yangi faoliyat qo'shib bo'lmaydi.</li>
				</ul>
			</section>
		</div>
	);
}
