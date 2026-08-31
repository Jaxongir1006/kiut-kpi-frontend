import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TrendingUp, Loader2 } from "lucide-react";
import { fetchSubmissions } from "@/features/submissions/submissionsSlice";
import { useUserRole } from "@/hooks/useUserRole";
import ErrorState from "@/components/shared/ErrorState";

export default function MyScores() {
	const dispatch = useDispatch();
	const { teacherProfile } = useUserRole();
	const { list: submissions, isLoading, error } = useSelector((s) => s.submissions);

	useEffect(() => { dispatch(fetchSubmissions()); }, [dispatch]);

	const teacherId = teacherProfile?.id;
	// This page states an approved-points total that feeds pay decisions, so it
	// shows ONLY what the API returned. It previously substituted hardcoded
	// sample submissions whenever the list came back empty — which also fired
	// after a failed request — presenting fictional points as a real total.
	const mine = useMemo(
		() => teacherId ? submissions.filter((s) => s.teacher === teacherId || s.teacher_details?.id === teacherId) : submissions,
		[submissions, teacherId]
	);

	const approved = mine.filter((s) => s.status === "approved");
	const total = approved.reduce((a, s) => a + parseFloat(s.points || 0), 0);

	const catMap = {};
	approved.forEach((s) => {
		const name = s.activity_type_details?.name || "Boshqa";
		catMap[name] = (catMap[name] || 0) + parseFloat(s.points || 0);
	});
	const cats = Object.entries(catMap)
		.map(([name, points]) => ({ name, points: Math.round(points * 100) / 100 }))
		.sort((a, b) => b.points - a.points);

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-2xl font-bold tracking-tight">Mening ballarim</h1>
				<p className="text-muted-foreground text-sm mt-0.5">KPI ball taqsimotingiz</p>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
			) : error ? (
				<ErrorState
					title="Ballaringizni yuklab bo'lmadi"
					error={error}
					onRetry={() => dispatch(fetchSubmissions())}
				/>
			) : (
				<div className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="bg-card border border-border rounded-xl p-5 text-center">
							<p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Jami tasdiqlangan ball</p>
							<p className="text-3xl font-bold text-primary">{total.toFixed(2)}</p>
						</div>
						<div className="bg-card border border-border rounded-xl p-5 text-center">
							<p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tasdiqlangan arizalar</p>
							<p className="text-3xl font-bold">{approved.length}</p>
						</div>
						<div className="bg-card border border-border rounded-xl p-5 text-center">
							<p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">O'rtacha ball</p>
							<p className="text-3xl font-bold">{approved.length > 0 ? (total / approved.length).toFixed(1) : 0}</p>
						</div>
					</div>

					<div className="bg-card border border-border rounded-xl p-5">
						<h2 className="font-semibold mb-4">Kategoriyalar bo'yicha ball taqsimoti</h2>
						{cats.length === 0 ? (
							<div className="flex flex-col items-center py-10 text-muted-foreground">
								<TrendingUp className="w-10 h-10 mb-3 opacity-30" />
								<p className="text-sm">Tasdiqlangan faoliyatlar yo'q</p>
								<p className="text-xs mt-1">
									{mine.length === 0
										? "Hali birorta ariza topshirilmagan."
										: "Arizalaringiz hali tasdiqlanmagan."}
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{cats.map((c) => (
									<div key={c.name}>
										<div className="flex items-center justify-between text-sm mb-1">
											<span>{c.name}</span>
											<span className="font-semibold text-primary">{c.points} ball</span>
										</div>
										<div className="w-full bg-muted rounded-full h-2">
											<div className="bg-primary h-2 rounded-full" style={{ width: `${total > 0 ? (c.points / total) * 100 : 0}%` }} />
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
