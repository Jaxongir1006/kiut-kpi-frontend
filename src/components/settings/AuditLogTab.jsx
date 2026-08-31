import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { History, FileText, Users, FolderOpen, GraduationCap } from "lucide-react";
import { format } from "date-fns";

const entityIcons = {
	Teacher: Users,
	Activity: FileText,
	Category: FolderOpen,
	AcademicDegree: GraduationCap,
	AcademicRank: GraduationCap,
};

export default function AuditLogTab() {
	const { t } = useLanguage();
	const [logs] = useState([]);

	if (logs.length === 0) {
		return (
			<div className="space-y-4">
				<p className="text-sm text-muted-foreground">{t("audit_log_desc")}</p>
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<History className="w-10 h-10 text-muted-foreground mb-3" />
					<p className="text-sm text-muted-foreground">{t("no_audit_logs")}</p>
					<p className="text-xs text-muted-foreground mt-1">{t("audit_log_empty_desc")}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">{t("audit_log_desc")}</p>
			<div className="bg-card border border-border rounded-lg divide-y divide-border max-h-[500px] overflow-y-auto">
				{logs.map(log => {
					const Icon = entityIcons[log.entity_type] || FileText;
					return (
						<div key={log.id} className="flex items-start gap-3 p-3">
							<div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
								<Icon className="w-4 h-4 text-muted-foreground" />
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<span className="text-xs font-medium bg-primary/10 text-primary rounded px-1.5 py-0.5">{log.action}</span>
									<span className="text-xs text-muted-foreground">{log.entity_name || log.entity_type}</span>
								</div>
								{log.changes && <p className="text-xs text-muted-foreground mt-0.5">{log.changes}</p>}
								<div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
									<span>{log.performed_by_name}</span>
									<span>•</span>
									<span>{format(new Date(log.created_date), "dd.MM.yyyy HH:mm")}</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}