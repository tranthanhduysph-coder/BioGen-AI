"""Public plans and existing QR recipient; webhook secrets never reach clients."""
import json
import os
import re
from pathlib import Path

PLANS = json.loads((Path(__file__).resolve().parent.parent / 'data/paymentPlans.json').read_text(encoding='utf-8'))
PACKAGES = {plan['credits']: plan['priceVnd'] for plan in PLANS['exam']}
MANUAL_PRICE = PLANS['manual']['priceVnd']


def payment_bank():
    bank = PLANS['bank'].copy()
    if bank['id'] == 'BIDV':
        va = os.getenv('SEPAY_BIDV_VA', '').strip().upper()
        bank['virtualAccountNumber'] = va if re.fullmatch(r'96247[A-Z0-9]{1,14}', va) else ''
    return bank


def payment_ready():
    return (os.getenv('AUTOMATIC_PAYMENTS_ENABLED', 'false').lower() == 'true'
            and os.getenv('CREDITS_ENABLED', 'false').lower() == 'true'
            and len(os.getenv('SEPAY_WEBHOOK_SECRET', '')) >= 32
            and os.getenv('SEPAY_WEBHOOK_AUTH', 'hmac') in ('hmac', 'apikey')
            and (PLANS['bank']['id'] != 'BIDV' or bool(payment_bank()['virtualAccountNumber'])))


def public_payment_config():
    return {**PLANS, 'bank': payment_bank(), 'automaticPaymentReady': payment_ready()}
