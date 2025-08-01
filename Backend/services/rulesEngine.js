// This file will handle the logic to approve or reject charges.

const admin = require("firebase-admin");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Main function to evaluate a transaction against all rules
 * @param {Object} transaction - Transaction data
 * @param {string} transaction.card_id - Stripe card ID
 * @param {string} transaction.merchant - Merchant name
 * @param {number} transaction.amount - Transaction amount in cents
 * @param {string} transaction.currency - Transaction currency
 * @param {Object} card - Card data from Firestore
 * @returns {Object} - { approved: boolean, reason: string }
 */
async function evaluateTransaction(transaction, card) {
    try {
        // Check if card exists
        if (!card) {
            return { approved: false, reason: "Card not found" };
        }

        // Special handling for $0 transactions - bypass Stripe entirely for testing
        const transactionAmount = typeof transaction.amount === "number" ? transaction.amount : parseFloat(transaction.amount);
        if (transactionAmount === 0) {
            console.log("Processing $0 test transaction - bypassing Stripe");

            // Still run basic validation checks for $0 transactions
            const cardStatusCheck = checkCardStatus(card);
            if (!cardStatusCheck.approved) {
                return cardStatusCheck;
            }

            const merchantCheck = checkMerchantRestrictions(transaction, card);
            if (!merchantCheck.approved) {
                return merchantCheck;
            }

            const expirationCheck = checkExpiration(card);
            if (!expirationCheck.approved) {
                return expirationCheck;
            }

            // For $0 single-use cards, still check if already used
            if (card.single_use && card.used) {
                return { approved: false, reason: "Single-use card already used" };
            }

            // Approve $0 transactions for testing purposes
            return { approved: true, reason: "$0 test transaction approved" };
        }

        // Normal processing for non-zero transactions
        const cardStatusCheck = checkCardStatus(card);
        if (!cardStatusCheck.approved) {
            return cardStatusCheck;
        }

        // Check merchant restrictions first
        const merchantCheck = checkMerchantRestrictions(transaction, card);
        if (!merchantCheck.approved) {
            return merchantCheck;
        }

        // Check expiration
        const expirationCheck = checkExpiration(card);
        if (!expirationCheck.approved) {
            return expirationCheck;
        }

        // Special handling for single-use cards
        if (card.single_use) {
            // If it's already used, reject
            if (card.used) {
                return { approved: false, reason: "Single-use card already used" };
            }

            // For unused single-use cards with valid merchants, approve immediately
            // The card will be deactivated in updateCardAfterTransaction
            return { approved: true, reason: "Single-use card transaction approved" };
        }

        // For regular cards, check balance/spending limits
        const balanceCheck = checkBalance(transaction, card);
        if (!balanceCheck.approved) {
            return balanceCheck;
        }

        // Check general usage restrictions (for non-single-use cards)
        const usageCheck = checkUsageRestrictions(card);
        if (!usageCheck.approved) {
            return usageCheck;
        }

        // All checks passed
        return { approved: true, reason: "Transaction approved" };

    } catch (error) {
        console.error("Error evaluating transaction:", error);
        return { approved: false, reason: "System error during evaluation" };
    }
}

/**
 * Check if the card is in active status
 * @param {Object} card - Card data
 * @returns {Object} - { approved: boolean, reason: string }
 */
function checkCardStatus(card) {
    if (!card) {
        return { approved: false, reason: "Card not found" };
    }

    // Allow transaction processing for deactivated single-use cards to show proper rejection
    if (card.status !== "active") {
        if (card.single_use && (card.status === "canceled" || card.used)) {
            return { approved: false, reason: "Single-use card already used and deactivated" };
        }
        return { approved: false, reason: "Card inactive" };
    }

    return { approved: true, reason: "Card status valid" };
}

/**
 * Check if merchant is allowed for this card
 * @param {Object} transaction - Transaction data
 * @param {Object} card - Card data
 * @returns {Object} - { approved: boolean, reason: string }
 */
function checkMerchantRestrictions(transaction, card) {
    // If no merchant restrictions, allow all
    if (!card.allowed_merchants || card.allowed_merchants.length === 0) {
        return { approved: true, reason: "No merchant restrictions" };
    }

    // Check if merchant is in allowed list
    if (!card.allowed_merchants.includes(transaction.merchant)) {
        return { approved: false, reason: "Merchant not allowed" };
    }

    return { approved: true, reason: "Merchant allowed" };
}

/**
 * Check if card has sufficient balance
 * @param {Object} transaction - Transaction data
 * @param {Object} card - Card data
 * @returns {Object} - { approved: boolean, reason: string }
 */
function checkBalance(transaction, card) {
    const cardBalance = typeof card.balance === "number" ? card.balance : parseFloat(card.balance || 0);
    const transactionAmount = typeof transaction.amount === "number" ? transaction.amount : parseFloat(transaction.amount);

    if (transactionAmount > cardBalance) {
        return { approved: false, reason: "Insufficient balance" };
    }
    return { approved: true, reason: "Sufficient balance" };
}

/**
 * Check if card has expired
 * @param {Object} card - Card data
 * @returns {Object} - { approved: boolean, reason: string }
 */
function checkExpiration(card) {
    const now = new Date();

    // Check expires_at field (Firestore Timestamp)
    if (card.expires_at) {
        const expirationDate = card.expires_at.toDate ? card.expires_at.toDate() : new Date(card.expires_at);
        if (now > expirationDate) {
            return { approved: false, reason: "Card expired" };
        }
    }

    // Fallback check for expiration_date field
    if (card.expiration_date) {
        const expirationDate = new Date(card.expiration_date);
        if (now > expirationDate) {
            return { approved: false, reason: "Card expired" };
        }
    }

    return { approved: true, reason: "Card not expired" };
}

/**
 * Check usage restrictions (e.g., usage limits) - excludes single-use logic
 * @param {Object} card - Card data
 * @returns {Object} - { approved: boolean, reason: string }
 */
function checkUsageRestrictions(card) {
    // Single-use cards are handled separately in evaluateTransaction
    // This function only handles general usage limits

    // Check if card has usage limit
    if (card.usage_limit && card.usage_count >= card.usage_limit) {
        return { approved: false, reason: "Usage limit reached" };
    }

    return { approved: true, reason: "Usage restrictions passed" };
}

/**
 * Get card data from Firestore by card_id
 * @param {string} cardId - Stripe card ID
 * @returns {Object|null} - Card data or null if not found
 */
async function getCardData(cardId) {
    try {
        const db = admin.firestore();
        const cardQuery = await db.collection("ghost_cards")
            .where("stripe_card_id", "==", cardId)
            .limit(1)
            .get();

        if (cardQuery.empty) {
            return null;
        }

        const cardDoc = cardQuery.docs[0];
        return { id: cardDoc.id, ...cardDoc.data() };
    } catch (error) {
        console.error("Error fetching card data:", error);
        return null;
    }
}

/**
 * Update card data after transaction (deduct balance, increment usage)
 * @param {string} cardDocId - Firestore document ID
 * @param {Object} transaction - Transaction data
 * @param {Object} card - Current card data
 * @returns {boolean} - Success status
 */
async function updateCardAfterTransaction(cardDocId, transaction, card) {
  try {
    const db = admin.firestore();

    const currentBalance = typeof card.balance === "number" ? card.balance : parseFloat(card.balance);
    const deduction = typeof transaction.amount === "number" ? transaction.amount : parseFloat(transaction.amount);

    // Special handling for $0 test transactions
    if (deduction === 0) {
      console.log("Processing $0 test transaction update - minimal Stripe interaction");

      const updates = {
        usage_count: (card.usage_count || 0) + 1,
        last_transaction: admin.firestore.Timestamp.now()
      };

      // For single-use cards, still mark as used even for $0 transactions
      if (card.single_use) {
        updates.used = true;
        updates.status = "canceled";

        // Try to deactivate in Stripe, but don't fail if it doesn't work
        if (card.stripe_card_id) {
          try {
            await stripe.issuing.cards.update(card.stripe_card_id, { status: "canceled" });
          } catch (stripeErr) {
            console.log("Note: Could not deactivate card in Stripe for $0 transaction:", stripeErr.message);
          }
        }
      }

      // Update card data in ghost_cards
      await db.collection("ghost_cards").doc(cardDocId).update(updates);

      // Log the $0 test transaction
      await db.collection("transactions").add({
        card_id: transaction.card_id,
        ghost_card_id: cardDocId,
        amount: 0,
        merchant: transaction.merchant,
        currency: transaction.currency,
        status: "approved",
        reason: "$0 test transaction approved",
        timestamp: admin.firestore.Timestamp.now(),
        remaining_balance: currentBalance // Balance unchanged for $0 transactions
      });

      return true;
    }

    // Normal processing for non-zero transactions
    const effectiveBalance = card.single_use ? (card.original_amount || card.balance) : currentBalance;
    const finalBalance = Math.max(0, effectiveBalance - deduction);

    const updates = {
      balance: finalBalance,
      usage_count: (card.usage_count || 0) + 1,
      last_transaction: admin.firestore.Timestamp.now()
    };

    let shouldDeactivate = false;

    // Mark as used if single-use card
    if (card.single_use) {
      updates.used = true;
      updates.status = "canceled"; // Auto-cancel after use
      shouldDeactivate = true;
    }

    // Deactivate if balance is zero or less
    if (finalBalance <= 0) {
      updates.status = "canceled";
      shouldDeactivate = true;
    }

    // Deactivate if expired (optional, but you may want to check here too)
    if (card.expires_at) {
      const expirationDate = card.expires_at.toDate ? card.expires_at.toDate() : new Date(card.expires_at);
      if (new Date() > expirationDate) {
        updates.status = "canceled";
        shouldDeactivate = true;
      }
    }

    // Update card data in ghost_cards
    await db.collection("ghost_cards").doc(cardDocId).update(updates);

    // Deactivate in Stripe if needed
    if (shouldDeactivate && card.stripe_card_id) {
      try {
        await stripe.issuing.cards.update(card.stripe_card_id, { status: "canceled" });
      } catch (stripeErr) {
        console.error("Failed to deactivate card in Stripe:", stripeErr);
      }
    }

    // ✅ Log approved transaction in transactions collection
    await db.collection("transactions").add({
      card_id: transaction.card_id,         // Stripe card ID
      ghost_card_id: cardDocId,             // Firestore doc ID
      amount: transaction.amount,
      merchant: transaction.merchant,
      currency: transaction.currency,
      status: "approved",
      reason: card.single_use ? "Single-use card transaction approved" : "Transaction approved",
      timestamp: admin.firestore.Timestamp.now(),
      remaining_balance: finalBalance
    });

    return true;
  } catch (error) {
    console.error("Error updating card after transaction:", error);
    return false;
  }
}

/**
 * Log a rejected transaction to the transactions collection
 * @param {string} cardDocId - Firestore document ID
 * @param {Object} transaction - Transaction data
 * @param {Object} card - Current card data
 * @param {string} reason - Rejection reason
 * @returns {boolean} - Success status
 */
async function logRejectedTransaction(cardDocId, transaction, card, reason) {
  try {
    const db = admin.firestore();

    await db.collection("transactions").add({
      card_id: transaction.card_id,         // Stripe card ID
      ghost_card_id: cardDocId,             // Firestore doc ID
      amount: transaction.amount,
      merchant: transaction.merchant,
      currency: transaction.currency,
      status: "rejected",
      reason: reason,
      timestamp: admin.firestore.Timestamp.now(),
      remaining_balance: card.balance
    });

    return true;
  } catch (error) {
    console.error("Error logging rejected transaction:", error);
    return false;
  }
}

module.exports = {
    evaluateTransaction,
    getCardData,
    updateCardAfterTransaction,
    logRejectedTransaction,
    checkCardStatus,
    checkMerchantRestrictions,
    checkBalance,
    checkExpiration,
    checkUsageRestrictions
};
