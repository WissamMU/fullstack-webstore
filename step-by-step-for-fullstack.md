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

1. made front and back end folders then npm init -y and

```bash
npm i express dotenv mongoose jsonwebtoken stripe clo inay cookie-parser bcryptjs ioredis
npm i -D nodemon
```

2. made backend/server.js and link in main on package.json + in scripts "dev": "nodemon backend/server.js" "start": "node backend/server.js"
3. in server js

```js
import express from "express";

const app = express();

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
```

4. create dontenv file conect and use it for the port is better
5. make routes and controllers folder and start with router

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

6. start working on databass go to mogno db create clusters and save conect uri in .env
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

7. create models for data schema and Secure the user password

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

8. Request the data to use

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

9. go to console.upstash.com to create database
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

10. authenticate

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

11. logout to logot we need to delete the refresh token from redis and clear the cookies

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

12. login

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

13. refresh token

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

14. product api
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

15. users getting all featured products
    first get the route in products routes

```js
backend\routes\product.route.js
router.get("/", getFeaturedProducts);
```

then i need to right the code in product controller
using redis to get the products and then return the products

```js
backend\controllers\product.controller.js
- first get data from redis
let featuredProducts = await redis.get("featured_products");
- second check if there is data send it
        if (featuredProducts) {
            return res.json(JSON.parse(featuredProducts));
        }
- third if not get from mongoose
        //  .lean() will return a plain javascript object instead of a mongoose document object
        featuredProducts = await Product.find({ isFeaured: true }).lean();
        if (!featuredProducts) {
            return res.status(404).json({ message: "No featured products found" })
        }
- fourth set the data in redis
        await redis.set("featured_products", JSON.stringify(featuredProducts));
        return res.json(featuredProducts);

```
