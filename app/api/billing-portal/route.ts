import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const { clientId } = await req.json();

    // 1. Ask Supabase for this client's specific Stripe Customer ID
    const { data, error } = await supabase
      .from('websites')
      .select('stripe_customer_id')
      .eq('client_id', clientId)
      .single();

    if (error || !data?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found for this client." }, { status: 400 });
    }

    // 2. Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2026-02-25.clover', // Matching your version!
    });

    // 3. Generate the secure portal link and tell Stripe where to send them back to
    const returnUrl = `${req.headers.get('origin')}/portal/${clientId}`;
    
    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id, // The ID we just pulled from the database!
      return_url: returnUrl,
    });

    // 4. Send the URL back to the front-end
    return NextResponse.json({ url: session.url });
    
  } catch (error: any) {
    console.error("Stripe Portal Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}