// cardRoutes.js - Defines API endpoints for GhostCard

const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccountKey.json");

// Initialize Firebase Admin (only once in your app)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// About endpoint
router.get("/about", (req, res) => {
  res.send("This is an API service for GhostCard.");
});

// Create user endpoint
router.post("/users", async (req, res) => {
  try {
    const { name, total_balance } = req.body;

    const docRef = await db.collection("Users").add({
      name,
      total_balance,
      created_at: admin.firestore.Timestamp.now()
    });

    res.json({ success: true, user_id: docRef.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
