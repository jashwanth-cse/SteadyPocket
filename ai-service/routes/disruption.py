import os
import traceback
from fastapi import APIRouter, HTTPException
from services.firestore_service import (
    get_active_policies, 
    get_user_location, 
    get_user_verification_status,
    create_event_record,
    get_active_event,
    complete_event,
    trigger_payout_transaction
)
from services.weather_service import get_weather_data
from utils.logger import logger

router = APIRouter()

RAIN_THRESHOLD = float(os.getenv("RAIN_THRESHOLD_MM_HR", "0.5"))

@router.get("/")
async def check_disruptions():
    """
    Scan all active policies, check weather for their location, 
    and trigger automatic payouts where necessary with idempotency check.
    """
    try:
        logger.info({"event": "disruption_check_started"})
        
        policies = get_active_policies()
        if not policies:
            return {"status": "ok", "message": "No active policies to check."}
            
        location_users = {}
        for policy in policies:
            user_id = policy.get("user_id")
            if not user_id:
                continue
                
            verification_status = get_user_verification_status(user_id)
            if verification_status != "fully_verified":
                continue

            location = get_user_location(user_id)
            if location not in location_users:
                location_users[location] = []
            location_users[location].append(policy)

        payouts_triggered = []
        
        for location, user_policies in location_users.items():
            rain_intensity = get_weather_data(location)
            active_event = get_active_event(location, "rain")
            
            if rain_intensity >= RAIN_THRESHOLD:
                if not active_event:
                    event_id = create_event_record(location, rain_intensity)
                    active_event = {"event_id": event_id}
                else:
                    event_id = active_event["event_id"]
                
                for policy in user_policies:
                    user_id = policy.get("user_id")
                    policy_id = policy.get("id")
                    payout_amount = int(policy.get("coverage_limit", 0) * 0.15)
                    
                    result = trigger_payout_transaction(
                        user_id=user_id,
                        policy_id=policy_id,
                        event_id=event_id,
                        amount=payout_amount,
                        reason=f"Rain intensity {rain_intensity}mm/hr detected in {location}",
                        location=location
                    )
                    
                    if result["status"] == "success":
                        payouts_triggered.append({
                            "user_id": user_id,
                            "status": "payout_triggered",
                            "payout_id": result["payout_id"],
                            "event_id": event_id
                        })
                    elif result["status"] == "skipped":
                        logger.info({"event": "payout_skipped", "user_id": user_id, "reason": "already_paid_for_event", "event_id": event_id})
            
            else:
                if active_event:
                    complete_event(active_event["event_id"])
                    logger.info({"event": "disruption_cleared", "location": location, "event_id": active_event["event_id"]})

        return {
            "status": "completed",
            "locations_checked": len(location_users),
            "payouts_count": len(payouts_triggered),
            "details": payouts_triggered
        }
    except Exception as e:
        tb = traceback.format_exc()
        logger.error({"event": "disruption_check_failed", "error": str(e), "traceback": tb})
        return {"status": "error", "message": str(e), "traceback": tb}
