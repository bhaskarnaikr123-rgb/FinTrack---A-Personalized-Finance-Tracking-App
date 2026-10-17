
const steps = [
    {
        number: "01",
        title: "Create your account",
        description:
            "Register securely and set up your personal finance workspace.",
    },
    {
        number: "02",
        title: "Track your transactions",
        description:
            "Record income and expenses, organize transactions, and manage budgets.",
    },
    {
        number: "03",
        title: "Understand your finances",
        description:
            "Explore spending summaries and discover patterns in your financial habits.",
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="bg-white py-24">
            <div className="mx-auto max-w-7xl px-6">

                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
                        Simple by design
                    </p>

                    <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Get started in three simple steps
                    </h2>

                    <p className="mt-4 text-lg leading-8 text-slate-600">
                        From your first transaction to a clearer picture
                        of your finances, everything stays simple.
                    </p>
                </div>

                <div className="mt-16 grid gap-8 md:grid-cols-3">
                    {steps.map((step) => (
                        <article key={step.number} className="relative">
                            <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-lg font-bold text-emerald-700">
                                {step.number}
                            </div>

                            <h3 className="text-xl font-bold text-slate-900">
                                {step.title}
                            </h3>

                            <p className="mt-3 leading-7 text-slate-600">
                                {step.description}
                            </p>
                        </article>
                    ))}
                </div>

            </div>
        </section>
    );
}
