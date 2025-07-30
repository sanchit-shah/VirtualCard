// This file defines the endpoints our backend will respond to.

const router = require("express").Router();


// about our API
router.get("/about", (req, res) => {
	res.send("This is an API service for GhostCard.");
});

// Export the router to be used in other files
module.exports = router;
