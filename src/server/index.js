// server/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch"; // keep for Node <18; if Node>=18 you can remove and use global fetch
import crypto from "crypto";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.APP_BASE_URL || "http://localhost:5173" }));

const PORT = process.env.PORT || 4000;
const PHONEPE_BASE = process.env.PHONEPE_BASE_URL?.replace(/\/+$/, "") || "https://sandbox.phonepe.com";
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || "";
const CLIENT_ID = process.env.PHONEPE_CLIENT_ID || ""; // OAuth client id (if required)
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET || ""; // OAuth client secret (if required)
const WEBHOOK_SECRET = process.env.PHONEPE_WEBHOOK_SECRET || "";

// ---- In-memory token cache ----
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Get OAuth token from PhonePe (cached).
 * Endpoint path provided by you: /v1/oauth/token (POST)
 * Make sure to follow PhonePe's exact auth request body and header requirements.
 */
async function getAuthToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 5000) {
    // return cached token if not close to expiry
    return cachedToken;
  }

  // Build auth request per PhonePe docs:
  // Many providers expect client_id + client_secret in body or Basic Auth.
  // Update the body/headers below to match PhonePe's OAuth spec exactly.
  const authUrl = `${PHONEPE_BASE}/v1/oauth/token`;

  // Example payload - replace grant_type/client credentials per PhonePe docs if different
  const body = new URLSearchParams();
  body.append("grant_type", "client_credentials"); // commonly used
  // If PhonePe requires client_id & secret in body:
  body.append("client_id", CLIENT_ID);
  body.append("client_secret", CLIENT_SECRET);

  const res = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      // If PhonePe demands Basic Auth: Authorization: Basic base64(client:secret)
      // "Authorization": `Basic ${Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64")}`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Auth request failed: ${res.status} ${txt}`);
  }

  const json = await res.json();

  // Typical response: { access_token: "...", token_type: "Bearer", expires_in: 3600, ... }
  cachedToken = json.access_token || json.token || null;
  const expiresIn = Number(json.expires_in || json.expires || 3600) * 1000;
  tokenExpiresAt = Date.now() + expiresIn;

  if (!cachedToken) throw new Error("No access_token returned from auth");

  return cachedToken;
}

// ---- Helper: generate unique merchant order id ----
function generateOrderId() {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

// ----------------- Create Payment (Checkout) -----------------
// PhonePe Create Payment path per your list: POST /checkout/v2/pay
app.post("/api/create-payment", async (req, res) => {
  try {
    const { name, amount, metaInfo } = req.body;
    if (!name || !amount) return res.status(400).json({ ok: false, error: "name and amount required" });

    const merchantOrderId = generateOrderId();
    const amountInPaisa = Math.round(Number(amount) * 100); // check PhonePe expects paisa or rupees

    // Build request body exactly as PhonePe expects for /checkout/v2/pay.
    // IMPORTANT: check PhonePe docs for required keys — below is a typical example and may need modification.
    const payload = {
      merchantOrderId,
      amount: amountInPaisa,
      merchantName: name,
      // optional fields - add as per docs:
      // redirectUrl: `${process.env.APP_BASE_URL}/payments/return`,
      // expireAfter: 600,
      // metaInfo: metaInfo || {},
    };

    // Get auth token (if PhonePe uses OAuth). If PhonePe uses API key only, you may skip and use MERCHANT_KEY directly.
    const token = CLIENT_ID && CLIENT_SECRET ? await getAuthToken() : process.env.PHONEPE_MERCHANT_KEY;

    const createUrl = `${PHONEPE_BASE}/checkout/v2/pay`;

    const resp = await fetch(createUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Most likely: Authorization: Bearer <token>
        Authorization: token ? `Bearer ${token}` : "",
        "X-Merchant-Id": MERCHANT_ID, // add only if PhonePe requires this header
      },
      body: JSON.stringify(payload),
    });

    const phonepeJson = await resp.json();

    // Persist order to DB (not implemented here). Save: merchantOrderId, amountInPaisa, status='CREATED', phonepeJson
    // e.g., await db.insert({ merchantOrderId, name, amountInPaisa, status: "CREATED", phonepeResponse: phonepeJson });

    // Return the PhonePe response to frontend; frontend will find payUrl/redirect/iframe token per docs
    return res.json({ ok: true, merchantOrderId, phonepe: phonepeJson });
  } catch (err) {
    console.error("create-payment error:", err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// ----------------- Order Status -----------------
// GET /checkout/v2/order/{merchantOrderId}/status  (PhonePe path you provided)
app.get("/api/payment-status/:merchantOrderId", async (req, res) => {
  try {
    const { merchantOrderId } = req.params;
    if (!merchantOrderId) return res.status(400).json({ ok: false, error: "merchantOrderId required" });

    const token = CLIENT_ID && CLIENT_SECRET ? await getAuthToken() : process.env.PHONEPE_MERCHANT_KEY;
    const statusUrl = `${PHONEPE_BASE}/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status`;

    const resp = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        "X-Merchant-Id": MERCHANT_ID,
      },
    });

    const json = await resp.json();

    // Optionally update DB with returned status
    // await db.update({merchantOrderId}, { phonepeStatus: json });

    return res.json({ ok: true, data: json });
  } catch (err) {
    console.error("payment-status error:", err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// ----------------- Refund -----------------
// POST /payments/v2/refund  (path you provided)
app.post("/api/refund", async (req, res) => {
  try {
    const { merchantOrderId, merchantRefundId, amount, reason } = req.body;
    if (!merchantOrderId || !merchantRefundId || !amount) return res.status(400).json({ ok: false, error: "required fields missing" });

    const token = CLIENT_ID && CLIENT_SECRET ? await getAuthToken() : process.env.PHONEPE_MERCHANT_KEY;
    const refundUrl = `${PHONEPE_BASE}/payments/v2/refund`;

    // Build refund payload per PhonePe docs (change keys if necessary)
    const payload = {
      merchantOrderId,
      merchantRefundId,
      amount: Math.round(Number(amount) * 100),
      reason: reason || "refund",
    };

    const resp = await fetch(refundUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        "X-Merchant-Id": MERCHANT_ID,
      },
      body: JSON.stringify(payload),
    });

    const json = await resp.json();
    // Persist refund request result

    return res.json({ ok: true, data: json });
  } catch (err) {
    console.error("refund error:", err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// ----------------- Refund Status -----------------
// GET /payments/v2/refund/{merchantRefundId}/status0   (note: you gave a trailing 0 — verify exact path)
app.get("/api/refund-status/:merchantRefundId", async (req, res) => {
  try {
    const { merchantRefundId } = req.params;
    if (!merchantRefundId) return res.status(400).json({ ok: false, error: "merchantRefundId required" });

    const token = CLIENT_ID && CLIENT_SECRET ? await getAuthToken() : process.env.PHONEPE_MERCHANT_KEY;
    // If actual path is /payments/v2/refund/{merchantRefundId}/status remove the trailing 0
    const url = `${PHONEPE_BASE}/payments/v2/refund/${encodeURIComponent(merchantRefundId)}/status`;

    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        "X-Merchant-Id": MERCHANT_ID,
      },
    });

    const json = await resp.json();
    return res.json({ ok: true, data: json });
  } catch (err) {
    console.error("refund-status error:", err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// ----------------- Webhook handler -----------------
app.post("/api/webhook/phonepe", async (req, res) => {
  try {
    const signatureHeader = req.headers["x-phonepe-signature"] || req.headers["x-webhook-signature"] || req.headers["x-signature"] || "";
    const bodyString = JSON.stringify(req.body);

    // Verify signature: PHONEPE SPECIFIC
    // NOTE: Replace this HMAC-SHA256 with the exact algorithm/serialization PhonePe uses.
    if (WEBHOOK_SECRET) {
      const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(bodyString).digest("hex");
      if (signatureHeader !== expected) {
        console.warn("Webhook signature mismatch", { signatureHeader, expected });
        return res.status(401).send("invalid signature");
      }
    } else {
      console.warn("No WEBHOOK_SECRET provided - webhook not verified");
    }

    // Process events
    const evt = req.body.event || req.body.type || null;
    const payload = req.body.payload || req.body.data || req.body;

    console.log("Webhook event:", evt);
    console.log("Webhook payload:", payload);

    // Example event handling:
    // if (evt === "checkout.order.completed") { update DB order to 'SUCCESS' using payload.order.merchantOrderId }
    // if (evt === "checkout.order.failed") { update DB order to 'FAILED' }

    // Acknowledge quickly
    return res.status(200).send("ok");
  } catch (err) {
    console.error("webhook processing error:", err);
    return res.status(500).send("error");
  }
});

// ---- Basic health route ----
app.get("/", (req, res) => res.send("PhonePe backend running"));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
