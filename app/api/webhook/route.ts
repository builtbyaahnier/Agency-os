import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

// Initialize Stripe 
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-02-25.clover', // Matching your installed version!
});

// This is the secret password Stripe uses to prove it's actually them calling
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event;

  try {
    // 🛑 SECURITY CHECK: Verify the signature using your webhook secret
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // 🟢 IF WE PASS THE SECURITY CHECK, HANDLE THE EVENT:
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Remember when we passed the clientId in the last step? Here it is!
    const clientId = session.client_reference_id;

    if (clientId) {
      console.log(`💰 Payment successful for Client: ${clientId}! Updating database...`);
      
     // Get the Customer ID that Stripe just created for them
      const stripeCustomerId = session.customer as string;

      console.log(`💰 Payment successful for Client: ${clientId}! Updating database...`);
      
      // Update the database to unlock their portal AND save their Stripe ID
      const { error } = await supabase
        .from('websites')
        .update({ 
          is_subscribed: true,
          stripe_customer_id: stripeCustomerId // 👈 WE NOW SAVE THIS!
        })
        .eq('client_id', clientId);
    }
  }

  // Tell Stripe we received the message so they don't keep calling us
  return NextResponse.json({ received: true }, { status: 200 });
}