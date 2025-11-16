// server/paymentRoutes.js
import express from "express";
import fetch from "node-fetch"; // or native fetch in newer Node
import crypto from "crypto";

const router = express.Router();

const PHONEPE_BASE = process.env.PHONEPE_BASE_URL; // e.g. https://api.phonepe.com or sandbox base
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const MERCHANT_KEY = process.env.PHONEPE_MERCHANT_KEY; // secret for signing / auth depending on PhonePe
const WEBHOOK_SECRET = process.env.PHONEPE_WEBHOOK_SECRET;

function generateOrderId() {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
}

// 1) Create Payment (called by frontend)
router.post("/create-payment", async (req, res) => {
  const { name, amount, metaInfo } = req.body;
  const orderId = generateOrderId();

  // Construct PhonePe Create Payment payload per docs
  const payload = {
    orderId,
    amount: Math.round(Number(amount) * 100), // paisa if required (check docs)
    redirectUrl: `${process.env.APP_BASE_URL}/payments/return`, // optional
    // optional fields PhonePe supports:
    // expireAfter: 600,
    // metaInfo: metaInfo || {},
  };

  try {
    // Example: call PhonePe Create Payment API (exact endpoint/headers from docs)
    const phonepeRes = await fetch(`${PHONEPE_BASE}/v3/checkout/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MERCHANT_KEY}`, // adjust as per PhonePe docs
      },
      body: JSON.stringify(payload),
    });

    const data = await phonepeRes.json();

    // Save order to DB with status = 'created' (not shown here)
    // db.save({ orderId, name, amount, phonepeResponse: data, status: 'created' });

    // Return PayPage token/URL (fields depend on PhonePe response)
    return res.json({ ok: true, orderId, phonepe: data });
  } catch (err) {
    console.error("create-payment error", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// 2) Order Status (frontend will call this to verify)
router.get("/payment-status/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    const phonepeRes = await fetch(`${PHONEPE_BASE}/v3/checkout/payment/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${MERCHANT_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const data = await phonepeRes.json();

    // Optionally verify server-side status and update DB
    // db.update(orderId, { phonepeStatus: data });

    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 3) Webhook endpoint
router.post("/webhook/phonepe", express.json(), (req, res) => {
  const signature = req.headers["x-phonepe-signature"] || req.headers["x-webhook-signature"] || "";

  // Example verification: provider-specific. PhonePe docs specify how to compute HMAC.
  // Replace below with exact algorithm from docs:
  const payload = JSON.stringify(req.body);
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");

  if (signature !== expected) {
    console.warn("Invalid webhook signature");
    return res.status(401).send("invalid signature");
  }

  // Process event
  const event = req.body.event; // e.g. checkout.order.completed
  const { payload: eventPayload } = req.body;
  const orderId = eventPayload?.order?.orderId || eventPayload?.data?.orderId;

  // Update DB accordingly (example)
  // if (event === 'checkout.order.completed') db.update(orderId, { status: 'success', payload: eventPayload })
  // if (event === 'checkout.order.failed') db.update(orderId, { status: 'failed', payload: eventPayload })

  // respond 200 quickly
  res.status(200).send("ok");
});

export default router;
