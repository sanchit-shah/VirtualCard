// This file sets up the server

const admin = require("firebase-admin");
const express = require("express");
const app = express();
const PORT = 8080;
const cors = require('cors');
const cardRoutes = require("./routes/cardRoutes");
const userRoutes = require('./routes/userRoutes');
const serviceAccount = require("./config/serviceAccountKey.json");
const db = admin.firestore();

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

app.use(cors());
app.use(express.json());

app.use('/', userRoutes);
app.use('/', cardRoutes);

// Default route for API info
app.get("/about", (req, res) => {
  res.send("This is an API service for GhostCard.");
});


// .listen is a method that starts the server
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}.`);
});
