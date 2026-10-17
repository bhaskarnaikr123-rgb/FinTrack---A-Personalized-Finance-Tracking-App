
const features = [
    {
        number: "01",
        title: "Expense Tracking",
        description:
            "Record your daily expenses, organize transactions, and understand where your money goes.",
    },
    {
        number: "02",
        title: "Smart Budgeting",
        description:
            "Set monthly budgets, monitor spending limits, and make more informed financial decisions.",
    },
    {
        number: "03",
        title: "Financial Analytics",
        description:
            "Explore income and expense trends with clear summaries and visual insights.",
    },
];

export default function FeaturesSection() {
    return (
        <section id="features" className="bg-slate-50 py-24">
            <div className="mx-auto max-w-7xl px-6">

                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
                        Everything in one place
                    </p>

                    <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Take charge of your finances
                    </h2>

                    <p className="mt-4 text-lg leading-8 text-slate-600">
                        The essential tools you need to track spending,
                        plan budgets, and understand your financial habits.
                    </p>
                </div>

                <div className="mt-16 grid gap-6 md:grid-cols-3">
                    {features.map((feature) => (
                        <article
                            key={feature.number}
                            className="rounded-2xl border border-slate-200 bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg"
                        >
                            <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-lg font-bold text-emerald-700">
                                {feature.number}
                            </span>

                            <h3 className="mt-5 text-xl font-bold text-slate-900">
                                {feature.title}
                            </h3>

                            <p className="mt-3 leading-7 text-slate-600">
                                {feature.description}
                            </p>
                        </article>
                    ))}
                </div>

            </div>
        </section>
    );
}
