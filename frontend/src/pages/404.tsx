// src/pages/404.tsx

import { Atom, FlaskConical, Telescope } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const logo = "fake-logo.png"; // Replace with actual logo path

export default function NotFoundPage() {
	return (
		<div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800">
			{/* Subtle grid background */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
				style={{
					backgroundImage:
						"radial-gradient(circle at 1px 1px, rgba(2,6,23,0.08) 1px, transparent 1px)",
					backgroundSize: "22px 22px",
				}}
			/>

			{/* Header / Logo */}
			<header className="relative z-10 flex items-center justify-center pt-10">
				<Link to="/" className="inline-flex items-center gap-3 group">
					<img
						src={logo}
						alt="."
						className="h-10 w-10 rounded-md transition-transform duration-300 group-hover:scale-105"
					/>
					<span className="text-sm tracking-widest uppercase text-slate-500">
						Sharks
					</span>
				</Link>
			</header>

			{/* Main */}
			<main className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center md:py-24">
				{/* Animated Atom */}
				<AnimatedAtom className="mb-8 h-40 w-40 md:h-56 md:w-56" />

				{/* Code headline */}
				<div className="flex items-center gap-2 text-slate-500">
					<FlaskConical className="h-4 w-4" />
					<span className="text-xs tracking-widest uppercase">Status</span>
				</div>

				<h1 className="mt-2 font-mono text-5xl font-semibold tracking-tight text-slate-900 md:text-6xl">
					404 <span className="text-slate-400">{"// 4.04e2"}</span>
				</h1>

				<p className="mx-auto mt-4 max-w-xl text-balance text-slate-600">
					Experiment not found. The requested route fell outside our parameter
					space. Recalibrate your coordinates or return to a known manifold.
				</p>

				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
					<Button asChild>
						<Link to="/">Return to Dashboard</Link>
					</Button>
				</div>

				{/* Footer hint */}
				<div className="mt-10 flex items-center gap-2 text-sm text-slate-400">
					<Telescope className="h-4 w-4" />
					<span>Keep exploring—the unknown is where science thrives.</span>
				</div>
			</main>

			{/* Decorative corner atoms */}
			<CornerOrbits />
		</div>
	);
}

/** ====== Visuals ====== */

/**
 * Animated atom: three orbits + electrons.
 * Uses built-in Tailwind keyframe 'spin' with arbitrary-duration animations.
 */
function AnimatedAtom({ className = "" }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 200 200"
			className={className}
			role="img"
			aria-label="Animated atom"
		>
			<defs>
				<radialGradient id="nucleus" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.9" />
					<stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0.15" />
				</radialGradient>
			</defs>

			{/* Nucleus */}
			<circle cx="100" cy="100" r="12" fill="url(#nucleus)" />

			{/* Orbit 1 */}
			<g className="origin-center animate-[spin_18s_linear_infinite]">
				<ellipse
					cx="100"
					cy="100"
					rx="70"
					ry="30"
					fill="none"
					stroke="rgb(148,163,184)"
					strokeOpacity="0.55"
				/>
				<circle cx="170" cy="100" r="4" fill="rgb(99,102,241)" />
			</g>

			{/* Orbit 2 (tilted) */}
			<g
				className="origin-center animate-[spin_24s_linear_infinite]"
				transform="rotate(60,100,100)"
			>
				<ellipse
					cx="100"
					cy="100"
					rx="70"
					ry="30"
					fill="none"
					stroke="rgb(148,163,184)"
					strokeOpacity="0.55"
				/>
				<circle cx="170" cy="100" r="4" fill="rgb(14,165,233)" />
			</g>

			{/* Orbit 3 (tilted) */}
			<g
				className="origin-center animate-[spin_30s_linear_infinite]"
				transform="rotate(120,100,100)"
			>
				<ellipse
					cx="100"
					cy="100"
					rx="70"
					ry="30"
					fill="none"
					stroke="rgb(148,163,184)"
					strokeOpacity="0.55"
				/>
				<circle cx="170" cy="100" r="4" fill="rgb(34,197,94)" />
			</g>
		</svg>
	);
}

/**
 * Tasteful corner decorations—kept very subtle to avoid stealing focus.
 */
function CornerOrbits() {
	return (
		<>
			<div className="pointer-events-none absolute -left-10 -top-10 opacity-20 md:opacity-30">
				<MiniOrbit />
			</div>
			<div className="pointer-events-none absolute -bottom-12 -right-10 opacity-10 md:opacity-20">
				<MiniOrbit />
			</div>
		</>
	);
}

function MiniOrbit() {
	return (
		<div className="relative h-40 w-40">
			<Atom className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-slate-400" />
			<div className="absolute inset-0 rounded-full border border-slate-300/40" />
			<div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-sky-400 shadow-sm shadow-sky-300/50 animate-[spin_12s_linear_infinite] origin-[50%_100%]" />
		</div>
	);
}
