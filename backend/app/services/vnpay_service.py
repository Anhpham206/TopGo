import os
import hmac
import hashlib
import urllib.parse
import logging

logger = logging.getLogger("app.vnpay_service")

class VNPayService:
    def __init__(self):
        self.tmn_code = os.getenv("VNPAY_TMN_CODE", "2QX2VWD9")
        self.secret_key = os.getenv("VNPAY_HASH_SECRET", "1Z9Z5Y9W7Y9Z6Y9W5Y9Z6Y9W5Y9Z6Y9W")
        self.payment_url = os.getenv("VNPAY_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html")
        logger.info(f"Initialized VNPayService with TMN_CODE: {self.tmn_code}")

    def get_payment_url(self, params: dict) -> str:
        # Sort keys
        sorted_keys = sorted(params.keys())
        
        # Format the parameters for hashing using quote_plus for the values
        hash_parts = []
        for key in sorted_keys:
            val = params[key]
            # Skip empty or secure hash
            if val is not None and str(val) != "":
                hash_parts.append(f"{key}={urllib.parse.quote_plus(str(val))}")
        
        hash_data = "&".join(hash_parts)
        
        # Calculate HMAC-SHA512 checksum
        secure_hash = hmac.new(
            self.secret_key.encode('utf-8'),
            hash_data.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
        
        # Build final URL
        redirect_url = f"{self.payment_url}?{hash_data}&vnp_SecureHash={secure_hash}"
        return redirect_url

    def verify_payment(self, params: dict) -> bool:
        # Extract vnp_SecureHash
        received_hash = params.get("vnp_SecureHash")
        if not received_hash:
            logger.warning("No vnp_SecureHash found in parameters.")
            return False
            
        # Copy and clean params
        clean_params = {k: v for k, v in params.items() if k not in ["vnp_SecureHash", "vnp_SecureHashType"]}
        
        # Sort and build hash string
        sorted_keys = sorted(clean_params.keys())
        hash_parts = []
        for key in sorted_keys:
            val = clean_params[key]
            if val is not None and str(val) != "":
                # quote_plus replaces space with '+'
                hash_parts.append(f"{key}={urllib.parse.quote_plus(str(val))}")
                
        hash_data = "&".join(hash_parts)
        
        # Compute hash
        computed_hash = hmac.new(
            self.secret_key.encode('utf-8'),
            hash_data.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
        
        is_valid = hmac.compare_digest(computed_hash.lower(), received_hash.lower())
        if not is_valid:
            logger.warning(f"Signature mismatch. Computed: {computed_hash.lower()}, Received: {received_hash.lower()}")
            logger.warning(f"Data used for signature: {hash_data}")
        return is_valid
