
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-7xl px-6 py-12">
                <div className="grid gap-10 sm:grid-cols-3">

                    {/* Brand */}
                    <div>
                        <Link href="/" className="text-xl font-bold text-slate-900">
                            FinTrack <span className="text-emerald-600">AI</span>
                        </Link>

                        <p className="mt-3 max-w-xs text-sm leading-6 text-slate-600">
                            Understand your spending, manage your budgets,
                            and make smarter financial decisions.
                        </p>
                    </div>

                    {/* Product links */}
                    <div>
                        <h3 className="font-semibold text-slate-900">
                            Product
                        </h3>

                        <ul className="mt-4 space-y-3 text-sm text-slate-600">
                            <li>
                                <a href="#features" className="hover:text-emerald-600">
                                    Features
                                </a>
                            </li>
                            <li>
                                <a href="#how-it-works" className="hover:text-emerald-600">
                                    How it works
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Account links */}
                    <div>
                        <h3 className="font-semibold text-slate-900">
                            Account
                        </h3>

                        <ul className="mt-4 space-y-3 text-sm text-slate-600">
                            <li>
                                <Link href="/login" className="hover:text-emerald-600">
                                    Login
                                </Link>
                            </li>
                            <li>
                                <Link href="/register" className="hover:text-emerald-600">
                                    Create account
                                </Link>
                            </li>
                        </ul>
                    </div>

                </div>

                <div className="mt-10 border-slate-500 pt-6 text-sm text-slate-500">
                    <p>
                        © {new Date().getFullYear()} FinTrack AI. All rights reserved.
                    </p>
                    <p className="mt-2">
                        Personal finance insights, made simple.
                    </p>
                </div>
            </div>
        </footer>
    );
}
