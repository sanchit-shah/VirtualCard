
// This file contains the routes for handling card-related requests.

const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
require("dotenv").config();
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const { createCard } = require('../controllers/cardController');

// POST /cards - Create a new virtual card
router.post('/cards', createCard);

module.exports = router;
