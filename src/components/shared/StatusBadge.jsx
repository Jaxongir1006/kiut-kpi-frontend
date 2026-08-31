import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export default function StatusBadge({ status }) {
	const { t } = useLanguage();

	const statusConfig = {
		draft: { label: t("draft"), className: "bg-muted text-muted-foreground" },
		submitted: { label: t("submitted"), className: "bg-blue-100 text-blue-700" },
		in_review: { label: t("in_review"), className: "bg-amber-100 text-amber-700" },
		revision: { label: t("revision"), className: "bg-orange-100 text-orange-700" },
		approved: { label: t("approved"), className: "bg-emerald-100 text-emerald-700" },
		rejected: { label: t("rejected"), className: "bg-red-100 text-red-700" },
		archived: { label: t("archived"), className: "bg-gray-100 text-gray-600" },
		active: { label: t("active"), className: "bg-emerald-100 text-emerald-700" },
		inactive: { label: t("inactive"), className: "bg-gray-100 text-gray-600" },
	};

	const config = statusConfig[status] || { label: status, className: "bg-muted text-muted-foreground" };
	return (
		<Badge variant="secondary" className={cn("font-medium text-[11px] border-0", config.className)}>
			{config.label}
		</Badge>
	);
}