from fastapi import Request, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
import time
import logging
from app.services.firebase_service import db
from app.services.vnpay_service import VNPayService

logger = logging.getLogger("app.payment_controller")
vnpay_service = VNPayService()

from typing import Optional

class CreatePaymentRequest(BaseModel):
    package_type: str  # "month" or "year"
    return_url: Optional[str] = None

async def create_payment_url(req: CreatePaymentRequest, decoded_token: dict, request: Request) -> dict:
    try:
        uid = decoded_token.get("uid")
        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Xác thực người dùng thất bại."
            )
            
        package_type = req.package_type
        if package_type not in ["month", "year"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Gói dịch vụ không hợp lệ. Phải là 'month' hoặc 'year'."
            )
            
        # Xác định số tiền
        amount = 49000  # Gói tháng: 49.000 VNĐ
        if package_type == "year":
            amount = 299000  # Gói năm: 299.000 VNĐ
            
        # Tạo mã tham chiếu giao dịch (unique txn_ref)
        timestamp = int(time.time())
        txn_ref = f"{uid}___{timestamp}___{package_type}"
        
        # Lấy IP của Client
        ip_addr = request.client.host if request.client else "127.0.0.1"
        
        # Sử dụng Return URL động từ frontend hoặc mặc định từ config
        return_url = req.return_url or os.getenv("VNPAY_RETURN_URL", "http://localhost:8000/api/payment/vnpay_return")
        
        # Chuẩn bị danh sách tham số gửi sang VNPay
        vnp_params = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": vnpay_service.tmn_code,
            "vnp_Amount": str(amount * 100),  # VNPay tính theo đơn vị xu (nhân với 100)
            "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
            "vnp_CurrCode": "VND",
            "vnp_IpAddr": ip_addr,
            "vnp_Locale": "vn",
            "vnp_OrderInfo": f"Thanh toan goi VIP TopGo - {package_type.upper()}",
            "vnp_OrderType": "billpayment",
            "vnp_ReturnUrl": return_url,
            "vnp_TxnRef": txn_ref
        }
        
        payment_url = vnpay_service.get_payment_url(vnp_params)
        logger.info(f"Created payment URL for user {uid}, package {package_type}: {payment_url}")
        return {"status": "success", "payment_url": payment_url}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Lỗi khi tạo payment url: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tạo liên kết thanh toán thất bại: {str(e)}"
        )

async def handle_payment_return(request: Request) -> dict:
    query_params = dict(request.query_params)
    logger.info(f"Received return params from VNPay for verification: {query_params}")
    
    # 1. Xác thực chữ ký
    if not vnpay_service.verify_payment(query_params):
        logger.error("VNPay return signature verification failed.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Xác thực chữ ký giao dịch thất bại."
        )
        
    # 2. Lấy mã phản hồi thanh toán
    response_code = query_params.get("vnp_ResponseCode")
    txn_ref = query_params.get("vnp_TxnRef")
    
    if response_code != "00":
        logger.warning(f"VNPay payment failed with code {response_code} for transaction {txn_ref}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Thanh toán thất bại từ VNPay (Mã lỗi: {response_code})."
        )
        
    # 3. Thanh toán thành công, tiến hành nâng cấp VIP cho user
    try:
        # Parse txn_ref
        parts = txn_ref.split("___")
        if len(parts) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã tham chiếu giao dịch không hợp lệ."
            )
            
        uid = parts[0]
        package_type = parts[2]
        
        # Cập nhật trạng thái VIP vào Firestore
        now = datetime.now()
        days_to_add = 30 if package_type == "month" else 365
        expiry_date = now + timedelta(days=days_to_add)
        
        user_ref = db.collection("users").document(uid)
        
        # Merge dữ liệu VIP vào profile người dùng
        vip_data = {
            "is_vip": True,
            "vip_package": package_type,
            "vip_start_at": now.isoformat(),
            "vip_expires_at": expiry_date.isoformat()
        }
        user_ref.set(vip_data, merge=True)
        logger.info(f"User {uid} upgraded to VIP ({package_type}) until {expiry_date.isoformat()}")
        
        # Lưu vết giao dịch
        transaction_data = {
            "uid": uid,
            "txn_ref": txn_ref,
            "amount": float(query_params.get("vnp_Amount", 0)) / 100,
            "pay_date": query_params.get("vnp_PayDate"),
            "bank_code": query_params.get("vnp_BankCode"),
            "transaction_no": query_params.get("vnp_TransactionNo"),
            "package_type": package_type,
            "created_at": now.isoformat(),
            "status": "success"
        }
        db.collection("payments").document(txn_ref).set(transaction_data)
        
        return {
            "status": "success",
            "package": package_type,
            "expiry": expiry_date.strftime("%d/%m/%Y")
        }
        
    except Exception as e:
        logger.error(f"Lỗi khi nâng cấp VIP sau thanh toán: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cập nhật thông tin VIP thất bại: {str(e)}"
        )

async def handle_payment_ipn(request: Request) -> dict:
    query_params = dict(request.query_params)
    logger.info(f"Received IPN request from VNPay: {query_params}")
    
    # 1. Xác thực chữ ký
    if not vnpay_service.verify_payment(query_params):
        logger.error("VNPay IPN signature verification failed.")
        return {"RspCode": "97", "Message": "Invalid Signature"}
        
    txn_ref = query_params.get("vnp_TxnRef")
    response_code = query_params.get("vnp_ResponseCode")
    
    try:
        parts = txn_ref.split("___")
        if len(parts) < 3:
            return {"RspCode": "01", "Message": "Order Not Found"}
            
        uid = parts[0]
        package_type = parts[2]
        
        # Kiểm tra xem giao dịch đã được xác nhận chưa
        payment_doc = db.collection("payments").document(txn_ref).get()
        if payment_doc.exists and payment_doc.to_dict().get("status") == "success":
            return {"RspCode": "02", "Message": "Order already confirmed"}
            
        # Kiểm tra số tiền có khớp không
        amount_received = float(query_params.get("vnp_Amount", 0)) / 100
        expected_amount = 49000.0 if package_type == "month" else 299000.0
        if amount_received != expected_amount:
            return {"RspCode": "04", "Message": "Invalid Amount"}
            
        # Xử lý cập nhật DB nếu thanh toán thành công từ VNPay
        if response_code == "00":
            now = datetime.now()
            days_to_add = 30 if package_type == "month" else 365
            expiry_date = now + timedelta(days=days_to_add)
            
            user_ref = db.collection("users").document(uid)
            vip_data = {
                "is_vip": True,
                "vip_package": package_type,
                "vip_start_at": now.isoformat(),
                "vip_expires_at": expiry_date.isoformat()
            }
            user_ref.set(vip_data, merge=True)
            
            # Lưu vết giao dịch
            transaction_data = {
                "uid": uid,
                "txn_ref": txn_ref,
                "amount": amount_received,
                "pay_date": query_params.get("vnp_PayDate"),
                "bank_code": query_params.get("vnp_BankCode"),
                "transaction_no": query_params.get("vnp_TransactionNo"),
                "package_type": package_type,
                "created_at": now.isoformat(),
                "status": "success"
            }
            db.collection("payments").document(txn_ref).set(transaction_data)
            logger.info(f"IPN: Successfully updated VIP for user {uid}")
        else:
            # Lưu vết giao dịch thất bại
            transaction_data = {
                "uid": uid,
                "txn_ref": txn_ref,
                "amount": amount_received,
                "pay_date": query_params.get("vnp_PayDate"),
                "bank_code": query_params.get("vnp_BankCode"),
                "transaction_no": query_params.get("vnp_TransactionNo"),
                "package_type": package_type,
                "created_at": datetime.now().isoformat(),
                "status": "failed",
                "response_code": response_code
            }
            db.collection("payments").document(txn_ref).set(transaction_data)
            logger.warning(f"IPN: Transaction {txn_ref} marked as failed with response code {response_code}")
            
        return {"RspCode": "00", "Message": "Confirm Success"}
        
    except Exception as e:
        logger.error(f"Lỗi hệ thống khi xử lý IPN: {e}")
        return {"RspCode": "99", "Message": "Input data invalid or system error"}
