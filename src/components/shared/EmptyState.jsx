import React from "react";
import { FolderOpen } from "lucide-react";

export default function EmptyState({ title = "Ma'lumot topilmadi", description, icon: Icon = FolderOpen }) {
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
				<Icon className="w-7 h-7 text-muted-foreground" />
			</div>
			<h3 className="text-base font-semibold text-foreground">{title}</h3>
			{description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
		</div>
	);
}