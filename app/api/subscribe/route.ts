import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  console.log("🟢 1. Subscribe API Route hit!");

  try {
    // Safety check for the environment variable
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("CRITICAL: STRIPE_SECRET_KEY is missing from .env.local!");
    }

    console.log("🟢 2. Initializing Stripe SDK...");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover',// 👈 This is required by Stripe!
    });

    console.log("🟢 3. Parsing request body...");
    const { clientId, priceId } = await req.json();
    console.log(`-> Client ID: ${clientId} | Price ID: ${priceId}`);

    const portalUrl = `${req.headers.get('origin')}/portal/${clientId}`;
    console.log("🟢 4. Creating Stripe session...");

    // Create the Subscription Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, 
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${portalUrl}?success=true`,
      cancel_url: `${portalUrl}?canceled=true`,
      client_reference_id: clientId, 
    });

    console.log("🟢 5. Success! Sending user to Stripe URL...");
    return NextResponse.json({ url: session.url });
    
  } catch (error: any) {
    console.error("🔴 STRIPE FATAL ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}