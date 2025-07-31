
// This file contains the routes for handling card-related requests.

const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
require("dotenv").config();
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

//Creating a user
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
			//hardcoded address for demo purposes
          line1: "123 Main Street",
          city: "San Francisco",
          state: "CA",
          postal_code: "94111",
          country: "US"
        }
      }
    });

	// Add user to Firestore
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
router.post("/ghost_cards", async (req, res) => {
  try {
    const { user_id, amount, allowed_merchants, expires_at } = req.body;

    // 1️⃣ Get user from Firestore
    const userSnap = await db.collection("users").doc(user_id).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    const userData = userSnap.data();

    if (!userData.stripe_cardholder_id) {
      return res.status(400).json({ error: "User does not have a Stripe Cardholder ID" });
    }

    // 2️⃣ Create Stripe Virtual Card
    const card = await stripe.issuing.cards.create({
      cardholder: userData.stripe_cardholder_id,
      currency: "usd",
      type: "virtual",
      spending_controls: {
        spending_limits: [{
          amount: amount * 100, // cents
          interval: "all_time"
        }]
      }
    });

    // 3️⃣ Immediately retrieve card details with number + cvc
    const fullCard = await stripe.issuing.cards.retrieve(card.id, {
      expand: ['number', 'cvc']
    });

    // 4️⃣ Save in Firestore
    const cardRef = await db.collection("ghost_cards").add({
      user_id,
      stripe_card_id: card.id,
      amount,
      allowed_merchants,
      expires_at: admin.firestore.Timestamp.fromDate(new Date(expires_at)),
      status: "active",
      last4: fullCard.last4,
      exp_month: fullCard.exp_month,
      exp_year: fullCard.exp_year
    });

    // 5️⃣ Return full details in test mode
    res.json({
      success: true,
      ghost_card_id: cardRef.id,
      stripe_card: {
        number: fullCard.number, // Test mode only
        last4: fullCard.last4,
        exp_month: fullCard.exp_month,
        exp_year: fullCard.exp_year,
        cvc: fullCard.cvc
      }
    });

  } catch (err) {
    console.error("Error creating ghost card:", err.stack);
    res.status(500).json({ error: err.message });
  }
});


router.post("/ghost_cards/:card_id/deactivate", async (req, res) => {
  try {
    const { card_id } = req.params;

    // 1️⃣ Cancel the card in Stripe
    const updatedCard = await stripe.issuing.cards.update(card_id, {
      status: "canceled"  // Or "inactive" if temporary freeze
    });

    // 2️⃣ Update status in Firestore
    const cardsQuery = await db.collection("ghost_cards")
      .where("stripe_card_id", "==", card_id)
      .get();

    cardsQuery.forEach(doc => {
      doc.ref.update({ status: updatedCard.status });
    });

    res.json({
      success: true,
      message: `Card ${card_id} has been ${updatedCard.status}`,
      stripe_status: updatedCard.status
    });

  } catch (err) {
    console.error("Error deactivating card:", err.stack);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
