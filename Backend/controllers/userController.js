// This file contains the user controller for handling user-related requests.

require("dotenv").config();
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const admin = require("firebase-admin");


/**
 * Creates a new Stripe Cardholder using provided user data.
 * @param {Object} data - User data (name)
 * @returns {Promise<Object>} - Returns Stripe cardholder object
 */
async function createStripeCardholder(data) {
    try {
        const cardholder = await stripe.issuing.cardholders.create({
            name: data.name,
            email: `${data.name.replace(/\s/g, "").toLowerCase()}@ghostcard.com`,
            type: "individual",
            status: "active",
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
        return cardholder;
    } catch (err) {
        throw new Error("Error creating Stripe cardholder: " + err.message);
    }
}



/**
 * Creates a new user document in Firestore "users" collection.
 * @param {Object} data - User data (name, stripe_cardholder_id)
 * @returns {Promise<Object>} - Returns Firestore document reference
 */
async function createDatabaseUser(data) {
    try {
        const db = admin.firestore();
        const userRef = await db.collection("users").add({
            name: data.name,
            stripe_cardholder_id: data.stripe_cardholder_id,
            card_ids: [],
            open_card_count: 0,
            created_at: admin.firestore.Timestamp.now()
        });
        return userRef;
    } catch (err) {
        throw new Error("Error creating database user: " + err.message);
    }
}


/**
 * Creates a new user by registering a Stripe Cardholder and storing user data in Firestore.
 *
 * @async
 * @function createUser
 * @param {Object} req - Express request object containing user data in the body.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.name - The name of the user.
 * @param {Object} res - Express response object used to send the response.
 * @returns {Promise<void>} Responds with JSON containing success status, user ID, and Stripe cardholder ID, or an error message.
 */
async function createUser(req, res) {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Missing name" });
        }

        // Check for existing user
        const db = admin.firestore();
        const existingUserQuery = await db.collection("users")
            .where("name", "==", name)
            .limit(1)
            .get();

        if (!existingUserQuery.empty) {
            // Return existing user
            const userDoc = existingUserQuery.docs[0];
            const userData = userDoc.data();

            return res.json({
                success: true,
                user_id: userDoc.id,
                stripe_cardholder_id: userData.stripe_cardholder_id,
                card_ids: userData.card_ids || [],
                open_card_count: userData.open_card_count || 0,
                created_at: userData.created_at,
                is_existing_user: true,
                message: `Welcome back, ${name}!`
            });
        }


        // Create Stripe Cardholder
        const cardholder = await createStripeCardholder({ name });


        // Create Firestore user
        const userRef = await createDatabaseUser({
            name,
            stripe_cardholder_id: cardholder.id,
            card_ids: [],
            open_card_count: 0,
            created_at: admin.firestore.Timestamp.now()
        });

        res.json({
            success: true,
            user_id: userRef.id,
            stripe_cardholder_id: cardholder.id,
            card_ids: [],
            open_card_count: 0,
            created_at: admin.firestore.Timestamp.now(),
            is_existing_user: false,
            message: `Welcome to VirtualCard, ${name}!`
        });
    } catch (err) {
        console.error("Error creating user:", err.stack);
        res.status(500).json({ error: err.message });
    }
};




// Export modules
module.exports = {
    createUser
}
