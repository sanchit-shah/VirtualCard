
// This file contains the routes for handling card-related requests.

const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
require("dotenv").config();
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // ✅ Direct from env
const { createCard, deactivateCard } = require("../controllers/cardController");

const serviceAccount = require("../config/serviceAccountKey.json");
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


router.post("/create_ghost_cards", async (req, res) => {
  try {
    await createCard(req, res);
  } catch (err) {
    console.error("Route error:", err.stack);
    res.status(500).json({ error: err.message || "Unexpected error" });
  }
});

router.post("/create_ghost_cards/:card_id/deactivate", deactivateCard);

router.get("/ghost_cards", async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "Missing user_id" });

    const cardsSnap = await db.collection("ghost_cards")
      .where("user_id", "==", user_id)
      .get();

    const cards = cardsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ success: true, cards });
  } catch (err) {
    console.error("Error fetching ghost cards:", err);
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
