import { ExternalLink, FileText } from "lucide-react";
import SafeLink from "@/components/shared/SafeLink";
import ProtectedFileLink from "@/components/shared/ProtectedFileLink";

// The API is a separate origin from the SPA, so uploaded files come back as
// absolute URLs on that host. Anything else the teacher typed (a DOI, a
// publisher page) is an ordinary external link.
const API_ORIGIN = (() => {
	try {
		return new URL(import.meta.env.VITE_API_URL, window.location.origin).origin;
	} catch {
		return null;
	}
})();

/**
 * True when `value` points at a file our own API serves, i.e. one that now
 * requires the Authorization header.
 */
function isProtectedMedia(value) {
	const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value);
	if (!scheme) return true; // relative path => served by our backend
	if (!/^https?$/i.test(scheme[1])) return false; // javascript:, data: … never a file
	try {
		const parsed = new URL(value);
		return parsed.origin === API_ORIGIN || parsed.pathname.includes("/media/");
	} catch {
		return false;
	}
}

function fileLabel(value) {
	try {
		const path = /^https?:/i.test(value) ? new URL(value).pathname : value;
		return decodeURIComponent(path.split("/").filter(Boolean).pop() || "Hujjat");
	} catch {
		return "Hujjat";
	}
}

/**
 * One decision point for "show the proof": the same DB column can hold either
 * an uploaded file (protected, needs the bearer token — must be a button) or an
 * external URL the teacher typed (a plain link, but only after a scheme check,
 * since a javascript: href would run in the reviewing admin's session).
 */
export default function ProofLink({ value, label, className = "" }) {
	if (!value || typeof value !== "string") return null;

	if (isProtectedMedia(value)) {
		const name = fileLabel(value);
		return (
			<ProtectedFileLink
				url={value}
				filename={name}
				className={`text-sm ${className}`}
				icon={<FileText className="w-3.5 h-3.5 shrink-0" />}
			>
				{label || name}
			</ProtectedFileLink>
		);
	}

	return (
		<SafeLink
			value={value}
			className={`text-sm text-primary hover:underline ${className}`}
			icon={<ExternalLink className="w-3.5 h-3.5 shrink-0" />}
		>
			{label || "Havolani ochish"}
		</SafeLink>
	);
}
