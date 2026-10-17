"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

type ApiTransaction = {
    id: number;
    title: string;
    category: string;
    date: string;
    amount: number;
    type: "income" | "expense";
};

type Transaction = {
    id: number;
    title: string;
    category: string;
    date: string;
    amount: number;
};

type CategoryExpense = {
    category: string;
    total: number;
};

type AnalyticsSummary = {
    total_income: number;
    total_expenses: number;
    net_savings: number;
    expenses_by_category: CategoryExpense[];
};

type MonthlyAnalytics = {
    month: string;
    income: number;
    expenses: number;
};

type MonthlySummary = {
    month: string;
    income: number;
    expenses: number;
    savings: number;
};

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const CHART_COLORS = [
    "#10B981",
    "#3B82F6",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#F97316",
];

const currentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(
        now.getMonth() + 1
    ).padStart(2, "0")}`;
};

const today = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(
        now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const formatMoney = (amount: number) =>
    `₹${Math.abs(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

function toDashboardTransaction(item: ApiTransaction): Transaction {
    return {
        id: item.id,
        title: item.title,
        category: item.category,
        date: item.date,
        amount:
            item.type === "income"
                ? Number(item.amount)
                : -Number(item.amount),
    };
}

export default function DashboardPage() {
    const router = useRouter();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
    const [monthlyCategories, setMonthlyCategories] =
        useState<CategoryExpense[]>([]);
    const [monthlyAnalytics, setMonthlyAnalytics] =
        useState<MonthlyAnalytics[]>([]);

    // Independent month selectors: one for the summary, one for the pie chart.
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [pieSelectedMonth, setPieSelectedMonth] = useState(currentMonth);

    const [monthlySummary, setMonthlySummary] =
        useState<MonthlySummary | null>(null);

    const [summaryLoading, setSummaryLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [userName, setUserName] = useState("");

    const [type, setType] = useState<"Expense" | "Income">("Expense");
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Food");
    const [date, setDate] = useState(today);

    const handleUnauthorized = useCallback(() => {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        router.replace("/login");
    }, [router]);

    const loadAnalytics = useCallback(async () => {
        const token = sessionStorage.getItem("access_token");

        if (!token) {
            handleUnauthorized();
            return;
        }

        try {
            const response = await fetch(`${API_URL}/analytics/summary`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error("Could not load financial analytics.");
            }

            const data: AnalyticsSummary = await response.json();
            setAnalytics(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not load financial analytics."
            );
        }
    }, [handleUnauthorized]);

    const loadMonthlyAnalytics = useCallback(async () => {
        const token = sessionStorage.getItem("access_token");

        if (!token) {
            handleUnauthorized();
            return;
        }

        try {
            const response = await fetch(`${API_URL}/analytics/monthly`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error("Could not load monthly analytics.");
            }

            const data: MonthlyAnalytics[] = await response.json();
            setMonthlyAnalytics(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not load monthly analytics."
            );
        }
    }, [handleUnauthorized]);

    const loadMonthlySummary = useCallback(async () => {
        const token = sessionStorage.getItem("access_token");

        if (!token) {
            handleUnauthorized();
            setSummaryLoading(false);
            return;
        }

        setSummaryLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/analytics/monthly-summary?month=${selectedMonth}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error("Could not load the monthly summary.");
            }

            const data: MonthlySummary = await response.json();
            setMonthlySummary(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not load the monthly summary."
            );
        } finally {
            setSummaryLoading(false);
        }
    }, [selectedMonth, handleUnauthorized]);

    // This endpoint returns expenses grouped by category for the selected pie-chart month.
    const loadMonthlyCategories = useCallback(async () => {
        const token = sessionStorage.getItem("access_token");

        if (!token) {
            handleUnauthorized();
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/analytics/monthly-categories?month=${pieSelectedMonth}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error("Could not load monthly category expenses.");
            }

            const data: CategoryExpense[] = await response.json();
            setMonthlyCategories(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not load monthly category expenses."
            );
        }
    }, [pieSelectedMonth, handleUnauthorized]);

    useEffect(() => {
        void loadMonthlySummary();
    }, [loadMonthlySummary]);

    useEffect(() => {
        void loadMonthlyCategories();
    }, [loadMonthlyCategories]);

    const loadTransactions = useCallback(async () => {
        const token = sessionStorage.getItem("access_token");

        if (!token) {
            handleUnauthorized();
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/transactions`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error("Could not load transactions.");
            }

            const data: ApiTransaction[] = await response.json();
            setTransactions(data.map(toDashboardTransaction));
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to connect to the backend."
            );
        } finally {
            setLoading(false);
        }
    }, [handleUnauthorized]);

    useEffect(() => {
        let cancelled = false;

        async function initializeDashboard() {
            const token = sessionStorage.getItem("access_token");

            if (!token) {
                router.replace("/login");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (cancelled) return;

                if (response.status === 401) {
                    handleUnauthorized();
                    return;
                }

                if (!response.ok) {
                    throw new Error("Unable to verify your session.");
                }

                const data = await response.json();

                if (!cancelled) {
                    setUserName(data?.user?.name || "");
                    await loadTransactions();
                    await loadAnalytics();
                    await loadMonthlyAnalytics();
                }
            } catch {
                if (!cancelled) {
                    setError(
                        "Unable to connect to the backend. Check that FastAPI is running."
                    );
                    setLoading(false);
                }
            }
        }

        void initializeDashboard();

        return () => {
            cancelled = true;
        };
    }, [
        router,
        handleUnauthorized,
        loadTransactions,
        loadAnalytics,
        loadMonthlyAnalytics,
    ]);

    const refreshDashboard = useCallback(async () => {
        await Promise.all([
            loadTransactions(),
            loadAnalytics(),
            loadMonthlyAnalytics(),
            loadMonthlySummary(),
            loadMonthlyCategories(),
        ]);
    }, [
        loadTransactions,
        loadAnalytics,
        loadMonthlyAnalytics,
        loadMonthlySummary,
        loadMonthlyCategories,
    ]);

    function handleLogout() {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        router.replace("/login");
    }

    function resetForm() {
        setEditingId(null);
        setTitle("");
        setAmount("");
        setType("Expense");
        setCategory("Food");
        setDate(today());
        setShowForm(false);
    }

    function startEditing(transaction: Transaction) {
        setError("");
        setSuccess("");
        setEditingId(transaction.id);
        setTitle(transaction.title);
        setAmount(String(Math.abs(transaction.amount)));
        setType(transaction.amount >= 0 ? "Income" : "Expense");
        setCategory(transaction.category);
        setDate(transaction.date);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const numericAmount = Number(amount);

        if (
            !title.trim() ||
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            setError("Enter a valid description and positive amount.");
            return;
        }

        const token = sessionStorage.getItem("access_token");

        if (!token) {
            handleUnauthorized();
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const isEditing = editingId !== null;
            const url = isEditing
                ? `${API_URL}/transactions/${editingId}`
                : `${API_URL}/transactions`;

            const response = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: title.trim(),
                    category,
                    amount: numericAmount,
                    type: type.toLowerCase(),
                    date,
                }),
            });

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                const detail = await response.json().catch(() => null);
                const message = Array.isArray(detail?.detail)
                    ? detail.detail
                        .map((item: { msg?: string }) => item.msg || "")
                        .join(", ")
                    : detail?.detail;

                throw new Error(
                    message ||
                    (isEditing
                        ? "Could not update the transaction."
                        : "Could not save the transaction.")
                );
            }

            resetForm();
            await refreshDashboard();

            setSuccess(
                isEditing
                    ? "Transaction updated successfully."
                    : "Transaction added successfully."
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(transaction: Transaction) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${transaction.title}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        const token = sessionStorage.getItem("access_token");

        if (!token) {
            handleUnauthorized();
            return;
        }

        setDeletingId(transaction.id);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${API_URL}/transactions/${transaction.id}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                const detail = await response.json().catch(() => null);
                throw new Error(
                    detail?.detail || "Could not delete the transaction."
                );
            }

            if (editingId === transaction.id) {
                resetForm();
            }

            await refreshDashboard();
            setSuccess("Transaction deleted successfully.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while deleting."
            );
        } finally {
            setDeletingId(null);
        }
    }

    const income = transactions
        .filter((transaction) => transaction.amount > 0)
        .reduce((total, transaction) => total + transaction.amount, 0);

    const expenses = transactions
        .filter((transaction) => transaction.amount < 0)
        .reduce(
            (total, transaction) => total + Math.abs(transaction.amount),
            0
        );

    const balance = transactions.reduce(
        (total, transaction) => total + transaction.amount,
        0
    );

    const summary = [
        { title: "Total balance", amount: balance },
        { title: "Total income", amount: income },
        { title: "Total expenses", amount: expenses },
        { title: "Savings", amount: income - expenses },
    ];

    return (
        <main className="min-h-screen bg-slate-50 px-5 py-8 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-7xl">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Fin<span className="text-emerald-600">Track</span>- A Personalized Financial Tracking App
                            {/* <span className="text-emerald-600">AI</span> */}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Your personal finance dashboard
                            {userName ? ` · Welcome, ${userName}` : ""}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                            Logout
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setError("");
                                setSuccess("");

                                if (showForm) {
                                    resetForm();
                                } else {
                                    setEditingId(null);
                                    setTitle("");
                                    setAmount("");
                                    setType("Expense");
                                    setCategory("Food");
                                    setDate(today());
                                    setShowForm(true);
                                }
                            }}
                            className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            {showForm ? "Cancel" : "+ Add transaction"}
                        </button>
                    </div>
                </header>

                {error && (
                    <div
                        role="alert"
                        className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        {error}
                        <button
                            type="button"
                            onClick={() => void loadTransactions()}
                            className="ml-3 font-semibold underline"
                        >
                            Retry loading
                        </button>
                    </div>
                )}

                {success && (
                    <div
                        role="status"
                        className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
                    >
                        {success}
                    </div>
                )}

                {showForm && (
                    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-slate-900">
                            {editingId !== null
                                ? "Edit transaction"
                                : "Add a transaction"}
                        </h2>

                        <form
                            onSubmit={handleSubmit}
                            className="mt-5 grid gap-5 sm:grid-cols-2"
                        >
                            <div>
                                <label
                                    htmlFor="type"
                                    className="mb-2 block text-sm font-medium"
                                >
                                    Transaction type
                                </label>
                                <select
                                    id="type"
                                    value={type}
                                    onChange={(event) => {
                                        const nextType = event.target
                                            .value as "Expense" | "Income";
                                        setType(nextType);
                                        setCategory(
                                            nextType === "Income"
                                                ? "Salary"
                                                : "Food"
                                        );
                                    }}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3"
                                >
                                    <option value="Expense">Expense</option>
                                    <option value="Income">Income</option>
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="title"
                                    className="mb-2 block text-sm font-medium"
                                >
                                    Description
                                </label>
                                <input
                                    id="title"
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(event.target.value)
                                    }
                                    placeholder="e.g. Groceries"
                                    required
                                    maxLength={100}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="amount"
                                    className="mb-2 block text-sm font-medium"
                                >
                                    Amount (₹)
                                </label>
                                <input
                                    id="amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={amount}
                                    onChange={(event) =>
                                        setAmount(event.target.value)
                                    }
                                    placeholder="e.g. 850"
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="category"
                                    className="mb-2 block text-sm font-medium"
                                >
                                    Category
                                </label>
                                <select
                                    id="category"
                                    value={category}
                                    onChange={(event) =>
                                        setCategory(event.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3"
                                >
                                    {(type === "Income"
                                        ? [
                                            "Salary",
                                            "Freelance",
                                            "Investment",
                                            "Other",
                                        ]
                                        : [
                                            "Food",
                                            "Shopping",
                                            "Bills",
                                            "Transport",
                                            "Health",
                                            "Other",
                                        ]
                                    ).map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}

                                    {!(
                                        type === "Income"
                                            ? [
                                                "Salary",
                                                "Freelance",
                                                "Investment",
                                                "Other",
                                            ]
                                            : [
                                                "Food",
                                                "Shopping",
                                                "Bills",
                                                "Transport",
                                                "Health",
                                                "Other",
                                            ]
                                    ).includes(category) && (
                                            <option value={category}>
                                                {category}
                                            </option>
                                        )}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="date"
                                    className="mb-2 block text-sm font-medium"
                                >
                                    Date
                                </label>
                                <input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(event) =>
                                        setDate(event.target.value)
                                    }
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3"
                                />
                            </div>

                            <div className="flex items-end gap-3">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId !== null
                                            ? "Save changes"
                                            : "Save transaction"}
                                </button>

                                {editingId !== null && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        disabled={saving}
                                        className="rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </section>
                )}

                <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">
                                Monthly Financial Summary
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                View income, expenses, and savings for a specific month.
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="selectedMonth"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Select month
                            </label>
                            <input
                                id="selectedMonth"
                                type="month"
                                value={selectedMonth}
                                onChange={(event) => {
                                    if (event.target.value) {
                                        setSelectedMonth(event.target.value);
                                        setError("");
                                    }
                                }}
                                className="rounded-lg border border-slate-300 px-4 py-2"
                            />
                        </div>
                    </div>

                    {summaryLoading ? (
                        <p className="mt-6 text-sm text-slate-500">
                            Loading monthly summary...
                        </p>
                    ) : monthlySummary ? (
                        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                            <article className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                                <p className="text-sm text-emerald-700">
                                    Monthly income
                                </p>
                                <p className="mt-2 text-2xl font-bold text-emerald-800">
                                    {formatMoney(monthlySummary.income)}
                                </p>
                            </article>

                            <article className="rounded-xl border border-orange-100 bg-orange-50 p-5">
                                <p className="text-sm text-orange-700">
                                    Monthly expenses
                                </p>
                                <p className="mt-2 text-2xl font-bold text-orange-800">
                                    {formatMoney(monthlySummary.expenses)}
                                </p>
                            </article>

                            <article
                                className={`rounded-xl border p-5 ${monthlySummary.savings >= 0
                                    ? "border-blue-100 bg-blue-50"
                                    : "border-red-100 bg-red-50"
                                    }`}
                            >
                                <p
                                    className={`text-sm ${monthlySummary.savings >= 0
                                        ? "text-blue-700"
                                        : "text-red-700"
                                        }`}
                                >
                                    Monthly savings
                                </p>
                                <p
                                    className={`mt-2 text-2xl font-bold ${monthlySummary.savings >= 0
                                        ? "text-blue-800"
                                        : "text-red-800"
                                        }`}
                                >
                                    {monthlySummary.savings < 0 ? "-" : ""}
                                    {formatMoney(monthlySummary.savings)}
                                </p>
                            </article>
                        </div>
                    ) : (
                        <p className="mt-6 text-sm text-slate-500">
                            No monthly summary available.
                        </p>
                    )}
                </section>

                <section className="mt-10">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Financial overview
                    </h2>

                    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        {summary.map((item) => (
                            <article
                                key={item.title}
                                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                            >
                                <p className="text-sm text-slate-500">
                                    {item.title}
                                </p>
                                <p className="mt-3 text-2xl font-bold text-slate-900">
                                    {item.amount < 0 ? "-" : ""}
                                    {formatMoney(item.amount)}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">
                                Spending by Category
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                See how your expenses are distributed.
                            </p>
                        </div>

                        {/* This selector controls only the pie chart. */}
                        <input
                            type="month"
                            aria-label="Select month for spending chart"
                            value={pieSelectedMonth}
                            onChange={(event) => {
                                if (event.target.value) {
                                    setPieSelectedMonth(event.target.value);
                                    setError("");
                                }
                            }}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div className="mt-6 h-80">
                        {!analytics ? (
                            <p className="py-12 text-center text-slate-500">
                                Loading spending analytics...
                            </p>
                        ) : monthlyCategories.length === 0 ? (
                            <p className="py-12 text-center text-slate-500">
                                No expenses found for this month.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={monthlyCategories}
                                        dataKey="total"
                                        nameKey="category"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ name, percent }) =>
                                            `${name}: ${(
                                                (percent ?? 0) * 100
                                            ).toFixed(0)}%`
                                        }
                                    >
                                        {monthlyCategories.map(
                                            (item, index) => (
                                                <Cell
                                                    key={item.category}
                                                    fill={
                                                        CHART_COLORS[
                                                        index %
                                                        CHART_COLORS.length
                                                        ]
                                                    }
                                                />
                                            )
                                        )}
                                    </Pie>

                                    <Tooltip
                                        formatter={(value) =>
                                            `₹${Number(value).toLocaleString(
                                                "en-IN"
                                            )}`
                                        }
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </section>

                <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Monthly Income vs. Expenses
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Compare your income and spending month by month.
                    </p>

                    <div className="mt-6 h-80">
                        {monthlyAnalytics.length === 0 ? (
                            <p className="py-12 text-center text-slate-500">
                                No monthly transaction data available yet.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={monthlyAnalytics}
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: 10,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="month"
                                        tickFormatter={(month: string) => {
                                            const [year, monthNumber] =
                                                month.split("-");
                                            return new Date(
                                                Number(year),
                                                Number(monthNumber) - 1
                                            ).toLocaleDateString("en-IN", {
                                                month: "short",
                                                year: "2-digit",
                                            });
                                        }}
                                    />
                                    <YAxis
                                        tickFormatter={(value: number) =>
                                            `₹${value.toLocaleString("en-IN")}`
                                        }
                                    />
                                    <Tooltip
                                        formatter={(value) =>
                                            `₹${Number(value).toLocaleString(
                                                "en-IN"
                                            )}`
                                        }
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="income"
                                        name="Income"
                                        fill="#10B981"
                                        radius={[5, 5, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="expenses"
                                        name="Expenses"
                                        fill="#F97316"
                                        radius={[5, 5, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </section>

                <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Recent transactions
                    </h2>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500">
                                    <th className="pb-4 font-medium">
                                        Transaction
                                    </th>
                                    <th className="pb-4 font-medium">
                                        Category
                                    </th>
                                    <th className="pb-4 font-medium">Date</th>
                                    <th className="pb-4 text-right font-medium">
                                        Amount
                                    </th>
                                    <th className="pb-4 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-slate-500"
                                        >
                                            Loading transactions...
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-slate-500"
                                        >
                                            No transactions yet. Add your first
                                            transaction!
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((transaction) => (
                                        <tr
                                            key={transaction.id}
                                            className="border-b border-slate-100 last:border-0"
                                        >
                                            <td className="py-5 font-medium text-slate-900">
                                                {transaction.title}
                                            </td>
                                            <td className="py-5 text-slate-600">
                                                {transaction.category}
                                            </td>
                                            <td className="py-5 text-slate-500">
                                                {transaction.date}
                                            </td>
                                            <td
                                                className={`py-5 text-right font-semibold ${transaction.amount > 0
                                                    ? "text-emerald-600"
                                                    : "text-red-600"
                                                    }`}
                                            >
                                                {transaction.amount > 0
                                                    ? "+"
                                                    : "−"}
                                                {formatMoney(transaction.amount)}
                                            </td>
                                            <td className="py-5">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            startEditing(
                                                                transaction
                                                            )
                                                        }
                                                        disabled={
                                                            saving ||
                                                            deletingId !== null
                                                        }
                                                        className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void handleDelete(
                                                                transaction
                                                            )
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            transaction.id ||
                                                            saving ||
                                                            deletingId !== null
                                                        }
                                                        className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                    >
                                                        {deletingId ===
                                                            transaction.id
                                                            ? "Deleting..."
                                                            : "Delete"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}