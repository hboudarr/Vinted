// import
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middleware/isAuthenticated");

// initialisation
const router = express.Router();

// identification cloudinary
cloudinary.config({
    cloud_name: "dxn10gpjy",
    api_key: "467193542875412",
    api_secret: "-O30VQTbK4MoSPu7Ozl3hG5Zw10",
});

// Import des models
const User = require("../models/User");
const Offer = require("../models/Offer");
const { query } = require("express");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
    try {
        console.log("entree");
        const offer = new Offer({
            product_name: req.fields.title,
            product_description: req.fields.description,
            product_price: req.fields.price,
            product_details: [
                { ETAT: req.fields.condition },
                { MARQUE: req.fields.brand },
                { COULEUR: req.fields.color },
                { VILLE: req.fields.city },
            ],
            owner: req.user,
        });
        // si une photo est chargé charger sur cloudinary
        if (req.files.picture) {
            const pictureToUpload = req.files.picture.path;
            const result = await cloudinary.uploader.upload(pictureToUpload, {
                folder: `Vinted/offers/${pictureToUpload}`,
            });

            offer.product_image = result;
        }
        // offer.product_image = result // je pourrai egalement envoyer result en entier ou result.secure_url
        offer.save();
        const offerToResponse = await offer
            .populate("owner", "account")
            .execPopulate();
        res.status(200).json(offerToResponse);
    } catch (error) {
        res.status(404).json({
            error: error.message,
        });
    }
});

router.get("/offers", async (req, res) => {
    try {
        let filters = {};

        if (req.query.title) {
            filters.product_name = new RegExp(req.query.title, "i");
        }
        if (req.query.priceMin) {
            filters.product_price = {};
            filters.product_price.$gte = Number(req.query.priceMin);
        }
        if (req.query.priceMax) {
            if (filters.product_price === undefined) {
                filters.product_price = {};
            }
            filters.product_price.$lte = Number(req.query.priceMax);
        }
        let sort = {};

        if (req.query.sort === "price-asc") {
            sort.product_price = 1;
        } else if (req.query.sort === "price-desc") {
            sort.product_price = -1;
        }
        let page;

        if (Number(req.query.page) < 1) {
            page = 1;
        } else {
            page = Number(req.query.page);
        }

        let limit = 3;

        const count = await Offer.countDocuments(filters);
        const offerFilter = await Offer.find(filters)
            .select("product_name product_price")
            .sort(sort)
            .limit(limit)
            .skip((page - 1) * limit);
        res.status(200).json({
            count: count,
            offers: offerFilter,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get("/offer/:id", async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id).populate(
            "owner",
            "account"
        );
        res.status(200).json(offer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put("/offer/update/:id", isAuthenticated, async (req, res) => {
    const offerToModify = await Offer.findById(req.params.id);
    try {
        if (req.fields.title) {
            offerToModify.product_name = req.fields.title;
        }
        if (req.fields.description) {
            offerToModify.product_description = req.fields.description;
        }
        if (req.fields.price) {
            offerToModify.product_price = req.fields.price;
        }

        const details = offerToModify.product_details;
        for (i = 0; i < details.length; i++) {
            if (details[i].MARQUE) {
                if (req.fields.brand) {
                    details[i].MARQUE = req.fields.brand;
                }
            }
            if (details[i].TAILLE) {
                if (req.fields.size) {
                    details[i].TAILLE = req.fields.size;
                }
            }
            if (details[i].ÉTAT) {
                if (req.fields.condition) {
                    details[i].ÉTAT = req.fields.condition;
                }
            }
            if (details[i].COULEUR) {
                if (req.fields.color) {
                    details[i].COULEUR = req.fields.color;
                }
            }
            if (details[i].EMPLACEMENT) {
                if (req.fields.location) {
                    details[i].EMPLACEMENT = req.fields.location;
                }
            }
        }

        // Notifie Mongoose que l'on a modifié le tableau product_details
        offerToModify.markModified("product_details");

        if (req.files.picture) {
            const result = await cloudinary.uploader.upload(
                req.files.picture.path,
                {
                    public_id: `api/vinted/offers/${offerToModify._id}/preview`,
                }
            );
            offerToModify.product_image = result;
        }

        await offerToModify.save();

        res.status(200).json("Offer modified succesfully !");
    } catch (error) {
        console.log(error.message);
        res.status(400).json({ error: error.message });
    }
});

router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
    try {
        //Je supprime ce qui il y a dans le dossier
        await cloudinary.api.delete_resources_by_prefix(
            `vinted/offers/${req.params.id}`
        );
        //Une fois le dossier vide, je peux le supprimer !
        await cloudinary.api.delete_folder(`vinted/offers/${req.params.id}`);

        offerToDelete = await Offer.findById(req.params.id);

        await offerToDelete.delete();

        res.status(200).json("Offer deleted succesfully !");
    } catch (error) {
        console.log(error.message);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
