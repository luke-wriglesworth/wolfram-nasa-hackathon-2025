// src/pages/404.tsx
import { Button } from "@/components/ui/button";

const logo = "/assets/sharks-from-space-logo.png";

export default function NotFoundPage() {
	return (
		<div className="min-h-screen bg-slate-50 text-slate-800">
			<header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
				<a href="/" className="inline-flex items-center gap-3">
					<img src={logo} alt="" className="h-9 w-9 rounded-md" />
					<span className="font-semibold tracking-tight">Sharks From Space</span>
				</a>
				<Badge>NASA Space Apps 2025</Badge>
			</header>

			<main className="mx-auto flex max-w-5xl flex-1 flex-col items-center px-6 py-16 text-center">
				<SimpleOrbit className="mb-8 h-24 w-24" />
				<h1 className="font-mono text-5xl font-bold tracking-tight text-slate-900 md:text-6xl">404</h1>
				<p className="mt-3 text-lg text-slate-600">This page drifted off-orbit. Let’s navigate you back to safe waters.</p>

				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
					<Button asChild>
						<a href="/">Return Home</a>
					</Button>
				</div>

				<div className="mt-10 text-sm text-slate-500">
					<span className="mr-1">🦈</span>
					<span>Track sharks. Protect oceans. Keep exploring.</span>
				</div>
			</main>

			<footer className="mx-auto max-w-5xl px-6 pb-10 pt-6 text-center text-xs text-slate-400">
				<p>Built for the NASA Space Apps Challenge 2025. Project: Sharks From Space.</p>
			</footer>
		</div>
	);
}

function Badge({ children }: { children: React.ReactNode }) {
	return (
		<span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
			{children}
		</span>
	);
}

function SimpleOrbit({ className = "" }: { className?: string }) {
	return (
		<svg viewBox="0 0 120 120" className={className} role="img" aria-label="simple orbit">
			<defs>
				<radialGradient id="core" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.9" />
					<stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0.1" />
				</radialGradient>
			</defs>
			<circle cx="60" cy="60" r="8" fill="url(#core)" />
			<g className="origin-center animate-[spin_16s_linear_infinite]">
				<ellipse cx="60" cy="60" rx="42" ry="18" fill="none" stroke="rgb(148,163,184)" strokeOpacity="0.5" />
				<circle cx="102" cy="60" r="3" fill="rgb(14,165,233)" />
			</g>
		</svg>
	);
}
