import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/context/LanguageContext";
import { Calculator } from "lucide-react";

export default function KpiCalcTab() {
	const { t } = useLanguage();
	const [kpiList] = useState([]);

	const kpiSettings = kpiList[0] || {
		calculation_mode: "auto",
		score_scale_max: 1000,
		teaching_weight: 20,
		scientific_weight: 30,
		methodical_weight: 15,
		grants_weight: 15,
		publications_weight: 10,
		supervision_weight: 10,
		kpi_period_start: "",
		kpi_period_end: "",
		auto_approve_threshold: 0,
	};

	const [form, setForm] = useState(kpiSettings);

	const saveMutation = { mutate: () => {} };

	const totalWeight = form.teaching_weight + form.scientific_weight + form.methodical_weight + form.grants_weight + form.publications_weight + form.supervision_weight;

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2 pb-3 border-b border-border">
				<Calculator className="w-5 h-5 text-primary" />
				<h4 className="font-semibold">{t("kpi_calc_title")}</h4>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<Label>{t("calc_mode")}</Label>
					<Select value={form.calculation_mode} onValueChange={v => setForm({ ...form, calculation_mode: v })}>
						<SelectTrigger><SelectValue /></SelectTrigger>
						<SelectContent>
							<SelectItem value="auto">{t("calc_auto")}</SelectItem>
							<SelectItem value="manual">{t("calc_manual")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label>{t("score_scale_max")}</Label>
					<Input type="number" value={form.score_scale_max} onChange={e => setForm({ ...form, score_scale_max: Number(e.target.value) })} />
				</div>
			</div>

			<div>
				<Label className="mb-3 block">{t("weight_percentages")} <span className={totalWeight !== 100 ? "text-destructive font-bold" : "text-emerald-600 font-bold"}>({totalWeight}%)</span></Label>
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
					{[
						{ key: "teaching_weight", label: t("weight_teaching") },
						{ key: "scientific_weight", label: t("weight_scientific") },
						{ key: "methodical_weight", label: t("weight_methodical") },
						{ key: "grants_weight", label: t("weight_grants") },
						{ key: "publications_weight", label: t("weight_publications") },
						{ key: "supervision_weight", label: t("weight_supervision") },
					].map(item => (
						<div key={item.key}>
							<Label className="text-xs">{item.label}</Label>
							<div className="flex items-center gap-2">
								<Input type="number" min="0" max="100" value={form[item.key]} onChange={e => setForm({ ...form, [item.key]: Number(e.target.value) })} className="w-20" />
								<span className="text-sm text-muted-foreground">%</span>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<Label>{t("kpi_period_start")}</Label>
					<Input type="date" value={form.kpi_period_start} onChange={e => setForm({ ...form, kpi_period_start: e.target.value })} />
				</div>
				<div>
					<Label>{t("kpi_period_end")}</Label>
					<Input type="date" value={form.kpi_period_end} onChange={e => setForm({ ...form, kpi_period_end: e.target.value })} />
				</div>
			</div>

			<div className="flex items-center gap-3">
				<div className="flex-1">
					<Label>{t("auto_approve_threshold")}</Label>
					<p className="text-xs text-muted-foreground">{t("auto_approve_desc")}</p>
				</div>
				<Input type="number" value={form.auto_approve_threshold} onChange={e => setForm({ ...form, auto_approve_threshold: Number(e.target.value) })} className="w-24" />
			</div>

			<Button onClick={() => saveMutation.mutate(form)} disabled={totalWeight !== 100} className="w-full sm:w-auto">
				{t("save_settings")}
			</Button>
		</div>
	);
}