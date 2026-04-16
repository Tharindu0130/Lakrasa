import crypto from 'crypto';

export interface PayHereConfig {
  merchantId: string;
  merchantSecret: string;
}

export interface PayHerePaymentData {
  order_id: string;
  amount: number;
  currency: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

export function generatePayHereHash(config: PayHereConfig, paymentData: PayHerePaymentData): string {
  const merchantSecret = config.merchantSecret;
  const merchantId = config.merchantId;
  
  const amount = paymentData.amount.toFixed(2);
  const currency = paymentData.currency;
  
  // Generate hash according to PayHere documentation
  const hash = crypto
    .createHash('md5')
    .update(
      merchantId +
      paymentData.order_id +
      amount +
      currency +
      crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase()
    )
    .digest('hex')
    .toUpperCase();
  
  return hash;
}

export function verifyPayHereWebhook(
  config: PayHereConfig,
  data: Record<string, any>
): boolean {
  const merchantSecret = config.merchantSecret;
  
  const merchantId = data.merchant_id;
  const orderId = data.order_id;
  const payHereOrderId = data.payhere_order_id;
  const currency = data.currency;
  const amount = data.payhere_amount;
  const statusCode = data.status_code;
  
  const localAmount = parseFloat(amount).toFixed(2);
  
  const hash = crypto
    .createHash('md5')
    .update(
      merchantId +
      orderId +
      payHereOrderId +
      localAmount +
      currency +
      statusCode +
      crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase()
    )
    .digest('hex')
    .toUpperCase();
  
  return hash === data.md5sig;
}
