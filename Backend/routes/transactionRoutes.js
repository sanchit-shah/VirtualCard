const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
require("dotenv").config();
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const serviceAccount = require("../config/serviceAccountKey.json");
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

const {
  evaluateTransaction,
  getCardData,
  updateCardAfterTransaction
} = require("../services/rulesEngine");

// POST /cards/charge - Simulate a transaction
// POST /cards/charge - Simulate a transaction
router.post("/cards/charge", async (req, res) => {
  try {
    const { card_id, amount, merchant } = req.body;
    if (!card_id || !amount || !merchant) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const card = await getCardData(card_id);
    if (!card) {
      return res.status(404).json({ approved: false, reason: "Card not found" });
    }

    const transaction = {
      card_id,
      merchant,
      amount: parseFloat(amount),
      currency: "usd"
    };

    const evaluation = await evaluateTransaction(transaction, card);

    if (evaluation.approved) {
      await updateCardAfterTransaction(card.id, transaction, card);
    } else {
      // ✅ Log rejected transaction
      await db.collection("transactions").add({
        card_id: transaction.card_id,
        ghost_card_id: card.id, // Firestore doc ID
        amount: transaction.amount,
        merchant: transaction.merchant,
        currency: transaction.currency,
        status: "rejected",
        reason: evaluation.reason || "Rejected by rules engine",
        timestamp: admin.firestore.Timestamp.now(),
        remaining_balance: card.balance
      });
    }

    res.json({
      approved: evaluation.approved,
      reason: evaluation.reason,
      remaining_balance: evaluation.approved
        ? card.balance - transaction.amount
        : card.balance
    });

  } catch (err) {
    console.error("Transaction simulation error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
// GET /cards/:card_id/transactions - List all transactions for a card
router.get("/cards/:card_id/transactions", async (req, res) => {
  try {
    const { card_id } = req.params;

    const transactionsSnap = await db.collection("transactions")
      .where("ghost_card_id", "==", card_id)
      .orderBy("timestamp", "desc")
      .get();

    const transactions = transactionsSnap.empty
      ? []
      : transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ success: true, transactions });
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

module.exports = router;