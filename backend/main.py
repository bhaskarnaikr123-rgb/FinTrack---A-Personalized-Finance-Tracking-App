import bcrypt
from pydantic import EmailStr

import secrets
from fastapi import HTTPException

from datetime import date
from typing import Literal

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import get_connection

import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing from backend/.env")

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

bearer_scheme = HTTPBearer()

def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )



def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )
        user_id = int(payload["sub"])

    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, name, email FROM users WHERE id = %s",
            (user_id,),
        )
        user = cursor.fetchone()

        if user is None:
            raise HTTPException(
                status_code=401,
                detail="User account not found.",
            )

        return user

    finally:
        if cursor is not None:
            cursor.close()
        connection.close()


app = FastAPI(title="FinTrack AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TransactionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    category: str = Field(min_length=1, max_length=50)
    amount: float = Field(gt=0)
    type: Literal["income", "expense"]
    date: date


class TransactionUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    category: str = Field(min_length=1, max_length=50)
    amount: float = Field(gt=0)
    type: Literal["income", "expense"]
    date: date


def format_transaction(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "category": row["category"],
        "amount": float(row["amount"]),
        "type": row["type"],
        "date": row["transaction_date"].isoformat(),
    }


@app.get("/")
def home():
    return {"message": "FinTrack AI API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}

class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

@app.post("/auth/register", status_code=201)
def register_user(user: UserRegister):
    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor()

        # Hash the password before saving it
        password_hash = bcrypt.hashpw(
            user.password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        query = """
            INSERT INTO users (name, email, password_hash)
            VALUES (%s, %s, %s)
        """

        cursor.execute(
            query,
            (user.name.strip(), user.email, password_hash)
        )

        connection.commit()

        return {
            "message": "User registered successfully",
            "user": {
                "id": cursor.lastrowid,
                "name": user.name.strip(),
                "email": user.email,
            },
        }

    except Exception as error:
        connection.rollback()

        # MySQL error 1062 means a duplicate unique value, such as email
        if getattr(error, "errno", None) == 1062:
            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists."
            ) from error

        raise HTTPException(
            status_code=500,
            detail="Could not register user."
        ) from error

    finally:
        if cursor is not None:
            cursor.close()
        connection.close()

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

@app.post("/auth/login")
def login_user(user: UserLogin):
    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id, name, email, password_hash
            FROM users
            WHERE email = %s
            """,
            (user.email,),
        )

        db_user = cursor.fetchone()

        if not db_user or not bcrypt.checkpw(
            user.password.encode("utf-8"),
            db_user["password_hash"].encode("utf-8"),
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password.",
            )

        token = create_access_token(db_user["id"])

        return {
            "message": "Login successful",
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": db_user["id"],
                "name": db_user["name"],
                "email": db_user["email"],
            },
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Could not log in.",
        ) from error

    finally:
        if cursor is not None:
            cursor.close()
        connection.close()


@app.get("/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}

@app.post("/transactions", status_code=201)
def create_transaction(
    transaction: TransactionCreate,
    current_user: dict = Depends(get_current_user),
):
    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            INSERT INTO transactions
                (user_id, title, category, amount, type, transaction_date)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                current_user["id"],
                transaction.title,
                transaction.category,
                transaction.amount,
                transaction.type,
                transaction.date,
            ),
        )

        connection.commit()
        new_id = cursor.lastrowid

        cursor.execute(
            """
            SELECT id, title, category, amount, type, transaction_date
            FROM transactions
            WHERE id = %s AND user_id = %s
            """,
            (new_id, current_user["id"]),
        )

        row = cursor.fetchone()
        return format_transaction(row)

    except Exception as error:
        connection.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not save transaction to database.",
        ) from error

    finally:
        if cursor is not None:
            cursor.close()
        connection.close()


@app.get("/transactions")
def get_transactions(
    current_user: dict = Depends(get_current_user),
):
    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id, title, category, amount, type, transaction_date
            FROM transactions
            WHERE user_id = %s
            ORDER BY transaction_date DESC, id DESC
            """,
            (current_user["id"],),
        )

        rows = cursor.fetchall()
        return [format_transaction(row) for row in rows]

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve transactions from database.",
        ) from error

    finally:
        if cursor is not None:
            cursor.close()
        connection.close()

@app.put("/transactions/{transaction_id}")
def update_transaction(
    transaction_id: int,
    transaction: TransactionUpdate,
    current_user: dict = Depends(get_current_user),
):
    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        # 1. Check that this transaction belongs to the logged-in user
        cursor.execute(
            """
            SELECT id
            FROM transactions
            WHERE id = %s AND user_id = %s
            """,
            (transaction_id, current_user["id"]),
        )

        existing_transaction = cursor.fetchone()

        if existing_transaction is None:
            raise HTTPException(
                status_code=404,
                detail="Transaction not found.",
            )

        # 2. Update the transaction
        cursor.execute(
            """
            UPDATE transactions
            SET title = %s,
                category = %s,
                amount = %s,
                type = %s,
                transaction_date = %s
            WHERE id = %s AND user_id = %s
            """,
            (
                transaction.title.strip(),
                transaction.category.strip(),
                transaction.amount,
                transaction.type,
                transaction.date,
                transaction_id,
                current_user["id"],
            ),
        )

        connection.commit()

        # 3. Fetch the updated transaction
        cursor.execute(
            """
            SELECT id, title, category, amount, type, transaction_date
            FROM transactions
            WHERE id = %s AND user_id = %s
            """,
            (transaction_id, current_user["id"]),
        )

        updated_transaction = cursor.fetchone()

        return format_transaction(updated_transaction)

    except HTTPException:
        raise

    except Exception as error:
        connection.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not update transaction.",
        ) from error

    finally:
        if cursor is not None:
            cursor.close()
        connection.close()

@app.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    current_user: dict = Depends(get_current_user),
):
    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor()

        # Delete only if the transaction belongs to this user
        cursor.execute(
            """
            DELETE FROM transactions
            WHERE id = %s AND user_id = %s
            """,
            (transaction_id, current_user["id"]),
        )

        # Check whether a transaction was actually deleted
        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Transaction not found.",
            )

        connection.commit()

        return {
            "message": "Transaction deleted successfully",
            "transaction_id": transaction_id,
        }

    except HTTPException:
        raise

    except Exception as error:
        connection.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not delete transaction.",
        ) from error

    finally:
        if cursor is not None:
            cursor.close()
        connection.close()


@app.get("/analytics/summary")
def get_analytics_summary(
    current_user: dict = Depends(get_current_user),
):
    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        # Calculate income and expenses for the logged-in user
        cursor.execute(
            """
            SELECT
                COALESCE(
                    SUM(CASE WHEN type = 'income'
                        THEN amount ELSE 0 END), 0
                ) AS total_income,
                COALESCE(
                    SUM(CASE WHEN type = 'expense'
                        THEN amount ELSE 0 END), 0
                ) AS total_expenses
            FROM transactions
            WHERE user_id = %s
            """,
            (current_user["id"],),
        )

        totals = cursor.fetchone()

        # Calculate expenses separately for each category
        cursor.execute(
            """
            SELECT
                category,
                SUM(amount) AS total
            FROM transactions
            WHERE user_id = %s
              AND type = 'expense'
            GROUP BY category
            ORDER BY total DESC
            """,
            (current_user["id"],),
        )

        categories = cursor.fetchall()

        total_income = float(totals["total_income"])
        total_expenses = float(totals["total_expenses"])

        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_savings": total_income - total_expenses,
            "expenses_by_category": [
                {
                    "category": row["category"],
                    "total": float(row["total"]),
                }
                for row in categories
            ],
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Could not calculate financial analytics.",
        ) from error

    finally:
        if cursor is not None:
            cursor.close()
        connection.close()


@app.get("/analytics/monthly")
def get_monthly_analytics(
    current_user: dict = Depends(get_current_user),
):
    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                DATE_FORMAT(transaction_date, '%Y-%m') AS month,
                COALESCE(
                    SUM(
                        CASE
                            WHEN type = 'income' THEN amount
                            ELSE 0
                        END
                    ), 0
                ) AS total_income,
                COALESCE(
                    SUM(
                        CASE
                            WHEN type = 'expense' THEN amount
                            ELSE 0
                        END
                    ), 0
                ) AS total_expenses
            FROM transactions
            WHERE user_id = %s
            GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
            ORDER BY month ASC
            """,
            (current_user["id"],),
        )

        rows = cursor.fetchall()

        return [
            {
                "month": row["month"],
                "income": float(row["total_income"]),
                "expenses": float(row["total_expenses"]),
            }
            for row in rows
        ]

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve monthly analytics.",
        ) from error

    finally:
        if cursor is not None:
            cursor.close()
        connection.close()


@app.get("/analytics/monthly-summary")
def get_monthly_summary(
    month: str,
    current_user: dict = Depends(get_current_user),
):
    # Validate the requested month (YYYY-MM)
    try:
        selected_month = date.fromisoformat(month + "-01")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Month must be in YYYY-MM format.",
        )

    if len(month) != 7 or month[4] != "-":
        raise HTTPException(
            status_code=400,
            detail="Month must be in YYYY-MM format.",
        )

    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                COALESCE(
                    SUM(CASE WHEN type = 'income'
                        THEN amount ELSE 0 END), 0
                ) AS total_income,
                COALESCE(
                    SUM(CASE WHEN type = 'expense'
                        THEN amount ELSE 0 END), 0
                ) AS total_expenses
            FROM transactions
            WHERE user_id = %s
              AND transaction_date >= %s
              AND transaction_date < DATE_ADD(%s, INTERVAL 1 MONTH)
            """,
            (
                current_user["id"],
                selected_month,
                selected_month,
            ),
        )

        row = cursor.fetchone()
        income = float(row["total_income"])
        expenses = float(row["total_expenses"])

        return {
            "month": month,
            "income": income,
            "expenses": expenses,
            "savings": income - expenses,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Could not calculate monthly summary.",
        ) from error

    finally:
        if cursor is not None:
            cursor.close()
        connection.close()

@app.get("/analytics/monthly-categories")
def get_monthly_categories(
    month: str,
    current_user: dict = Depends(get_current_user),
):
    # Validate the month format: YYYY-MM
    try:
        selected_month = date.fromisoformat(month + "-01")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Month must be in YYYY-MM format.",
        )

    if len(month) != 7 or month[4] != "-":
        raise HTTPException(
            status_code=400,
            detail="Month must be in YYYY-MM format.",
        )

    connection = get_connection()
    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                category,
                SUM(amount) AS total
            FROM transactions
            WHERE user_id = %s
              AND type = 'expense'
              AND transaction_date >= %s
              AND transaction_date < DATE_ADD(%s, INTERVAL 1 MONTH)
            GROUP BY category
            ORDER BY total DESC
            """,
            (
                current_user["id"],
                selected_month,
                selected_month,
            ),
        )

        rows = cursor.fetchall()

        return [
            {
                "category": row["category"],
                "total": float(row["total"]),
            }
            for row in rows
        ]

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve monthly category expenses.",
        ) from error

    finally:
        if cursor is not None:
            cursor.close()
        connection.close()

