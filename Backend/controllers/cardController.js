// This file will contain the logic for handling requests and responses related to cards.

const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const admin = require("firebase-admin");


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
        const { cardholder_id, allowed_merchants, balance, expiration_date, status } = req.body;
        // Create Stripe card without spending controls
        const card = await stripe.issuing.cards.create({
            cardholder: cardholder_id,
            currency: "usd",
            type: "virtual"
        });

        // Store card info and allowed_merchants in Firestore
        const cardDoc = await db.collection("ghost_cards").add({
            card_id: card.id,
            cardholder_id,
            allowed_merchants,
            balance,
            expiration_date,
            status,
            created_at: admin.firestore.Timestamp.now()
        });

        res.json({
            success: true,
            card: card,
            card_db_id: cardDoc.id,
            cardholder_id: cardholder_id,
            balance: balance,
            allowed_merchants: allowed_merchants,
            expiration_date: expiration_date,
            status: status
        });

    } catch (error) {
        console.error("Error creating card:", error);
        res.status(500).json({ error: "Failed to create card" });
    }
};

// Export modules
module.exports = {
    createCard,
}
