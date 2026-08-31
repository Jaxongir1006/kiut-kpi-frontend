import { AlertTriangle } from "lucide-react";
import { safeUrl } from "@/lib/safeUrl";

/**
 * Renders a backend-supplied URL as a link ONLY when its scheme is http/https.
 *
 * Values like proof_url are typed by the teacher being reviewed, so an attacker
 * controls the href a reviewer clicks. "javascript:" (and "data:", "vbscript:")
 * hrefs execute in the reviewer's session and can exfiltrate their token, so a
 * rejected URL renders as inert text with a warning: a reviewer must be able to
 * SEE that a document is unopenable rather than click a silently dead link.
 */
export default function SafeLink({ value, children, className = "", icon = null }) {
	const href = safeUrl(value);

	if (!href) {
		return (
			<span
				className={`inline-flex items-center gap-1.5 text-muted-foreground ${className}`}
				title="Havola qo'llab-quvvatlanmaydigan formatda — ochilmadi"
			>
				<AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
				<span className="line-through">{children}</span>
				<span className="text-[11px] text-amber-600">(noto'g'ri havola)</span>
			</span>
		);
	}

	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={`inline-flex items-center gap-1.5 ${className}`}
		>
			{icon}
			{children}
		</a>
	);
}
