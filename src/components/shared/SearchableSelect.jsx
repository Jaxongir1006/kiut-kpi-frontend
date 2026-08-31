import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchableSelect({ value, onValueChange, options = [], placeholder = "Tanlang...", disabled = false }) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const containerRef = useRef(null);
	const inputRef = useRef(null);

	const selected = options.find((o) => o.value === value);

	const filtered = options.filter((o) =>
		o.label.toLowerCase().includes(search.toLowerCase())
	);

	useEffect(() => {
		if (open && inputRef.current) {
			inputRef.current.focus();
		}
	}, [open]);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (containerRef.current && !containerRef.current.contains(e.target)) {
				setOpen(false);
				setSearch("");
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSelect = (optValue) => {
		onValueChange(optValue === value ? "" : optValue);
		setOpen(false);
		setSearch("");
	};

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				disabled={disabled}
				onClick={() => setOpen((prev) => !prev)}
				className={cn(
					"flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background",
					"focus:outline-none focus:ring-1 focus:ring-ring",
					"disabled:cursor-not-allowed disabled:opacity-50",
					!selected && "text-muted-foreground"
				)}
			>
				<span className="truncate">{selected ? selected.label : placeholder}</span>
				<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
			</button>

			{open && (
				<div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md">
					<div className="flex items-center border-b border-border px-3 py-2 gap-2">
						<Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
						<input
							ref={inputRef}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Qidirish..."
							className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
						/>
					</div>
					<div className="max-h-52 overflow-y-auto py-1">
						{filtered.length === 0 ? (
							<p className="px-3 py-6 text-center text-sm text-muted-foreground">Natija topilmadi</p>
						) : (
							filtered.map((o) => (
								<button
									key={o.value}
									type="button"
									onClick={() => handleSelect(o.value)}
									className={cn(
										"flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-left",
										value === o.value && "bg-accent text-accent-foreground font-medium"
									)}
								>
									<Check className={cn("h-3.5 w-3.5 shrink-0", value === o.value ? "opacity-100" : "opacity-0")} />
									<span className="truncate">{o.label}</span>
								</button>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}
