// This file will contain the logic for handling requests and responses related to cards.

const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const admin = require("firebase-admin");
const { evaluateTransaction, getCardData, updateCardAfterTransaction } = require("../services/rulesEngine");

/**
 * Creates a new virtual card using Stripe Issuing and stores its information in Firestore.
 *
 * @async
 * @function createCard
 * @param {Object} req - Express request object containing card details in the body.
 * @param {string} req.body.cardholder_id - The Stripe cardholder ID.
 * @param {Array<string>} req.body.allowed_merchants - List of allowed merchant IDs for the card.
 * @param {number} req.body.balance - Initial balance for the card.
 * @param {string} req.body.expiration_date - Expiration date of the card.
 * @param {string} req.body.status - Status of the card (e.g., 'active', 'inactive').
 * @param {Object} res - Express response object used to send the result.
 * @returns {Promise<void>} Sends a JSON response with card details on success, or an error message on failure.
 */
async function createCard(req, res) {
  try {
    const db = admin.firestore();
    const { user_id, amount, allowed_merchants, expires_at, alias, color_theme, single_use } = req.body;

    // Validate required fields
    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    // Ensure amount is a valid number (including 0)
    const parsedAmount = parseFloat(amount);
    if (amount === '' || isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ error: "amount must be $0.00 or greater" });
    }

    if (!expires_at) {
      return res.status(400).json({ error: "expires_at is required" });
    }

    console.log("Creating card with amount:", parsedAmount, "cents will be:", parsedAmount * 100);

    // 1️⃣ Get user from Firestore (search by user_id or stripe_cardholder_id)
    let userSnap;

    // Try to find by Firestore document ID first
    userSnap = await db.collection("users").doc(user_id).get();

    // If not found, try to find by stripe_cardholder_id
    if (!userSnap.exists) {
      const userQuery = await db.collection("users")
        .where("stripe_cardholder_id", "==", user_id)
        .limit(1)
        .get();

      if (!userQuery.empty) {
        userSnap = userQuery.docs[0];
      }
    }

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    const userData = userSnap.data();

    if (!userData.stripe_cardholder_id) {
      return res.status(400).json({ error: "User does not have a Stripe Cardholder ID" });
    }

    // 2️⃣ Create Stripe Virtual Card with spending controls
    const cardConfig = {
      cardholder: userData.stripe_cardholder_id,
      currency: "usd",
      type: "virtual"
    };

    // Only add spending limits if amount > 0 (Stripe requires minimum 1 cent)
    if (parsedAmount > 0) {
      cardConfig.spending_controls = {
        spending_limits: [{
          amount: Math.round(parsedAmount * 100), // Ensure integer cents
          interval: "all_time"
        }]
      };
    }

    const card = await stripe.issuing.cards.create(cardConfig);

    // 3️⃣ Retrieve full card details (test mode only)
    const fullCard = await stripe.issuing.cards.retrieve(card.id, {
      expand: ['number', 'cvc']
    });

    // 4️⃣ Save card info in Firestore
    const cardRef = await db.collection("ghost_cards").add({
      user_id,
      stripe_card_id: card.id,
      balance: parsedAmount, // Use parsed amount
      original_amount: parsedAmount, // Keep original amount field for reference
      allowed_merchants,
      expires_at: admin.firestore.Timestamp.fromDate(new Date(expires_at)),
      status: "active",
      last4: fullCard.last4,
      exp_month: fullCard.exp_month,
      exp_year: fullCard.exp_year,
      alias: alias || `Ghost Card ${Date.now().toString().slice(-4)}`, // Save alias or generate default
      color_theme: color_theme || 'ocean', // Save color theme or default to ocean
      single_use: Boolean(single_use), // Add single-use flag
      used: false, // Initialize as unused
      usage_count: 0 // Initialize usage count
    });

    // 4️⃣ Save card id to user's card list and increase open card count by 1
    await db.collection("users").doc(userSnap.id).update({
      ghost_cards: admin.firestore.FieldValue.arrayUnion(cardRef.id),
      open_card_count: admin.firestore.FieldValue.increment(1),
      card_ids : admin.firestore.FieldValue.arrayUnion(card.id)
    });


    // 5️⃣ Return full card details (test mode)
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

  } catch (error) {
    console.error("Error creating card:", error);
    res.status(500).json({ error: "Failed to create card" });
  }
}


async function deactivateCard(req, res) {
  try {
    const { card_id } = req.params;
    const db = admin.firestore();

    // 1️⃣ Cancel the card in Stripe
    const updatedCard = await stripe.issuing.cards.update(card_id, {
      status: "canceled" // or "inactive" if temporary freeze
    });

    // 2️⃣ Update status in Firestore
    const cardsQuery = await db.collection("ghost_cards")
      .where("stripe_card_id", "==", card_id)
      .get();

    const batch = db.batch();
    cardsQuery.forEach(doc => {
      batch.update(doc.ref, { status: updatedCard.status });
    });
    await batch.commit();

    // 3️⃣ Respond to client
    res.json({
      success: true,
      message: `Card ${card_id} has been ${updatedCard.status}`,
      stripe_status: updatedCard.status
    });

  } catch (err) {
    console.error("Error deactivating card:", err.stack);
    res.status(500).json({ error: err.message });
  }
}


async function updateCard(req, res) {
    try {
        const { card_id } = req.params;
        const { alias, allowed_merchants, expires_at, color_theme } = req.body;
        const db = admin.firestore();

        // 1️⃣ Find the ghost card in Firestore
        const cardsQuery = await db.collection("ghost_cards")
            .where("stripe_card_id", "==", card_id)
            .limit(1)
            .get();

        if (cardsQuery.empty) {
            return res.status(404).json({ error: "Card not found" });
        }

        const cardDoc = cardsQuery.docs[0];

        // 2️⃣ Prepare update data
        const updateData = {};

        if (alias !== undefined) updateData.alias = alias;
        if (allowed_merchants !== undefined) updateData.allowed_merchants = allowed_merchants;
        if (color_theme !== undefined) updateData.color_theme = color_theme;
        if (expires_at !== undefined) {
            updateData.expires_at = admin.firestore.Timestamp.fromDate(new Date(expires_at));
        }

        // 3️⃣ Update the card document in Firestore
        await cardDoc.ref.update(updateData);

        // 4️⃣ Return success response
        res.json({
            success: true,
            message: `Card rules updated successfully`,
            updated_fields: Object.keys(updateData)
        });

    } catch (err) {
        console.error("Error updating card:", err.stack);
        res.status(500).json({ error: err.message });
    }
}


async function deleteCard(req, res) {
    try {
        const { card_id } = req.params;
        const db = admin.firestore();

        // 1️⃣ Find the ghost card in Firestore
        const cardsQuery = await db.collection("ghost_cards")
            .where("stripe_card_id", "==", card_id)
            .limit(1)
            .get();

        if (cardsQuery.empty) {
            return res.status(404).json({ error: "Card not found" });
        }

        const cardDoc = cardsQuery.docs[0];
        const cardData = cardDoc.data();

        // 2️⃣ Cancel/delete the card in Stripe
        await stripe.issuing.cards.update(card_id, {
            status: "canceled"
        });

        // 3️⃣ Remove card from user's card list and decrease count
        await db.collection("users").doc(cardData.user_id).update({
            ghost_cards: admin.firestore.FieldValue.arrayRemove(cardDoc.id),
            open_card_count: admin.firestore.FieldValue.increment(-1),
            card_ids: admin.firestore.FieldValue.arrayRemove(card_id)
        });

        // 4️⃣ Delete the card document from Firestore
        await cardDoc.ref.delete();

        // 5️⃣ Respond to client
        res.json({
            success: true,
            message: `Card ${cardData.alias || 'Ghost Card'} has been deleted`,
            deleted_card_id: card_id
        });

    } catch (err) {
        console.error("Error deleting card:", err.stack);
        res.status(500).json({ error: err.message });
    }
}


async function getGhostCards(req, res) {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({ error: "Missing user_id" });
        }

        const db = admin.firestore();
        const cardsSnap = await db.collection("ghost_cards")
            .where("user_id", "==", user_id)
            .get();

        const cards = cardsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({ success: true, cards });
    } catch (error) {
        console.error("Error fetching ghost cards:", error);
        res.status(500).json({ error: error.message });
    }
}

// Export modules
module.exports = {
    createCard,
    deactivateCard,
    updateCard,
    deleteCard,
    getGhostCards
}
