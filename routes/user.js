const express = require("express");
const { modelNames } = require("mongoose");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;

// Import des models
const User = require("../models/User");
const Offer = require("../models/Offer");

router.post("/user/signup", async (req, res) => {
    try {
        console.log(req.fields.email);
        const user = await User.findOne({
            email: req.fields.email,
        });
        if (user) {
            res.status(409).json({
                message: "This email already has an account",
            });
        }
        if (
            !user &&
            req.fields.username &&
            req.fields.password &&
            req.fields.email
        ) {
            //generer un salt
            const salt = uid2(64);
            //generer un hash
            const hash = SHA256(req.fields.password + salt).toString(encBase64);
            //generer un token
            const token = uid2(64);

            const newUser = new User({
                email: req.fields.email,
                account: {
                    username: req.fields.username,
                    phone: req.fields.phone,
                    //  avatar: { picture: result.secure_url },
                },
                token: token,
                hash: hash,
                salt: salt,
            });
            // A TESTER SI FONCTIONNELLE
            if (req.files.pictures) {
                // uploader la photo de profile de l'admin user
                const resultImage = await cloudinary.uploader.upload(
                    req.files.picture.path,
                    {
                        folder: `/vinted/users/${newUser._id}`,
                    }
                );
            }

            await newUser.save();

            res.status(200).json({
                _id: newUser._id,
                email: newUser.email,
                token: newUser.token,
                account: newUser.account,
            });
        } else {
            res.status(404).json({
                error: "Missing parameter",
            });
        }
    } catch (error) {
        res.status(404).json({
            error: error.message,
        });
    }
});

router.post("/user/login", async (req, res) => {
    try {
        const user = await User.findOne({
            email: req.fields.email,
        });

        if (user) {
            // recuperer le password entré par l'utilisateur
            const password = req.fields.password;
            // creation d'un new hash
            const newHash = SHA256(password + user.salt).toString(encBase64);

            if (newHash === user.hash) {
                res.status(200).json({
                    _id: user._id,
                    token: user.token,
                    account: user.account,
                });
            } else {
                res.status(401).json({
                    error: "Unauthorized",
                });
            }
        } else {
            res.status(400).json({
                error: "User not found",
            });
        }
    } catch (error) {
        res.status(404).json({
            error: error.message,
        });
    }
});

module.exports = router;
