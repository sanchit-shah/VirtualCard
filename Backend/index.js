// This file sets up the server

const express = require("express");
const app = express();
const PORT = 8080;
const cors = require('cors');
const cardRoutes = require("./routes/cardRoutes");

app.use(cors());
app.use(express.json());

app.use("/cards", cardRoutes);

// .listen is a method that starts the server
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}.`);
});
