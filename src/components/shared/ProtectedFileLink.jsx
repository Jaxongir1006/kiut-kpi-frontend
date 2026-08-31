import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadProtectedMedia } from "@/lib/protectedMedia";

/**
 * Opens a file that lives behind the API's Authorization check.
 *
 * Deliberately a <button>, not an <a>: an anchor navigation cannot carry the
 * bearer header, so uploaded proof files / attachments / photos now come back
 * 401 from a plain href. The helper fetches the bytes with the token and hands
 * back a blob.
 */
export default function ProtectedFileLink({
	url,
	filename,
	children,
	className = "",
	icon = <Download className="w-3.5 h-3.5 shrink-0" />,
}) {
	const [isBusy, setBusy] = useState(false);

	if (!url) return null;

	const handleClick = async (e) => {
		// May sit inside a clickable row / expandable card.
		e.stopPropagation();
		e.preventDefault();
		if (isBusy) return;
		setBusy(true);
		try {
			await downloadProtectedMedia(url, filename);
		} catch {
			// Never surface the raw server response here — it can echo back
			// internal paths. A reviewer only needs to know it did not open.
			toast.error("Faylni ochib bo'lmadi. Sizda ruxsat bo'lmasligi mumkin.");
		} finally {
			setBusy(false);
		}
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={isBusy}
			className={`inline-flex items-center gap-1.5 text-primary hover:underline disabled:opacity-60 ${className}`}
		>
			{isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : icon}
			{children}
		</button>
	);
}
