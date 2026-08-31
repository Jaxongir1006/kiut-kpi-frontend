import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, User, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { loginThunk, clearError } from "@/features/auth/authSlice";

export default function Login() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	useEffect(() => {
		if (isAuthenticated) {
			navigate("/", { replace: true });
		}
	}, [isAuthenticated, navigate]);

	useEffect(() => {
		return () => {
			dispatch(clearError());
		};
	}, [dispatch]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		dispatch(loginThunk({ username, password }));
	};

	return (
		<AuthLayout
			icon={LogIn}
			title="Xush kelibsiz"
			subtitle="Hisobingizga kiring"
			footer={null}
		>
			{error && (
				<div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
					{typeof error === "string" ? error : "Login yoki parol noto'g'ri"}
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="username">Login</Label>
					<div className="relative">
						<User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
						<Input
							id="username"
							type="text"
							autoComplete="username"
							autoFocus
							placeholder="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="pl-10 h-12"
							required
						/>
					</div>
				</div>
				<div className="space-y-2">
					<Label htmlFor="password">Parol</Label>
					<div className="relative">
						<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
						<Input
							id="password"
							type="password"
							autoComplete="current-password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="pl-10 h-12"
							required
						/>
					</div>
				</div>
				<Button type="submit" className="w-full h-12 font-medium" disabled={isLoading}>
					{isLoading ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							Kirish...
						</>
					) : (
						"Kirish"
					)}
				</Button>
			</form>
		</AuthLayout>
	);
}
