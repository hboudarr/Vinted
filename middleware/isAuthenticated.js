const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
    try {
        if (req.headers.authorization) {
            const token = req.headers.authorization.replace("Bearer ", "");

            const user = await User.findOne({
                token: token,
            }); // .select("email account token") = tu me renvoi que certaines clés.
            // ou .delete("hash salt") = supprimer les champs qu'on ne veut pas.

            if (user) {
                req.user = user;

                return next();
            } else {
                return res.status(401).json({
                    error: "Unauthorized",
                });
            }
        } else {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
    } catch (error) {
        return res.status(404).json();
    }
};

module.exports = isAuthenticated;
