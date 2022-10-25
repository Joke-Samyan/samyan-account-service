import pg from "pg"
import { config } from "dotenv"

const Pool = pg.Pool;
config();

const db = new Pool({
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || "4001", 10),
    database: process.env.DATABASE_DATABASE,
});

export default db;