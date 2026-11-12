import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceRole)

    const payload = await req.json()
    const { orderId, paymentStatus, customerEmail, customerName, institutionName } = payload

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing 'orderId' in payload" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Processing order fulfillment for order: ${orderId}, status: ${paymentStatus}`)

    // 1. Update order payment status
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus || 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (orderErr) {
      console.error('Failed to update order:', orderErr)
      throw orderErr
    }

    // 2. Auto-provision School if institutionName provided and school_id is null
    let schoolId = order.school_id
    if (!schoolId && (institutionName || order.institution_name)) {
      const name = institutionName || order.institution_name
      const { data: newSchool, error: schoolErr } = await supabase
        .from('schools')
        .insert({
          name: name,
          contact_email: customerEmail || order.customer_email,
          contact_phone: order.customer_phone || null
        })
        .select('id')
        .single()

      if (!schoolErr && newSchool) {
        schoolId = newSchool.id
        await supabase
          .from('orders')
          .update({ school_id: schoolId })
          .eq('id', orderId)

        // Create standard annual subscription
        await supabase
          .from('subscriptions')
          .insert({
            school_id: schoolId,
            plan_name: 'Campus Enterprise Annual License',
            billing_cycle: 'annual',
            amount: order.total_amount,
            currency: order.currency,
            status: 'active'
          })
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      orderId, 
      schoolId,
      message: "Order fulfilled and provisioned successfully" 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error("Order fulfillment error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

