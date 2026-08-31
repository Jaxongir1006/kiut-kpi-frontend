import React, { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { useLanguage } from "@/context/LanguageContext";
import {
	Shield, Calculator, Briefcase, Calendar, FolderOpen,
	GraduationCap, BarChart3, Bell, Lock, History
} from "lucide-react";
import RolesTab from "@/components/settings/RolesTab";
import KpiCalcTab from "@/components/settings/KpiCalcTab";
import TeacherTypesTab from "@/components/settings/TeacherTypesTab";
import AcademicYearSettingsTab from "@/components/settings/AcademicYearSettingsTab";
import KpiCategoriesTab from "@/components/settings/KpiCategoriesTab";
import DegreesSettingsTab from "@/components/settings/DegreesSettingsTab";
import DashboardSettingsTab from "@/components/settings/DashboardSettingsTab";
import NotificationsTab from "@/components/settings/NotificationsTab";
import PermissionsTab from "@/components/settings/PermissionsTab";
import AuditLogTab from "@/components/settings/AuditLogTab";

const tabs = [
	{ id: "roles", label: "roles_tab", icon: Shield },
	{ id: "kpi_calc", label: "kpi_calc_tab", icon: Calculator },
	{ id: "teacher_types", label: "teacher_types_tab", icon: Briefcase },
	{ id: "academic_years", label: "academic_years_tab", icon: Calendar },
	{ id: "categories", label: "categories_tab", icon: FolderOpen },
	{ id: "degrees", label: "degrees_tab", icon: GraduationCap },
	{ id: "dashboard_settings", label: "dashboard_settings_tab", icon: BarChart3 },
	{ id: "notifications", label: "notifications_tab", icon: Bell },
	{ id: "permissions", label: "permissions_tab", icon: Lock },
	{ id: "audit_log", label: "audit_log_tab", icon: History },
];

export default function Settings() {
	const { t } = useLanguage();
	const [activeTab, setActiveTab] = useState("roles");

	const renderTab = () => {
		switch (activeTab) {
			case "roles": return <RolesTab />;
			case "kpi_calc": return <KpiCalcTab />;
			case "teacher_types": return <TeacherTypesTab />;
			case "academic_years": return <AcademicYearSettingsTab />;
			case "categories": return <KpiCategoriesTab />;
			case "degrees": return <DegreesSettingsTab />;
			case "dashboard_settings": return <DashboardSettingsTab />;
			case "notifications": return <NotificationsTab />;
			case "permissions": return <PermissionsTab />;
			case "audit_log": return <AuditLogTab />;
			default: return <RolesTab />;
		}
	};

	return (
		<div>
			<PageHeader title={t("settings_title")} description={t("settings_desc")} />

			<div className="flex flex-col lg:flex-row gap-6">
				{/* Vertical Tab Nav */}
				<div className="lg:w-56 shrink-0">
					<nav className="bg-card border border-border rounded-xl overflow-hidden">
						{tabs.map(tab => {
							const Icon = tab.icon;
							const isActive = activeTab === tab.id;
							return (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-border last:border-0
                    ${isActive ? "bg-primary/10 text-primary font-semibold border-l-2 border-l-primary" : "hover:bg-muted/50 text-muted-foreground"}`}
								>
									<Icon className="w-4 h-4 shrink-0" />
									<span className="truncate">{t(tab.label)}</span>
								</button>
							);
						})}
					</nav>
				</div>

				{/* Tab Content */}
				<div className="flex-1 min-w-0">
					<div className="bg-card border border-border rounded-xl p-6">
						{renderTab()}
					</div>
				</div>
			</div>
		</div>
	);
}