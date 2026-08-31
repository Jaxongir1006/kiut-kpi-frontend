import { Bell } from "lucide-react";

/**
 * There is no notifications endpoint yet.
 *
 * This page used to render eight hardcoded notices — invented KPI updates,
 * invented appeal deadlines, invented rating changes — with read/unread state
 * that only lived in component state. In a system that decides pay, inventing
 * "your KPI results were updated" or an appeal deadline is worse than showing
 * nothing: a teacher can miss a real deadline while believing they have seen
 * their notifications. Until a real endpoint exists, this says so plainly.
 */
export default function Notifications() {
	return (
		<div>
			<div className="mb-6">
				<h1 className="text-2xl font-bold tracking-tight">Xabarnomalar</h1>
				<p className="text-muted-foreground text-sm mt-0.5">Muhim xabarlar va bildirishnomalar</p>
			</div>

			<div className="bg-card border border-border rounded-xl">
				<div className="flex flex-col items-center py-20 text-center text-muted-foreground">
					<Bell className="w-12 h-12 mb-3 opacity-30" />
					<p className="text-sm font-medium text-foreground">Xabarnomalar mavjud emas</p>
					<p className="text-xs mt-1 max-w-sm">
						Xabarnomalar xizmati hali ulanmagan. Arizalaringiz holatini
						"KPI natijalarim" bo'limidan, apellyatsiyalarni esa
						"Apellyatsiyalar" bo'limidan kuzatib boring.
					</p>
				</div>
			</div>
		</div>
	);
}
