const mongoose = require("mongoose");

//creation du model offer

const Offer = mongoose.model("Offer", {
    product_name: { type: String, min: 1, max: 50 },
    product_description: { type: String, min: 1, max: 500 },
    product_price: { type: Number, min: 1, max: 100000 },
    product_details: Array,
    product_image: { type: mongoose.Schema.Types.Mixed, default: {} },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
});

module.exports = Offer;
