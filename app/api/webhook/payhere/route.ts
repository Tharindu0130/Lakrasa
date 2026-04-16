import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPayHereWebhook } from '@/lib/payhere';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    // Verify webhook signature
    const isValid = verifyPayHereWebhook(
      {
        merchantId: process.env.PAYHERE_MERCHANT_ID || '',
        merchantSecret: process.env.PAYHERE_MERCHANT_SECRET || '',
      },
      data as Record<string, any>
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Initialize Supabase with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const orderId = data.order_id as string;
    const statusCode = data.status_code as string;
    const payHereOrderId = data.payhere_order_id as string;
    const amount = parseFloat(data.payhere_amount as string);
    const paymentMethod = data.method as string;

    // Determine payment status based on status code
    let paymentStatus: string;
    let orderStatus: string;

    switch (statusCode) {
      case '2': // Success
        paymentStatus = 'paid';
        orderStatus = 'processing';
        break;
      case '0': // Pending
        paymentStatus = 'pending';
        orderStatus = 'pending';
        break;
      case '-1': // Cancelled
        paymentStatus = 'cancelled';
        orderStatus = 'cancelled';
        break;
      case '-2': // Failed
        paymentStatus = 'failed';
        orderStatus = 'failed';
        break;
      case '-3': // Chargedback
        paymentStatus = 'chargedback';
        orderStatus = 'refunded';
        break;
      default:
        paymentStatus = 'unknown';
        orderStatus = 'pending';
    }

    // Update order payment status
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
      })
      .eq('id', orderId);

    if (orderError) {
      console.error('Error updating order:', orderError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // Insert payment record
    const { error: paymentError } = await supabase.from('payments').insert({
      order_id: orderId,
      gateway: 'payhere',
      gateway_payment_id: payHereOrderId,
      amount: amount,
      status: paymentStatus,
      payment_method: paymentMethod,
    });

    if (paymentError) {
      console.error('Error inserting payment:', paymentError);
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }

    console.log(`Payment webhook processed: Order ${orderId}, Status: ${paymentStatus}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
