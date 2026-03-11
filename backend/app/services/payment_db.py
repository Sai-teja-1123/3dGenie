"""SQLite-based payment storage for Razorpay order/payment records"""
import sqlite3
import os
from pathlib import Path
from typing import Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Store DB in backend directory
DB_PATH = Path(__file__).resolve().parent.parent.parent / "payments.db"


def get_connection():
    """Get SQLite connection"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row  # Return dict-like rows
    return conn


def init_db():
    """Create payments table if it doesn't exist"""
    conn = get_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT UNIQUE NOT NULL,
                payment_id TEXT,
                user_id TEXT,
                plan TEXT NOT NULL,
                amount_paise INTEGER NOT NULL,
                amount_currency TEXT DEFAULT 'INR',
                status TEXT NOT NULL DEFAULT 'created',
                receipt TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT
            )
        """)
        conn.commit()
        logger.info("Payment database initialized")
    finally:
        conn.close()


def create_order_record(order_id: str, user_id: str, plan: str, amount_paise: int, receipt: str) -> None:
    """Store a new order (before payment)"""
    conn = get_connection()
    try:
        now = datetime.utcnow().isoformat()
        conn.execute(
            """INSERT INTO payments (order_id, user_id, plan, amount_paise, status, receipt, created_at)
               VALUES (?, ?, ?, ?, 'created', ?, ?)""",
            (order_id, user_id, plan, amount_paise, receipt, now),
        )
        conn.commit()
    finally:
        conn.close()


def update_payment_record(order_id: str, payment_id: str, status: str = "captured") -> Optional[dict]:
    """Update record after successful payment"""
    conn = get_connection()
    try:
        now = datetime.utcnow().isoformat()
        conn.execute(
            """UPDATE payments SET payment_id = ?, status = ?, updated_at = ?
               WHERE order_id = ?""",
            (payment_id, status, now, order_id),
        )
        conn.commit()
        return get_payment_by_order_id(order_id)
    finally:
        conn.close()


def get_payment_by_order_id(order_id: str) -> Optional[dict]:
    """Get payment record by Razorpay order_id"""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM payments WHERE order_id = ?", (order_id,)
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_payments_by_user(user_id: str) -> list:
    """Get all payments for a user"""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_all_payments() -> list:
    """Get all payments (for admin/viewing records)"""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM payments ORDER BY created_at DESC"
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()
