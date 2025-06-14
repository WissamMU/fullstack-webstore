import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({}); // find all products
        res.json({ products });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getFeaturedProducts = async (req, res) => {

    try {
        // get the data from redis
        let featuredProducts = await redis.get("featured_products");
        // check if there is data in redis
        if (featuredProducts) {
            return res.json(JSON.parse(featuredProducts));
        }
        // if there isnt get from mongoose
        //  .lean() will return a plain javascript object instead of a mongoose document object
        featuredProducts = await Product.find({ isFeaured: true }).lean();
        if (!featuredProducts) {
            return res.status(404).json({ message: "No featured products found" })
        }

        // save the data in redis for quick access
        await redis.set("featured_products", JSON.stringify(featuredProducts));

        res.json(featuredProducts);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
