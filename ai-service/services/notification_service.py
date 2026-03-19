from utils.logger import logger

def send_push_notification(fcm_token, title, body, data=None):
    """
    Dummy method - push notifications are disabled.
    """
    logger.info({"event": "notification_disabled", "reason": "fcm_removed"})
    return False

def send_payout_notification(fcm_token, amount, location):
    """
    Dummy method - push notifications are disabled.
    """
    return False
