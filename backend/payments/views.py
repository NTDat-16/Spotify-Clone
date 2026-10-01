import json
import paypalrestsdk
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from app.models import User

# Cấu hình PayPal
paypalrestsdk.configure({
    "mode": getattr(settings, "PAYPAL_MODE", "sandbox"),
    "client_id": getattr(settings, "PAYPAL_CLIENT_ID", ""),
    "client_secret": getattr(settings, "PAYPAL_CLIENT_SECRET", "")
})

@csrf_exempt
def create_payment(request):
    if request.method == 'POST':
        try:
            origin = request.headers.get("Origin") or request.headers.get("Referer")
            frontend_url = origin.rstrip("/") if origin else "http://localhost:5173"

            payment = paypalrestsdk.Payment({
                "intent": "sale",
                "payer": {"payment_method": "paypal"},
                "transactions": [{
                    "amount": {
                        "total": "9.99",
                        "currency": "USD"
                    },
                    "description": "Nâng cấp tài khoản Premium Spotify Clone"
                }],
                "redirect_urls": {
                    "return_url": f"{frontend_url}/premium/success",
                    "cancel_url": f"{frontend_url}/premium/cancel"
                }
            })

            if payment.create():
                for link in payment.links:
                    if link.rel == "approval_url":
                        return JsonResponse({"approval_url": link.href})
                return JsonResponse({"error": "Không tìm thấy approval_url"}, status=400)
            else:
                return JsonResponse({"error": payment.error}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Phương thức không được hỗ trợ"}, status=405)

@csrf_exempt
def execute_payment(request):
    if request.method == 'POST':
        try:
            payment_id = request.POST.get('paymentId')
            payer_id = request.POST.get('PayerID')
            user_id = request.POST.get('user_id')

            # Parse JSON body fallback if sent as JSON
            if not payment_id and request.body:
                try:
                    body = json.loads(request.body.decode('utf-8'))
                    payment_id = body.get('paymentId')
                    payer_id = body.get('PayerID')
                    user_id = body.get('user_id')
                except Exception:
                    pass

            if not payment_id or not payer_id:
                return JsonResponse({"error": "Thiếu paymentId hoặc PayerID"}, status=400)

            payment = paypalrestsdk.Payment.find(payment_id)

            if payment.execute({"payer_id": payer_id}):
                if user_id:
                    try:
                        user = User.objects.get(id=user_id)
                        user.isPremium = True
                        user.save()
                    except User.DoesNotExist:
                        pass
                return JsonResponse({"status": "success"})
            else:
                return JsonResponse({"error": payment.error}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Phương thức không được hỗ trợ"}, status=405)