// This file contains the routes for handling user-related requests.

require("dotenv").config();
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const express = require("express");
const router = express.Router();
const { createUser } = require("../controllers/userController");
const admin = require("firebase-admin");


// POST /users - Create a new user and Stripe cardholder
router.post('/users', createUser);


module.exports = router;
