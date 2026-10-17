
import Link from "next/link";

export default function Navbar() {
    return (
        <header className="border-b border-slate-200 bg-white">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <Link href="/" className="text-xl font-bold text-slate-900">
                    Fin<span className="text-emerald-600">Track</span>
                </Link>

                <div className="hidden items-center gap-8 md:flex">
                    <a href="#features" className="text-sm text-slate-600">
                        Features
                    </a>
                    <a href="#how-it-works" className="text-sm text-slate-600">
                        How it works
                    </a>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-sm font-medium text-slate-700">
                        Login
                    </Link>
                    <Link
                        href="/register"
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>
        </header>
    );
}
