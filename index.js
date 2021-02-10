// Import des packages :
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
require("dotenv").config();

// Initialisation des packages :
const app = express();
app.use(formidable());
app.use(cors());

// identification cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_PUBLIC_KEY,
    api_secret: process.env.CLOUDINARY_PRIVATE_KEY, // process.env.CLOUDINARY_SECRET_KEY
});

//Import des routes
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
app.use(userRoutes);
app.use(offerRoutes);

// Connexion et creation BDD
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
});

app.get("/", (req, res) => {
    res.json("Route /  de la l'api Vinted !");
});

app.all("*", (req, res) => {
    res.status(404).json({
        error: "This root doesnt exist",
    });
});

app.listen(process.env.PORT, () => {
    console.log("Server turning");
});
