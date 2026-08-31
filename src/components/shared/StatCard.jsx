import { cn } from "@/lib/utils";

export default function StatCard({ title, value, icon: Icon, trend, className }) {
	return (
		<div className={cn(
			"bg-card rounded-xl border border-border p-5 transition-shadow hover:shadow-md",
			className
		)}>
			<div className="flex items-start justify-between">
				<div>
					<p className="text-sm text-muted-foreground font-medium">{title}</p>
					<p className="text-3xl font-bold mt-2 font-heading tracking-tight">{value}</p>
					{trend && (
						<p className="text-xs text-muted-foreground mt-2">{trend}</p>
					)}
				</div>
				{Icon && (
					<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
						<Icon className="w-5 h-5 text-primary" />
					</div>
				)}
			</div>
		</div>
	);
}