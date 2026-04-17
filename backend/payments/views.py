import paypalrestsdk
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.conf import settings

# Cấu hình PayPal
paypalrestsdk.configure({
    "mode": settings.PAYPAL_MODE,
    "client_id": settings.PAYPAL_CLIENT_ID,
    "client_secret": settings.PAYPAL_CLIENT_SECRET
})

@csrf_exempt
@login_required(login_url='/api/login/')  # Chuyển hướng đến endpoint login của bạn
def create_payment(request):
    if request.method == 'POST':
        try:
            payment = paypalrestsdk.Payment({
                "intent": "sale",
                "payer": {"payment_method": "paypal"},
                "transactions": [{
                    "amount": {
                        "total": "9.99",
                        "currency": "USD"
                    },
                    "description": "Nâng cấp tài khoản Premium"
                }],
                "redirect_urls": {
                    "return_url": "http://localhost:5173/premium/success",  # Cập nhật cổng frontend
                    "cancel_url": "http://localhost:5173/premium/cancel"
                }
            })

            if payment.create():
                for link in payment.links:
                    if link.rel == "approval_url":
                        return JsonResponse({"approval_url": link.href})
            else:
                return JsonResponse({"error": payment.error}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Phương thức không được hỗ trợ"}, status=405)

@csrf_exempt
@login_required(login_url='/api/login/')
def execute_payment(request):
    if request.method == 'POST':
        try:
            payment_id = request.POST.get('paymentId')
            payer_id = request.POST.get('PayerID')

            if not payment_id or not payer_id:
                return JsonResponse({"error": "Thiếu paymentId hoặc PayerID"}, status=400)

            payment = paypalrestsdk.Payment.find(payment_id)

            if payment.execute({"payer_id": payer_id}):
                user = request.user
                user.isPremium = True
                user.save()
                return JsonResponse({"status": "success"})
            else:
                return JsonResponse({"error": payment.error}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Phương thức không được hỗ trợ"}, status=405)