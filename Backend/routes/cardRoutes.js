
// This file contains the routes for handling card-related requests.

const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
require("dotenv").config();
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // ✅ Direct from env
const { createCard, deactivateCard, chargeCard } = require("../controllers/cardController");

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

router.post("/charge", async (req, res) => {
  try {
    await chargeCard(req, res);
  } catch (err) {
    console.error("Route error:", err.stack);
    res.status(500).json({ error: err.message || "Unexpected error" });
  }
});

module.exports = router;
