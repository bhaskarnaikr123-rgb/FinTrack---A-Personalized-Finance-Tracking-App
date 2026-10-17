import Link from "next/link";

export default function HeroSection() {
    return (
        <section className="bg-white">
            <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">

                {/* Left: Hero content */}
                <div>
                    <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-emerald-600">
                        Personal Finance, Simplified
                    </p>

                    <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                        Take control of your money.
                        <span className="text-emerald-600">
                            {" "}Build your future.
                        </span>
                    </h1>

                    <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
                        Track your expenses, manage your budgets, and understand
                        your spending habits — all in one simple dashboard.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <Link
                            href="/register"
                            className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
                        >
                            Get Started Free
                        </Link>

                        <a
                            href="#features"
                            className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
                            Explore Features
                        </a>
                    </div>

                    <p className="mt-5 text-sm text-slate-500">
                        Simple tracking. Clear insights. Smarter decisions.
                    </p>
                </div>

                {/* Right: Dashboard preview */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-xl sm:p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">
                                Total Balance
                            </p>
                            <h2 className="mt-2 text-3xl font-bold text-slate-900">
                                ₹42,850
                            </h2>
                        </div>

                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                            +12.5%
                        </span>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="rounded-xl bg-white p-4 shadow-sm">
                            <p className="text-sm text-slate-500">Income</p>
                            <p className="mt-2 text-xl font-bold text-slate-900">
                                ₹55,000
                            </p>
                            <p className="mt-1 text-xs text-emerald-600">
                                This month
                            </p>
                        </div>

                        <div className="rounded-xl bg-white p-4 shadow-sm">
                            <p className="text-sm text-slate-500">Expenses</p>
                            <p className="mt-2 text-xl font-bold text-slate-900">
                                ₹12,150
                            </p>
                            <p className="mt-1 text-xs text-red-500">
                                This month
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
                        <p className="font-semibold text-slate-800">
                            Spending overview
                        </p>

                        <div className="mt-5 flex h-28 items-end gap-3">
                            <div className="h-12 flex-1 rounded-t-md bg-emerald-200" />
                            <div className="h-20 flex-1 rounded-t-md bg-emerald-400" />
                            <div className="h-16 flex-1 rounded-t-md bg-emerald-300" />
                            <div className="h-24 flex-1 rounded-t-md bg-emerald-600" />
                            <div className="h-14 flex-1 rounded-t-md bg-emerald-300" />
                            <div className="h-18 flex-1 rounded-t-md bg-emerald-400" />
                        </div>

                        <div className="mt-3 flex justify-between text-xs text-slate-400">
                            <span>Jan</span>
                            <span>Feb</span>
                            <span>Mar</span>
                            <span>Apr</span>
                            <span>May</span>
                            <span>Jun</span>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}