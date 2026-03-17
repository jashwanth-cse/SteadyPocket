from firebase_admin import messaging
from utils.logger import logger

def send_push_notification(fcm_token, title, body, data=None):
    """
    Send a push notification to a specific device using FCM.
    """
    if not fcm_token:
        logger.warning({"event": "notification_skipped", "reason": "no_fcm_token"})
        return False

    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        data=data or {},
        token=fcm_token,
    )

    try:
        response = messaging.send(message)
        logger.info({
            "event": "notification_sent", 
            "response": response, 
            "token": fcm_token[:10] + "...",
            "title": title
        })
        return True
    except Exception as e:
        logger.error({
            "event": "notification_error", 
            "error": str(e), 
            "token": fcm_token[:10] + "..."
        })
        return False

def send_payout_notification(fcm_token, amount, location):
    """
    Convenience method to send a payout notification.
    """
    title = "Rain disruption detected"
    body = f"₹{amount} credited to your Steady Pocket wallet."
    
    return send_push_notification(
        fcm_token=fcm_token,
        title=title,
        body=body,
        data={
            "type": "payout",
            "amount": str(amount),
            "location": location
        }
    )
