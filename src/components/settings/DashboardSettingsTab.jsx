import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BarChart3, Filter, FileDown } from "lucide-react";
import { toast } from "sonner";

export default function DashboardSettingsTab() {
	const { t } = useLanguage();
	const [showCharts, setShowCharts] = useState(true);
	const [showFilters, setShowFilters] = useState(true);
	const [enableExport, setEnableExport] = useState(true);

	const savePrefs = () => {
		localStorage.setItem("dashboard_showCharts", showCharts);
		localStorage.setItem("dashboard_showFilters", showFilters);
		localStorage.setItem("dashboard_enableExport", enableExport);
		toast.success(t("settings_saved"));
	};

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">{t("dashboard_settings_desc")}</p>
			<div className="space-y-4">
				<div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
					<div className="flex items-center gap-3">
						<BarChart3 className="w-5 h-5 text-primary" />
						<div>
							<Label className="cursor-pointer">{t("show_charts")}</Label>
							<p className="text-xs text-muted-foreground">{t("show_charts_desc")}</p>
						</div>
					</div>
					<Switch checked={showCharts} onCheckedChange={setShowCharts} />
				</div>
				<div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
					<div className="flex items-center gap-3">
						<Filter className="w-5 h-5 text-primary" />
						<div>
							<Label className="cursor-pointer">{t("show_filters")}</Label>
							<p className="text-xs text-muted-foreground">{t("show_filters_desc")}</p>
						</div>
					</div>
					<Switch checked={showFilters} onCheckedChange={setShowFilters} />
				</div>
				<div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
					<div className="flex items-center gap-3">
						<FileDown className="w-5 h-5 text-primary" />
						<div>
							<Label className="cursor-pointer">{t("enable_export")}</Label>
							<p className="text-xs text-muted-foreground">{t("enable_export_desc")}</p>
						</div>
					</div>
					<Switch checked={enableExport} onCheckedChange={setEnableExport} />
				</div>
			</div>
			<Button onClick={savePrefs} size="sm">{t("save_settings")}</Button>
		</div>
	);
}