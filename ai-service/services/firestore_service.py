import os
import firebase_admin
from firebase_admin import credentials, firestore
from utils.logger import logger

# Initialize Firebase Admin SDK
# Check if already initialized to avoid errors in reload mode
if not firebase_admin._apps:
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "./config/gcp-service-account.json")
    try:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        logger.info({"event": "firebase_initialized", "cred_path": cred_path})
    except Exception as e:
        logger.error({"event": "firebase_init_error", "error": str(e)})

db = firestore.client()

def get_active_policies():
    """Fetch all users with active policies."""
    try:
        # We need policies where status is 'active'
        policies_ref = db.collection("policies")
        query = policies_ref.where("status", "==", "active")
        docs = query.stream()
        
        active_policies = []
        for doc in docs:
            policy_data = doc.to_dict()
            policy_data['id'] = doc.id
            active_policies.append(policy_data)
        
        return active_policies
    except Exception as e:
        logger.error({"event": "get_active_policies_error", "error": str(e)})
        return []

def get_user_location(user_id):
    """Fetch user's work location from users collection."""
    try:
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()
        if user_doc.exists:
            return user_doc.to_dict().get("work_location", "Unknown")
        return "Unknown"
    except Exception as e:
        logger.error({"event": "get_user_location_error", "user_id": user_id, "error": str(e)})
        return "Unknown"

def get_user_wallet_id(user_id):
    """Fetch user's wallet_id from users collection."""
    try:
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()
        if user_doc.exists:
            return user_doc.to_dict().get("wallet_id", "")
        return ""
    except Exception as e:
        logger.error({"event": "get_user_wallet_id_error", "user_id": user_id, "error": str(e)})
        return ""

def create_payout_record(user_id, policy_id, amount, reason, event_id=None, location=None):
    """Create a payout record in Firestore."""
    try:
        payout_ref = db.collection("payouts").document()
        payout_id = f"PAY-{os.urandom(2).hex().upper()}"
        
        payout_data = {
            "payout_id": payout_id,
            "user_id": user_id,
            "policy_id": policy_id,
            "amount": amount,
            "reason": reason,
            "status": "completed",
            "event_id": event_id,
            "location": location,
            "timestamp": firestore.SERVER_TIMESTAMP
        }
        payout_ref.set(payout_data)
        return payout_ref.id
    except Exception as e:
        logger.error({"event": "create_payout_record_error", "user_id": user_id, "error": str(e)})
        return None

def update_wallet_balance(user_id, amount):
    """Update user's wallet balance."""
    try:
        # First find user doc to get wallet_id (if not passed)
        user_ref = db.collection("users").document(user_id)
        user_snap = user_ref.get()
        if not user_snap.exists:
            return False
            
        wallet_id = user_snap.to_dict().get("wallet_id")
        if not wallet_id:
            return False
            
        wallet_ref = db.collection("wallets").document(wallet_id)
        
        # Atomically increment balance
        wallet_ref.update({
            "balance": firestore.Increment(amount),
            "updated_at": firestore.SERVER_TIMESTAMP
        })
        
        # Record transaction
        db.collection("wallet_transactions").add({
            "transaction_id": f"PAYOUT_{os.urandom(4).hex()}",
            "user_id": user_id,
            "wallet_id": wallet_id,
            "type": "payout_credit",
            "amount": amount,
            "source": "weather_disruption",
            "timestamp": firestore.SERVER_TIMESTAMP
        })
        
        return True
    except Exception as e:
        logger.error({"event": "update_wallet_balance_error", "user_id": user_id, "error": str(e)})
        return False


def get_user_verification_status(user_id):
    """Fetch user's verification status from users collection."""
    try:
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()
        if user_doc.exists:
            return user_doc.to_dict().get("verification_status")
        return None
    except Exception as e:
        logger.error({"event": "get_user_verification_status_error", "user_id": user_id, "error": str(e)})
        return None

def create_event_record(location, rain_intensity):
    """Create a unique event record for the weather disruption."""
    try:
        import datetime
        event_id = f"EVT{os.urandom(2).hex().upper()}"
        event_ref = db.collection("events").document(event_id)
        
        start_time = datetime.datetime.now(datetime.timezone.utc)
        end_time = start_time + datetime.timedelta(hours=4)
        
        event_data = {
            "event_id": event_id,
            "event_type": "rain",
            "location": location,
            "severity": "critical",
            "status": "active",
            "start_time": start_time,
            "end_time": end_time
        }
        event_ref.set(event_data)
        logger.info({"event": "event_created", "event_id": event_id, "location": location})
        return event_id
    except Exception as e:
        logger.error({"event": "create_event_record_error", "location": location, "error": str(e)})
        return None

def get_active_event(location, event_type="rain"):
    """Find any currently active disruption event for a location."""
    try:
        events_ref = db.collection("events")
        query = events_ref.where("location", "==", location)\
                          .where("event_type", "==", event_type)\
                          .where("status", "==", "active")\
                          .limit(1)
        docs = query.stream()
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            return data
        return None
    except Exception as e:
        logger.error({"event": "get_active_event_error", "location": location, "error": str(e)})
        return None

def complete_event(event_id):
    """Mark an event as completed when the disruption ends."""
    try:
        import datetime
        event_ref = db.collection("events").document(event_id)
        event_ref.update({
            "status": "completed",
            "end_time": datetime.datetime.now(datetime.timezone.utc)
        })
        logger.info({"event": "event_completed", "event_id": event_id})
        return True
    except Exception as e:
        logger.error({"event": "complete_event_error", "event_id": event_id, "error": str(e)})
        return False

@firestore.transactional
def _run_payout_transaction(transaction, user_id, policy_id, event_id, amount, reason, location):
    """Internal transactional function for triggering a payout."""
    # 1. Check if payout already exists for this event+user
    payouts_ref = db.collection("payouts")
    existing_query = payouts_ref.where("user_id", "==", user_id).where("event_id", "==", event_id).limit(1)
    
    # Correct transactional read pattern for Python SDK
    docs = transaction.get(existing_query)
    if len(list(docs)) > 0:
        return {"status": "skipped", "reason": "already_paid"}

    # 2. Get User Wallet ID
    user_ref = db.collection("users").document(user_id)
    # Handle possible generator return from transaction.get()
    user_res = transaction.get(user_ref)
    user_snapshot = next(user_res) if hasattr(user_res, "__next__") else user_res
    
    if not user_snapshot or not user_snapshot.exists:
        return {"status": "error", "reason": "user_not_found"}
    
    user_data = user_snapshot.to_dict()
    wallet_id = user_data.get("wallet_id")
    if not wallet_id:
        return {"status": "error", "reason": "wallet_missing"}

    # 3. Prepare Payout Document
    payout_ref = db.collection("payouts").document()
    payout_data = {
        "payout_id": f"PAY-{os.urandom(2).hex().upper()}",
        "user_id": user_id,
        "policy_id": policy_id,
        "amount": amount,
        "reason": reason,
        "status": "completed",
        "event_id": event_id,
        "location": location,
        "timestamp": firestore.SERVER_TIMESTAMP
    }

    # 4. Prepare Wallet Update
    wallet_ref = db.collection("wallets").document(wallet_id)
    
    # 5. Prepare Wallet Transaction
    tx_ref = db.collection("wallet_transactions").document()
    tx_data = {
        "transaction_id": f"PAYOUT_{os.urandom(4).hex()}",
        "user_id": user_id,
        "wallet_id": wallet_id,
        "event_id": event_id, # Link tx to event too
        "type": "payout_credit",
        "amount": amount,
        "source": "weather_disruption",
        "timestamp": firestore.SERVER_TIMESTAMP
    }

    # Atomic Execution
    transaction.set(payout_ref, payout_data)
    transaction.update(wallet_ref, {
        "balance": firestore.Increment(amount),
        "updated_at": firestore.SERVER_TIMESTAMP
    })
    transaction.set(tx_ref, tx_data)

    return {"status": "success", "payout_id": payout_data["payout_id"]}

def trigger_payout_transaction(user_id, policy_id, event_id, amount, reason, location):
    """Execute payout as an atomic transaction."""
    transaction = db.transaction()
    try:
        return _run_payout_transaction(transaction, user_id, policy_id, event_id, amount, reason, location)
    except Exception as e:
        logger.error({"event": "payout_transaction_failed", "user_id": user_id, "error": str(e)})
        return {"status": "error", "reason": str(e)}
