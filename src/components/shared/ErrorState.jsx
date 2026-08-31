import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown when a fetch FAILED — deliberately distinct from the empty state.
 *
 * "No submissions to review" and "the request died" look identical otherwise,
 * and on pay-affecting queues that silently reads as "nothing to approve".
 */
export default function ErrorState({
	title = "Ma'lumotni yuklab bo'lmadi",
	error,
	onRetry,
}) {
	// Server text is shown as a secondary detail only; the headline must not
	// depend on it, since it may be an object or an opaque network failure.
	const detail = typeof error === "string" ? error : null;

	return (
		<div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-destructive/30 rounded-xl">
			<div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
				<AlertTriangle className="w-7 h-7 text-destructive" />
			</div>
			<h3 className="text-base font-semibold text-foreground">{title}</h3>
			<p className="text-sm text-muted-foreground mt-1 max-w-sm">
				Bu ro'yxat bo'sh emas — so'rov bajarilmadi. Ko'rsatilgan ma'lumot to'liq bo'lmasligi mumkin.
			</p>
			{detail && <p className="text-xs text-muted-foreground/80 mt-2 max-w-sm break-words">{detail}</p>}
			{onRetry && (
				<Button variant="outline" size="sm" className="mt-4 gap-2" onClick={onRetry}>
					<RefreshCw className="w-4 h-4" /> Qayta urinish
				</Button>
			)}
		</div>
	);
}
