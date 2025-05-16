import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// save the url in .env for safty
export const redis = new Redis(process.env.UPSTASH_REDIS_REST_URL);

// key-value pair 
// to test terminal node ./backend/lib/redis.js
// await redis.set('foe', 'bar');