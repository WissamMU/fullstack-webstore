# 🚀 Full Stack Project Guide: Step-by-Step

This document is a comprehensive guide to building a full stack application with:

- 🧠 **Backend**: Node.js + Express
- 🛢️ **Database**: MongoDB + Mongoose
- 🔐 **Authentication**: JWT + Redis for token management
- 🧱 **Middleware**: Role-based access protection
- 🛍️ **E-Commerce API**: Products, cart, and admin controls

---

## 📦 Project Setup

step by step for full stack project in the Future

## step 1 made front and back end
- folders then npm init -y and

```bash
npm i express dotenv mongoose jsonwebtoken stripe clo inay cookie-parser bcryptjs ioredis
npm i -D nodemon
```

## step 2 made backend/server.js
- and link in main on package.json + in scripts "dev": "nodemon backend/server.js" "start": "node backend/server.js"
## step 3 in server js

```js
import express from "express";

const app = express();

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
```

## step 4 create dontenv file
- conect and use it for the port is better
## step 5 make routes and controllers folder 
- and start with router

```js
server.js;
import authRoutes from "./routes/auth.route.js";
app.use("/api/auth", authRoutes);

auth.router.js;
import express from "express";

const router = express.Router();

router.get("/signup", async (req, res) => {
  res.send("signup route");
});

export default router;

// got to api/auth/signup to see result
// make controller for them

import { login, logout, signup } from "../controllers/auth.controller.js";
router.get("/signup", signup);

auth.controller.js;
export const signup = async (req, res) => {
  res.send("signup route");
};
```

## step 6 start working on databass
- go to mogno db create clusters and save conect uri in .env
   basic connection to mongoose

```js
lib / db.js;
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

server.js;
import { connectDB } from "./lib/db.js";

app.listen(PORT, () => {
  console.log("Server is running on port : " + PORT);
  //here
  connectDB();
});
```

## step 7 create models for data schema and Secure the user password

```js
models / user.models.js;

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
// creat user schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    cartItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
  },
  { timestamps: true }
);

// pre-save hook to hash password before saving to the database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// method to compare password
// this method will be used to compare the password entered by the user with the hashed password in the database
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// use the user schema to create a user model
const User = mongoose.model("User", userSchema);

// export the user model
export default User;
```

## step 8 Request the data to use

```js
-first in server.js;
app.use(express.json()); // this middleware is used to parse the incoming request body as JSON

controllers / auth.controller.js;
import User from "../models/user.models.js";

export const signup = async (req, res) => {
  // get the user data from the request body
  const { name, email, password } = req.body;
  // check if the user already exists
  const userExists = await User.findOne({ email });

  try {
    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }
    // create a new user
    const user = await User.create({
      name,
      email,
      password,
    });

    res.status(201).json({
      message: "User created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
```

## step 9 go to console.upstash.com to create database
   Choose a connection method

```JS
lib/redis.js

import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// save the url in .env for safty
export const redis = new Redis(process.env.UPSTASH_REDIS_REST_URL);

// key-value pair
// to test terminal node ./backend/lib/redis.js
// await redis.set('foe', 'bar');
```

## step 10 authenticate

```js
controllers/auth.controller.js

...
import User from "../models/user.models.js";
// import jwt for security
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";

cons
const generateToken = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_JWT_SECRET, {
        expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_JWT_SECRET, {
        expiresIn: "7d",
    });

    return { accessToken, refreshToken };
}
// save the token in redis
const saveRefreshToken = async (userid, refreshToken) => {
    await redis.set(`refresh_token:${userid}`, refreshToken, "EX", 60 * 60 * 24 * 7);
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("access_token", accessToken, {
        httpOnly: true, // prevents  xss attack cross-site scripting
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",// prevents cross-site request forgery csrf
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
}

export const signup = async (req, res) => {
    // Existing code
// authenticate
        const { accessToken, refreshToken } = generateToken(user._id);
        await saveRefreshToken(user._id, refreshToken);

        // set cookies
        setCookies(res, accessToken, refreshToken);

        res.status(201).json({
            user:{
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            message: "User created successfully",
        });
    }
    catch (error)// the rest
}
... rest of code



```

## step 11 logout
- to logot we need to delete the refresh token from redis and clear the cookies

```js
controllers / auth.controller.js;
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token; // get the refresh token from the cookies we set earlier
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET);
      // delete the refresh token from redis
      await redis.del(`refresh_token:${decoded.userId}`);
    }
    // clear the cookies
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
```

## step 12 login

```js
controllers / auth.controller.js;
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // check if the user exists
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      // generate tokens
      const { accessToken, refreshToken } = generateToken(user._id);
      // save the refresh token in redis
      await saveRefreshToken(user._id, refreshToken);
      // set cookies
      setCookies(res, accessToken, refreshToken);

      res.status(200).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        message: "Login successful",
      });
    } else {
      res.status(401).json({
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
```

## step 13 refresh token

```js
controllers / auth.controller.js;
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token; // get the refresh token from the cookies
    // check if the refresh token is provided
    if (!refreshToken) {
      return res.status(401).json({
        message: "No refresh token provided",
      });
    }

    // verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET);
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    // check if the user exists
    if (storedToken !== refreshToken) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    const access_token = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );
    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.status(200).json({
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
```

## step 14 product api
    first connect routes in server .js

```js
import productRoutes from "./routes/product.route.js";

app.use("/api/products", productRoutes);
```

Second make routes

```js
routes / product.route.js;
import express from "express";

const router = express.Router();

router.get("/", getAllProducts);

export default router;
d;
```

third make product models

```js
models / product.model.js;
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: [true, "Imgae is requried"],
    },
    category: {
      type: String,
      required: true,
    },
    isFeaured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
```

middleware

```js
middleware / auth.middleware.js;
```

# 🔐 Middleware: `protectRoute` and `adminRoute`

This middleware is used to **protect backend routes** using **JWT authentication** and **role-based access control**.

---

## ✅ `protectRoute` Middleware

### 📌 Purpose:

Allows only users with a **valid access token** (stored in cookies) to access protected routes.

---

### 🔍 Step-by-step Breakdown:

```js
const accessToken = req.cookies.accessToken;
```

- Get the `accessToken` from the cookies.
- This is the token sent by the client on each request.

---

```js
if (!accessToken) {
  return res
    .status(401)
    .json({ message: "Unauthorized - No access token provided" });
}
```

- If no token is found, return a `401 Unauthorized` response.

---

```js
const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
```

- Decode the JWT token using the secret stored in the `.env` file.
- If the token is invalid or expired, an error will be thrown.

---

```js
const user = await User.findById(decoded.userId).select("-password");
```

- Fetch the user from the database using the ID stored in the token.
- Exclude the password field for security.

---

```js
if (!user) {
  return res.status(401).json({ message: "User not found" });
}
```

- If the user doesn't exist in the database, deny access.

---

```js
req.user = user;
```

- Attach the user object to the `req` so it can be accessed in the next route or middleware.

---

```js
next();
```

- Proceed to the next middleware or route handler.

---

### 🔄 Handling Token Expiration:

```js
if (error.name === "TokenExpiredError") {
  return res
    .status(401)
    .json({ message: "Unauthorized - Access token expired" });
}
```

- If the JWT token is expired, return an appropriate error message.

---

## ✅ `adminRoute` Middleware

### 📌 Purpose:

Allows access only to users with the `admin` role.

---

### 🔍 Code Explanation:

```js
if (req.user && req.user.role === "admin") {
  next(); // Proceed if the user is an admin
} else {
  return res.status(403).json({ message: "Access denied - Admin only" });
}
```

- Checks if the authenticated user (`req.user`) has the role `"admin"`.
- If not, return a `403 Forbidden` response.

---

## ✅ Usage Example

```js
app.get("/api/admin/dashboard", protectRoute, adminRoute, (req, res) => {
  res.json({ message: "Welcome, admin!" });
});
```

- `protectRoute` ensures the user is authenticated.
- `adminRoute` ensures the user has admin privileges.

---

## 🔢 Step 15: Getting All Featured Products (with Redis Caching)

In this step, we will allow users to fetch **featured products** from the API.  
We’ll use **Redis caching** to improve performance by reducing repetitive database queries.

---

### 🛣️ 1. Define the Route

Open the products route file and add a new `GET` route for featured products:

```js
// 📄 backend/routes/product.route.js
import { getFeaturedProducts } from "../controllers/product.controller.js";

router.get("/", getFeaturedProducts);
🔁 This route will respond with a list of all products where isFeaured: true.

🧠 2. Implement Controller Logic
Now let’s implement the controller logic in a clean and efficient way using Redis:

js
Copy
Edit
// 📄 backend/controllers/product.controller.js
import Product from "../models/product.model.js";
import { redis } from "../lib/redis.js";

export const getFeaturedProducts = async (req, res) => {
  try {
    // 🧊 Step 1: Try to get products from Redis cache
    let featuredProducts = await redis.get("featured_products");

    // ✅ Step 2: If found in cache, return them immediately
    if (featuredProducts) {
      return res.status(200).json(JSON.parse(featuredProducts));
    }

    // 🧩 Step 3: If not found in cache, query the database
    featuredProducts = await Product.find({ isFeaured: true }).lean();

    if (!featuredProducts || featuredProducts.length === 0) {
      return res.status(404).json({ message: "No featured products found" });
    }

    // 🧠 Step 4: Save the results in Redis for next time
    await redis.set("featured_products", JSON.stringify(featuredProducts));

    // 🟢 Return the products
    res.status(200).json(featuredProducts);

  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
```

## 🔢 Step 16: Creating New Products (with Cloudinary Image Upload)

In this step, we implement product creation with image upload using **Cloudinary**.  
Access to this endpoint is restricted to **admin users** only.

---

### 🛣️ 1. Define the Route

Only authenticated admins should be able to create products.

```js
// 📄 backend/routes/product.route.js
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { createProduct } from "../controllers/product.controller.js";

router.post("/", protectRoute, adminRoute, createProduct);
✅ This protects the route so only admins can access it.

☁️ 2. Set Up Cloudinary
We'll use Cloudinary for image storage.

📦 Install dependency:
bash
Copy
Edit
npm install cloudinary
🔐 Add credentials to your .env file:
ini
Copy
Edit
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
📁 Create cloudinary.js config file:
js
Copy
Edit
// 📄 backend/lib/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
🛠️ 3. Controller: Create Product
Now we’ll build the controller to upload an image to Cloudinary and save the product to MongoDB.

js
Copy
Edit
// 📄 backend/controllers/product.controller.js
import Product from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";

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
```
## 🔥 Step 17: Delete Product (from Database and Cloudinary)

In this step, we’ll create a secure route to allow **admin users** to delete products from both the **MongoDB database** and **Cloudinary storage**.

---

### 🛣️ 1. Define the Route

We’ll create a `DELETE` route secured by:
- ✅ `protectRoute` (ensures user is logged in)
- 🔐 `adminRoute` (ensures user is an admin)

```js
// 📄 backend/routes/product.route.js
import { deleteProduct } from "../controllers/product.controller.js";

router.delete("/:id", protectRoute, adminRoute, deleteProduct);
```

---

### 🧠 2. Implement the Controller Logic

We'll:
- Check if the product exists
- Extract the public ID from the image URL
- Remove the image from Cloudinary
- Delete the product from MongoDB

```js
// 📄 backend/controllers/product.controller.js
import Product from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";

export const deleteProduct = async (req, res) => {
  try {
    // 🧾 Step 1: Fetch product by ID
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 🗑️ Step 2: Delete image from Cloudinary
    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0]; // Extract Cloudinary image public ID
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("✅ Image deleted from Cloudinary");
      } catch (error) {
        console.log("⚠️ Error deleting image from Cloudinary:", error);
      }
    }

    // 🗃️ Step 3: Delete product from database
    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "🗑️ Product deleted successfully" });

  } catch (error) {
    console.error("❌ Error in deleteProduct controller:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

---

### 🧠 Summary

- ✅ Verifies the product exists.
- 🧹 Extracts and deletes the Cloudinary image using its public ID.
- 🗃️ Deletes the product document from MongoDB.
- 🛡️ Secured by admin middleware.

---

> 💡 **Tip:** Use Cloudinary's folder structure (`products/`) to organize and manage your image assets cleanly.
## 💡 Step 18: Product Recommendations (Random Selection)

In this step, we implement a route to return a list of **randomly recommended products** from the database.

---

### 🛣️ 1. Define the Route

Create a public route that fetches product recommendations:

```js
// 📄 backend/routes/product.route.js
import { getRecommendedProducts } from "../controllers/product.controller.js";

router.get("/recommendations", getRecommendedProducts);
```

> 📌 This route is **not protected**, so it's accessible to all users or visitors.

---

### 🧠 2. Controller: Get Recommended Products

We’ll use MongoDB's `$sample` aggregation to randomly select 4 products and return only necessary fields.

```js
// 📄 backend/controllers/product.controller.js
import Product from "../models/product.model.js";

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $sample: { size: 4 }, // 🎲 Randomly select 4 products
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

    res.status(200).json(products);

  } catch (error) {
    console.error("❌ Error in getRecommendedProducts controller:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

---

### 🔍 Summary

- 🎲 Uses MongoDB aggregation to return a random sample of products.
- 📦 Project stage selects only essential fields.
- 🟢 Useful for **homepage carousels**, **"You may also like"**, or **product discovery** features.

---

> 💡 **Tip:** You can expand this in the future to filter by category, price range, or user history.
## 🗂️ Step 19: Categories and Featured Product Toggling

This step covers two key features:

1. 🔎 Filtering products by `category`
2. ⭐ Toggling a product's `isFeatured` status (admin only) and updating the Redis cache

---

### 🛣️ 1. Define Routes

Add the following routes in the product router:

```js
// 📄 backend/routes/product.route.js
import {
  getProductsByCategory,
  toggleFeaturedProduct,
} from "../controllers/product.controller.js";

router.get("/category/:category", getProductsByCategory);
router.patch("/:id", protectRoute, adminRoute, toggleFeaturedProduct);
```

---

### 🔍 2. Get Products by Category

Allows filtering products by their `category` parameter in the URL.

```js
// 📄 backend/controllers/product.controller.js
export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const products = await Product.find({ category });
    res.status(200).json({ products });
  } catch (error) {
    console.error("Error in getProductsByCategory controller:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

---

### ⭐ 3. Toggle `isFeatured` for a Product (Admin Only)

This controller toggles the `isFeatured` flag of a product and updates the Redis cache.

```js
// 📄 backend/controllers/product.controller.js
export const toggleFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.isFeatured = !product.isFeatured;
      const updatedProduct = await product.save();

      await updateFeaturedProductsCache(); // 🔄 Refresh Redis cache

      res.status(200).json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error in toggleFeaturedProduct controller:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

---

### 🔄 4. Update Redis Cache After Toggling

Refreshes the cache of featured products using `.lean()` for performance.

```js
async function updateFeaturedProductsCache() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.error("Error in updateFeaturedProductsCache:", error.message);
  }
}
```

---

### ✅ Summary

- 🗂️ `GET /category/:category`: Returns products filtered by category.
- 🔄 `PATCH /:id`: Admin-only toggle for product's `isFeatured` status.
- 🚀 Redis cache is refreshed automatically for performance.

---

> 💡 **Tip:** You can expand categories later into a dedicated model or drop-down for filtering in frontend UI.

## 🛒 Step 20: Cart Routes and Controller Logic

In this step, we create a **shopping cart system** for users.  
Users can add, update, and remove items from their cart. The cart is stored in the user document in MongoDB.

---

### 🛠️ Note: Route Mounting in Server

Make sure to mount the cart routes inside `server.js`:

```js
// 📄 backend/server.js
import cartRoutes from './routes/cart.route.js';
app.use('/api/cart', cartRoutes);
```

---

### 📦 1. Define Cart Routes

```js
// 📄 backend/routes/cart.route.js
import express from "express";
import {
  protectRoute,
} from "../middleware/auth.middleware.js";
import {
  addToCart,
  getCartProducts,
  removeAllFromCart,
  updateQuantity,
} from "../controllers/cart.controller.js";

const router = express.Router();

router.get("/", protectRoute, getCartProducts);           // 🧾 Get cart items
router.post("/", protectRoute, addToCart);                // ➕ Add to cart
router.delete("/", protectRoute, removeAllFromCart);      // 🗑️ Remove all or specific item
router.put("/:id", protectRoute, updateQuantity);         // 🔄 Update quantity

export default router;
```

---

### 🧠 2. Cart Controller Functions

#### 🔍 Get Cart Products

```js
// 📄 backend/controllers/cart.controller.js
import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
  try {
    const products = await Product.find({ _id: { $in: req.user.cartItems } });

    const cartItems = products.map((product) => {
      const item = req.user.cartItems.find((cartItem) => cartItem.id === product.id);
      return { ...product.toJSON(), quantity: item.quantity };
    });

    res.json(cartItems);
  } catch (error) {
    console.error("Error in getCartProducts controller:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

---

#### ➕ Add to Cart

```js
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    const existingItem = user.cartItems.find(item => item.id === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cartItems.push({ id: productId, quantity: 1 });
    }

    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    console.error("Error in addToCart controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
```

---

#### 🗑️ Remove All or One Item from Cart

```js
export const removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    if (!productId) {
      user.cartItems = []; // Remove all
    } else {
      user.cartItems = user.cartItems.filter(item => item.id !== productId);
    }

    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

---

#### 🔄 Update Quantity

```js
export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;

    const existingItem = user.cartItems.find(item => item.id === productId);

    if (existingItem) {
      if (quantity === 0) {
        user.cartItems = user.cartItems.filter(item => item.id !== productId);
      } else {
        existingItem.quantity = quantity;
      }

      await user.save();
      res.json(user.cartItems);
    } else {
      res.status(404).json({ message: "Product not found in cart" });
    }
  } catch (error) {
    console.error("Error in updateQuantity controller:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

---

### ✅ Summary

- 🧾 `GET /api/cart` — Get all items in user cart.
- ➕ `POST /api/cart` — Add a product to the cart.
- 🗑️ `DELETE /api/cart` — Remove one or all products from the cart.
- 🔄 `PUT /api/cart/:id` — Update the quantity of a specific product in the cart.

> 🔐 All routes are protected and require authentication.

---

> 💡 **Tip:** Later, connect this cart system to a checkout or payment process using Stripe or PayPal.

## 🎟️ Step 21: Coupon System (Apply Discounts Per User)

In this step, we implement a **coupon/discount code system**.  
Each user can have a single unique coupon that gives them a discount for a limited time.

---

### ❓ What Is This?

- **Coupons** are tied to a specific `userId`
- Each coupon contains:
  - A unique code (e.g., `SAVE10`)
  - A discount percentage
  - An expiration date
  - A flag (`isActive`) to enable/disable usage
- 🔐 Coupons can only be used by the user they are assigned to

---

### 🛠️ Mount the Route in `server.js`

```js
// 📄 backend/server.js
import couponRoutes from './routes/coupon.route.js';
app.use('/api/coupons', couponRoutes);
```

---

### 📦 Define the Coupon Model

```js
// 📄 backend/models/coupon.model.js
import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    discountPercentage: { type: Number, required: true, min: 0, max: 100 },
    expirationDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    }
  },
  { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
```

---

### 📡 Define Routes for Coupons

```js
// 📄 backend/routes/coupon.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getCoupon, validateCoupon } from "../controllers/coupon.controller.js";

const router = express.Router();

router.get("/", protectRoute, getCoupon);                // 🔍 Get active coupon
router.post("/validate", protectRoute, validateCoupon);  // ✅ Validate a coupon

export default router;
```

---

### 🧠 Controller Logic

#### 🔍 Get User’s Active Coupon

```js
// 📄 backend/controllers/coupon.controller.js
import Coupon from "../models/coupon.model.js";

export const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ userId: req.user._id, isActive: true });
    res.json(coupon || null);
  } catch (error) {
    console.error("Error in getCoupon controller:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

---

#### ✅ Validate a Coupon

```js
export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code, userId: req.user._id, isActive: true });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(404).json({ message: "Coupon expired" });
    }

    res.json({
      message: "Coupon is valid",
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    });

  } catch (error) {
    console.error("Error in validateCoupon controller:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

---

### ✅ Summary

- 🔒 Coupons are user-specific and protected.
- ⏳ Coupons expire using a date field and deactivate automatically.
- 🧾 Valid coupons return discount info for client-side use (e.g., at checkout).

> 💡 **Tip:** You can add coupon creation logic for admin or marketing flows later.

## 💳 Step 22: Payment Integration and Order Handling (Stripe + Mongoose)

In this step, we implement a complete **checkout flow** using **Stripe** to handle payments,  
and store **orders** in MongoDB once payment is successful.

---

### 🧭 Overview

- Stripe checkout is used for secure payments.
- We build two key endpoints:
  1. `POST /create-checkout-session` → to start the payment
  2. `POST /checkout-success` → to finalize the order after Stripe confirms payment
- We apply discount **if a coupon is valid**
- 🎁 If total purchase exceeds a threshold, we generate a **new reward coupon**

---

### 🛠️ 1. Order Model

```js
// 📄 backend/models/order.model.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // reference to User
    required: true,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  stripeSessionId: {
    type: String,
    unique: true,
  },
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
export default Order;
```

---

### 🔗 2. Setup Payment Route

```js
// 📄 backend/server.js
import paymentRoutes from './routes/payment.route.js';
app.use('/api/payments', paymentRoutes);
```

---

### 📡 3. Payment Routes

```js

// 📄 backend/lib/stripe.js
// Stripe configuration for handling payment sessions securely

import Stripe from "stripe";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize Stripe instance with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16", // ✅ Always specify a stable API version
});



// 📄 backend/routes/payment.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createCheckoutSession, checkoutSuccess } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-checkout-session", protectRoute, createCheckoutSession);
router.post("/checkout-success", protectRoute, checkoutSuccess);

export default router;
```

---

### 💼 4. Payment Controller Logic

(See previous full controller listing.)

---

### ✅ Summary

- 💰 Payment is processed via **Stripe Checkout**
- 📦 After success, a new **Order** is created in MongoDB
- 🎁 If coupon used, it is deactivated; if user spends enough, new coupon is issued
- 🔒 Routes are protected and require user authentication

> 💡 **Tip:** You can expand this with email notifications, invoice generation, and admin order management panel later.

## 📊 Step 23: Admin Dashboard Analytics (Sales, Revenue, Users, Products)

In this step, we build an **analytics route** for the admin dashboard to display:

- 📈 Total users
- 📦 Total products
- 💰 Total sales and revenue
- 📅 Daily sales and revenue over the past 7 days

---

### 🧭 What It Does

- Admin sends a GET request to `/api/analytics`
- Server responds with:
  - Aggregate stats: total users, products, orders, revenue
  - Daily revenue & sales chart-ready data for the last 7 days

---

### 🛠️ Add Analytics Route to `server.js`

```js
// 📄 backend/server.js
import analyticsRoutes from './routes/analytics.route.js';
app.use('/api/analytics', analyticsRoutes);
```

---

### 📡 Define Routes

```js
// 📄 backend/routes/analytics.route.js
import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { getAnalyticsData, getDailySalesData } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, async (req, res) => {
  try {
    const analyticsData = await getAnalyticsData();

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const dailySalesData = await getDailySalesData(startDate, endDate);

    res.json({ analyticsData, dailySalesData });
  } catch (error) {
    console.error("Error in analytics route:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
```

---

### 📈 Controller: getAnalyticsData()

```js
// 📄 backend/controllers/analytics.controller.js
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

export const getAnalyticsData = async () => {
  const totalUsers = await User.countDocuments();
  const totalProducts = await Product.countDocuments();

  const salesData = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  const { totalSales, totalRevenue } = salesData[0] || { totalSales: 0, totalRevenue: 0 };

  return {
    users: totalUsers,
    products: totalProducts,
    totalSales,
    totalRevenue,
  };
};
```

---

### 📅 Controller: getDailySalesData()

```js
export const getDailySalesData = async (startDate, endDate) => {
  try {
    const dailySalesData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dateArray = getDatesInRange(startDate, endDate);

    return dateArray.map((date) => {
      const foundData = dailySalesData.find((item) => item._id === date);

      return {
        date,
        sales: foundData?.sales || 0,
        revenue: foundData?.revenue || 0,
      };
    });
  } catch (error) {
    throw error;
  }
};
```

---

### 🧮 Helper: getDatesInRange()

```js
function getDatesInRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}
```

---

### ✅ Summary

- 🔐 Admin-only analytics dashboard
- 📊 Instant insight into users, products, orders, and revenue
- 📅 Daily breakdown chart-ready for visualization

