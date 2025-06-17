import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
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

// 📄 backend/controllers/product.controller.js
export const createProduct = async (req, res) => {
  try {
    const { name, price, description, image, category } = req.body;

    let cloudinaryResponse = null;

    // 🌤 Upload the image to Cloudinary if present
    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }

    // 🧱 Create new product
    const product = new Product({
      name,
      price,
      description,
      image: cloudinaryResponse?.secure_url || "",
      category,
    });

    await product.save(); 

    res.status(201).json(product);
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);

		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		if (product.image) {
			const publicId = product.image.split("/").pop().split(".")[0];
			try {
				await cloudinary.uploader.destroy(`products/${publicId}`);
				console.log("deleted image from cloduinary");
			} catch (error) {
				console.log("error deleting image from cloduinary", error);
			}
		}

		await Product.findByIdAndDelete(req.params.id);

		res.json({ message: "Product deleted successfully" });
	} catch (error) {
		console.log("Error in deleteProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getRecommendedProducts = async (req, res) => {
	try {
		const products = await Product.aggregate([
			{
				$sample: { size: 4 },
			},
			{
				$project: {
					_id: 1,
					name: 1,
					description: 1,
					image: 1,
					price: 1,
				},
			},
		]);

		res.json(products);
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};