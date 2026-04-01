"""Razorpay payment integration endpoints"""
import os
import uuid
import logging
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel, Field

from app.services.payment_db import (
    init_db,
    create_order_record,
    update_payment_record,
    get_payment_by_order_id,
)
from app.services.auth_jwt import decode_access_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Plan to amount mapping (in INR, convert to paise for Razorpay)
PLAN_AMOUNTS = {
    "Starter": 0,
    "Pro": 499,
    "Studio": 1499,
}


class CreateOrderRequest(BaseModel):
    plan: str = Field(..., description="Plan name: Pro, Studio (Starter is free)")


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int  # in paise
    currency: str = "INR"
    key_id: str = Field(..., description="Razorpay Key ID for frontend")


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


def get_razorpay_client():
    """Get Razorpay client - returns None if not configured"""
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        return None, key_id
    import razorpay
    return razorpay.Client(auth=(key_id, key_secret)), key_id


def get_user_id(authorization: str | None) -> str:
    """Extract user identifier from bearer token."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]  # Strip "Bearer "
        try:
            payload = decode_access_token(token)
            return str(payload.get("sub") or payload.get("email") or token)
        except HTTPException:
            # Backward compatible fallback for older demo tokens.
            return token
    return "anonymous"


@router.post("/create-order", response_model=CreateOrderResponse)
async def create_order(
    req: CreateOrderRequest,
    authorization: str | None = Header(None),
):
    """
    Create a Razorpay order for the selected plan.
    Returns order_id to pass to Razorpay Checkout on frontend.
    """
    client, key_id = get_razorpay_client()
    if not client:
        raise HTTPException(
            status_code=503,
            detail="Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env",
        )

    plan = req.plan.strip()
    if plan not in PLAN_AMOUNTS:
        raise HTTPException(400, detail=f"Invalid plan: {plan}. Use Pro or Studio.")

    amount_inr = PLAN_AMOUNTS[plan]
    if amount_inr <= 0:
        raise HTTPException(400, detail="Starter plan is free. No payment required.")

    amount_paise = amount_inr * 100
    receipt = f"receipt_{uuid.uuid4().hex[:12]}"
    user_id = get_user_id(authorization)

    try:
        order = client.order.create(
            data={
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt,
            }
        )
        order_id = order["id"]

        # Initialize DB and store record
        init_db()
        create_order_record(order_id, user_id, plan, amount_paise, receipt)

        return CreateOrderResponse(
            order_id=order_id,
            amount=amount_paise,
            currency="INR",
            key_id=key_id,
        )
    except Exception as e:
        logger.exception("Razorpay order creation failed")
        raise HTTPException(500, detail=str(e))


@router.post("/verify")
async def verify_payment(req: VerifyPaymentRequest):
    """
    Verify payment signature from Razorpay Checkout.
    Call this after user completes payment in the Razorpay popup.
    """
    client, _ = get_razorpay_client()
    if not client:
        raise HTTPException(503, detail="Razorpay not configured.")

    try:
        import razorpay
        razorpay.utility.verify_payment_signature(
            req.razorpay_order_id,
            req.razorpay_payment_id,
            req.razorpay_signature,
        )
    except Exception as e:
        logger.warning(f"Payment verification failed: {e}")
        raise HTTPException(400, detail="Payment verification failed")

    # Update our record
    record = update_payment_record(
        req.razorpay_order_id,
        req.razorpay_payment_id,
        status="captured",
    )

    return {
        "success": True,
        "message": "Payment verified successfully",
        "order_id": req.razorpay_order_id,
        "payment_id": req.razorpay_payment_id,
        "plan": record["plan"] if record else None,
    }


@router.get("/key")
async def get_razorpay_key():
    """
    Return Razorpay Key ID for frontend.
    Key ID is safe to expose; never expose the secret.
    """
    key_id = os.getenv("RAZORPAY_KEY_ID")
    if not key_id:
        raise HTTPException(503, detail="Razorpay not configured")
    return {"key_id": key_id}


@router.get("/records")
async def get_payment_records(authorization: str | None = Header(None)):
    """
    Get payment records for the current user.
    For demo: returns all records if no auth, or filtered by user.
    """
    init_db()
    from app.services.payment_db import get_payments_by_user, get_all_payments

    user_id = get_user_id(authorization)
    if user_id == "anonymous":
        records = get_all_payments()
    else:
        records = get_payments_by_user(user_id)

    return {"payments": records}
