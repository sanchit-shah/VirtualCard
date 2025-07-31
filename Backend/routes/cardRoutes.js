
const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccountKey.json");
require("dotenv").config(); // ✅ Load env variables
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // ✅ Direct from env

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

router.get("/about", (req, res) => {
  res.send("This is an API service for GhostCard.");
});

router.post("/users", async (req, res) => {
  try {
    const { name, total_balance } = req.body;

    if (!name || total_balance === undefined) {
      return res.status(400).json({ error: "Missing name or total_balance" });
    }

    // Create Stripe Cardholder using key from env
    const cardholder = await stripe.issuing.cardholders.create({
      name,
      email: `${name.replace(/\s/g, "").toLowerCase()}@ghostcard.com`,
      type: "individual",
      billing: {
        address: {
          line1: "123 Main Street",
          city: "San Francisco",
          state: "CA",
          postal_code: "94111",
          country: "US"
        }
      }
    });

    const userRef = await db.collection("users").add({
      name,
      total_balance,
      stripe_cardholder_id: cardholder.id,
      created_at: admin.firestore.Timestamp.now()
    });

    res.json({
      success: true,
      user_id: userRef.id,
      stripe_cardholder_id: cardholder.id
    });

  } catch (err) {
    console.error("Error creating user:", err.stack);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
