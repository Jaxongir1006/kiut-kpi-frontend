import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function NotificationsTab() {
	const { t } = useLanguage();
	const [deadlineReminder, setDeadlineReminder] = useState(true);
	const [approvalNotify, setApprovalNotify] = useState(true);
	const [warningNotify, setWarningNotify] = useState(true);
	const [deadlineDays] = useState("7");

	const savePrefs = () => {
		localStorage.setItem("notif_deadline", deadlineReminder);
		localStorage.setItem("notif_approval", approvalNotify);
		localStorage.setItem("notif_warning", warningNotify);
		localStorage.setItem("notif_deadline_days", deadlineDays);
		toast.success(t("settings_saved"));
	};

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">{t("notifications_desc")}</p>
			<div className="space-y-4">
				<div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
					<div className="flex items-center gap-3">
						<Clock className="w-5 h-5 text-primary" />
						<div>
							<Label className="cursor-pointer">{t("deadline_reminder")}</Label>
							<p className="text-xs text-muted-foreground">{t("deadline_reminder_desc")}</p>
						</div>
					</div>
					<Switch checked={deadlineReminder} onCheckedChange={setDeadlineReminder} />
				</div>
				<div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
					<div className="flex items-center gap-3">
						<CheckCircle className="w-5 h-5 text-emerald-500" />
						<div>
							<Label className="cursor-pointer">{t("approval_notify")}</Label>
							<p className="text-xs text-muted-foreground">{t("approval_notify_desc")}</p>
						</div>
					</div>
					<Switch checked={approvalNotify} onCheckedChange={setApprovalNotify} />
				</div>
				<div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
					<div className="flex items-center gap-3">
						<AlertTriangle className="w-5 h-5 text-amber-500" />
						<div>
							<Label className="cursor-pointer">{t("warning_notify")}</Label>
							<p className="text-xs text-muted-foreground">{t("warning_notify_desc")}</p>
						</div>
					</div>
					<Switch checked={warningNotify} onCheckedChange={setWarningNotify} />
				</div>
			</div>
			<Button onClick={savePrefs} size="sm">{t("save_settings")}</Button>
		</div>
	);
}