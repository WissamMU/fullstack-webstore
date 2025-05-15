# step by step for full stack project in the Future
1. made front and back end folders then npm init -y and 
``` bash
npm i express dotenv mongoose jsonwebtoken stripe clo inay cookie-parser bcryptjs ioredis
npm i -D nodemon
```
2. made backend/server.js and link in main on package.json + in scripts "dev": "nodemon backend/server.js" "start": "node backend/server.js"
3. in server js 
```js
import express from 'express';

const app = express();

app.listen(3000, () => {
  console.log('Server is running on port 3000');
}); 
```
4. create dontenv file conect and use it for the port is better
5. make routes and controllers folder and start with router
```js
server.js
import authRoutes from './routes/auth.route.js';
app.use('/api/auth', authRoutes)

auth.router.js
import express from 'express';

const router = express.Router();

router.get("/signup" , async (req,res)=>{
    res.send("signup route");
})

export default router;

// got to api/auth/signup to see result 
// make controller for them 

import { login, logout, signup } from '../controllers/auth.controller.js';
router.get("/signup" , signup)

auth.controller.js
export const signup = async (req, res) => {
    res.send("signup route");
}
```
6. start working on databass go to mogno db create clusters and save conect uri in .env
basic connection to mongoose 
```js
 lib/db.js
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
}

server.js
import { connectDB } from './lib/db.js';

app.listen(PORT, () => {
  console.log('Server is running on port : ' + PORT);
  //here
  connectDB();
});
```
7. create models for data schema and Secure the user password
```js
models/user/models.js

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

// export the user model
export default User;

```
8. 