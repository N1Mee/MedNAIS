"""
Stripe payment integration using emergentintegrations
"""
import os
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Header, Depends
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
    CheckoutSessionRequest
)

from .auth_utils import get_current_user, get_optional_user_from_auth_header, UserContext

# Load environment variables from parent directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/stripe", tags=["stripe"])

# Initialize Stripe Checkout
STRIPE_API_KEY = os.getenv("STRIPE_API_KEY")
if not STRIPE_API_KEY:
    raise RuntimeError("STRIPE_API_KEY not found in environment variables")


class CreateCheckoutRequest(BaseModel):
    sop_id: str
    origin_url: str


class CartItem(BaseModel):
    sop_id: str
    sop_title: str
    sop_price: float
    creator_id: str


class CreateCartCheckoutRequest(BaseModel):
    user_id: str
    origin_url: str
    cart_items: list[CartItem]


class CheckoutStatusRequest(BaseModel):
    session_id: str


@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request_data: CreateCheckoutRequest, 
    req: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Create a Stripe checkout session for purchasing a SOP
    Supports both authenticated and guest checkout
    """
    try:
        from prisma import Prisma
        from prisma.models import User, SOP
        
        # Initialize Prisma client
        prisma = Prisma()
        await prisma.connect()
        
        try:
            # Get current user from JWT token (optional - supports guest checkout)
            user_context = get_optional_user_from_auth_header(authorization)
            buyer_id = user_context.user_id if user_context else None
            user_email = user_context.email if user_context else None
            
            # Get SOP details
            sop = await prisma.sop.find_unique(
                where={"id": request_data.sop_id},
                include={"creator": True}
            )
            
            if not sop:
                raise HTTPException(status_code=404, detail="SOP not found")
            
            if sop.type != "MARKETPLACE":
                raise HTTPException(status_code=400, detail="SOP is not available for purchase")
            
            if not sop.price:
                raise HTTPException(status_code=400, detail="SOP has no price set")
            
            # Convert price from cents to dollars (e.g., 1000 cents = 10.00 dollars)
            # Playbook requires amount in float format dollars
            amount = float(sop.price) / 100.0
            
            # Build success and cancel URLs
            success_url = f"{request_data.origin_url}/purchase-success?session_id={{CHECKOUT_SESSION_ID}}"
            cancel_url = f"{request_data.origin_url}/marketplace"
            
            # Metadata to track this purchase
            metadata = {
                "sop_id": sop.id,
                "sop_title": sop.title,
                "creator_id": sop.creatorId,
                "source": "web_checkout"
            }
            
            # Initialize Stripe checkout
            host_url = str(req.base_url)
            webhook_url = f"{host_url}api/stripe/webhook"
            stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
            
            # Create checkout session request
            checkout_request = CheckoutSessionRequest(
                amount=amount,
                currency="usd",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata=metadata
            )
            
            # Create checkout session
            session = await stripe_checkout.create_checkout_session(checkout_request)
            
            # Store payment transaction in database
            import json
            payment_data = {
                "sessionId": session.session_id,
                "amount": amount,
                "currency": "usd",
                "status": "PENDING",
                "metadata": json.dumps(metadata),  # Convert dict to JSON string
                "userEmail": user_email
            }
            
            # Add userId if user is authenticated
            if buyer_id:
                payment_data["userId"] = buyer_id
            
            await prisma.paymenttransaction.create(data=payment_data)
            
            logger.info(f"Created checkout session {session.session_id} for SOP {sop.id}")
            
            return session
            
        finally:
            await prisma.disconnect()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@router.get("/checkout-status/{session_id}", response_model=CheckoutStatusResponse)
async def get_checkout_status(
    session_id: str, 
    req: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Get the status of a Stripe checkout session and update database
    Supports both authenticated and guest checkout
    """
    try:
        from prisma import Prisma
        
        prisma = Prisma()
        await prisma.connect()
        
        try:
            # Initialize Stripe checkout
            host_url = str(req.base_url)
            webhook_url = f"{host_url}api/stripe/webhook"
            stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
            
            # Get checkout status from Stripe
            checkout_status = await stripe_checkout.get_checkout_status(session_id)
            
            # Find payment transaction
            payment_tx = await prisma.paymenttransaction.find_unique(
                where={"sessionId": session_id}
            )
            
            if not payment_tx:
                raise HTTPException(status_code=404, detail="Payment transaction not found")
            
            # Update payment transaction status
            status_map = {
                "complete": "COMPLETED",
                "expired": "EXPIRED",
                "open": "PENDING"
            }
            
            new_status = status_map.get(checkout_status.status, "PENDING")
            
            # Only update if status changed
            if payment_tx.status != new_status:
                await prisma.paymenttransaction.update(
                    where={"sessionId": session_id},
                    data={
                        "status": new_status,
                        "paymentStatus": checkout_status.payment_status,
                        "paymentId": checkout_status.metadata.get("payment_intent_id") if checkout_status.metadata else None
                    }
                )
                
                # If payment is completed, create Purchase record
                if new_status == "COMPLETED" and checkout_status.payment_status == "paid":
                    metadata = checkout_status.metadata or {}
                    sop_id = metadata.get("sop_id")
                    creator_id = metadata.get("creator_id")
                    
                    if sop_id and creator_id:
                        # Check if purchase already exists (prevent duplicates)
                        existing_purchase = await prisma.purchase.find_first(
                            where={
                                "sopId": sop_id,
                                "stripePaymentId": session_id
                            }
                        )
                        
                        if not existing_purchase:
                            # Get buyer ID from user context or payment transaction
                            user_context = get_optional_user_from_auth_header(authorization)
                            buyer_id = None
                            
                            if user_context:
                                buyer_id = user_context.user_id
                            elif payment_tx and payment_tx.userId:
                                buyer_id = payment_tx.userId
                            
                            # Only create purchase if we have a buyer ID
                            # Guest purchases are not recorded in Purchase table
                            if buyer_id:
                                # Calculate fees (30% platform, 70% creator)
                                total_amount = float(checkout_status.amount_total) / 100  # Convert from cents
                                platform_fee = total_amount * 0.30
                                creator_revenue = total_amount * 0.70
                                
                                # Create purchase record
                                await prisma.purchase.create(
                                    data={
                                        "sopId": sop_id,
                                        "buyerId": buyer_id,
                                        "sellerId": creator_id,
                                        "price": total_amount,
                                        "platformFee": platform_fee,
                                        "creatorRevenue": creator_revenue,
                                        "stripePaymentId": session_id
                                    }
                                )
                                logger.info(f"Purchase record created for SOP {sop_id} by user {buyer_id}")
                            else:
                                logger.info(f"Guest purchase completed for SOP {sop_id} - no Purchase record created")
            
            return checkout_status
            
        finally:
            await prisma.disconnect()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting checkout status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get checkout status: {str(e)}")


@router.post("/create-cart-checkout", response_model=CheckoutSessionResponse)
async def create_cart_checkout_session(
    request_data: CreateCartCheckoutRequest, 
    req: Request,
    user: UserContext = Depends(get_current_user)
):
    """
    Create a Stripe checkout session for multiple SOPs from cart
    Requires authentication
    """
    try:
        # Calculate total amount
        total_amount = sum(item.sop_price for item in request_data.cart_items) / 100.0  # Convert to dollars
        
        if total_amount <= 0:
            raise HTTPException(status_code=400, detail="Cart total must be greater than 0")
        
        # Build success and cancel URLs
        success_url = f"{request_data.origin_url}/purchase-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{request_data.origin_url}/cart"
        
        # Verify user_id matches authenticated user
        if request_data.user_id != user.user_id:
            raise HTTPException(
                status_code=403, 
                detail="Cannot create checkout for another user's cart"
            )
        
        # Metadata to track this purchase
        metadata = {
            "user_id": user.user_id,
            "cart_items": ",".join([item.sop_id for item in request_data.cart_items]),
            "item_count": str(len(request_data.cart_items)),
            "source": "cart_checkout"
        }
        
        # Initialize Stripe checkout
        host_url = str(req.base_url)
        webhook_url = f"{host_url}api/stripe/webhook"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Create checkout session request
        checkout_request = CheckoutSessionRequest(
            amount=total_amount,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata
        )
        
        # Create checkout session
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store payment transaction in database
        from prisma import Prisma
        prisma = Prisma()
        await prisma.connect()
        
        try:
            import json
            await prisma.paymenttransaction.create(
                data={
                    "sessionId": session.session_id,
                    "amount": total_amount,
                    "currency": "usd",
                    "status": "PENDING",
                    "metadata": json.dumps(metadata),
                    "userId": user.user_id,
                    "userEmail": user.email
                }
            )
        finally:
            await prisma.disconnect()
        
        logger.info(f"Created cart checkout session {session.session_id} for {len(request_data.cart_items)} items")
        
        return session
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating cart checkout session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: Optional[str] = Header(None)):
    """
    Handle Stripe webhook events
    """
    try:
        body_bytes = await request.body()
        
        if not stripe_signature:
            raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")
        
        # Initialize Stripe checkout
        host_url = str(request.base_url)
        webhook_url = f"{host_url}api/stripe/webhook"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(
            body_bytes,
            stripe_signature
        )
        
        logger.info(f"Webhook received: {webhook_response.event_type} for session {webhook_response.session_id}")
        
        # Update payment transaction based on webhook
        if webhook_response.event_type == "checkout.session.completed":
            from prisma import Prisma
            
            prisma = Prisma()
            await prisma.connect()
            
            try:
                await prisma.paymenttransaction.update(
                    where={"sessionId": webhook_response.session_id},
                    data={
                        "status": "COMPLETED",
                        "paymentStatus": webhook_response.payment_status
                    }
                )
            finally:
                await prisma.disconnect()
        
        return {"received": True}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
