import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./db";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import swaggerJson from "./swagger.json"
import { QueryResult } from "pg";
import { ILabelEntry, IPayDataset, ITopupRequest, IUserBalance } from "./interfaces/IUserBalance";


dotenv.config();

const port: number = parseInt(process.env.HOST_PORT || "4001") || 4000;
const app: Application = express();

//  middleware
app.use(express.json());
app.use(cors());

app.get("/", async (req: Request, res: Response) => {
    res.status(200).json({
        status: "success",
        message: "test in docker"
    })
})

app.post("/payment/topupBalance", async (req: Request<{}, {}, ITopupRequest, {}>, res: Response) => {
    const { uuid, amount } = req.body;

    try {
        const targetUser: QueryResult<IUserBalance> = await db.query(`
            SELECT balance
            FROM user_balance
            WHERE uuid = $1
        `, [uuid])

        if (targetUser.rows.length === 0) {
            res.status(500).json({
                status: "error",
                message: `user uuid '${uuid}' not found`
            })
        }

        const currentDate: Date = new Date();

        await db.query(`
            INSERT INTO transaction_log (pay_by, amount, created_at)
            VALUES ($1, $2, $3)
        `, [uuid, amount, currentDate])

        const newBalance = targetUser.rows[0].balance + amount

        await db.query(`
            UPDATE user_balance
            SET balance = $1
            WHERE uuid = $2
        `, [newBalance, uuid])

        res.status(200).json({
            status: "success",
            message: "topup complete"
        })

    } catch (error: any) {
        res.status(500).json({
            status: "error",
            message: error.message
        })
    }
})

app.post("/payment/uploadDataset", async (req: Request<{}, {}, IPayDataset, {}>, res: Response) => {
    const { uuid, amount } = req.body;

    try {
        const targetUser: QueryResult<IUserBalance> = await db.query(`
                SELECT balance
                FROM user_balance
                WHERE uuid = $1
            `, [uuid])

        if (targetUser.rows.length === 0) {
            res.status(500).json({
                status: "error",
                message: `user uuid '${uuid}' not found`
            })
        }

        const currentDate: Date = new Date();

        await db.query(`
                INSERT INTO transaction_log (pay_by, amount, created_at)
                VALUES ($1, $2, $3)
            `, [uuid, amount, currentDate])

        const newBalance = targetUser.rows[0].balance - amount

        await db.query(`
                UPDATE user_balance
                SET balance = $1
                WHERE uuid = $2
            `, [newBalance, uuid])

        res.status(200).json({
            status: "success",
            message: "payment for uploading dataset complete"
        })

    } catch (error: any) {
        res.status(500).json({
            status: "error",
            message: error.message
        })
    }
})

app.get("/payment/labelEntry", async (req: Request<{}, {}, ILabelEntry, {}>, res: Response) => {
    const { pay_by, to_whom, amount } = req.body;

    try {
        const targetUser: QueryResult<IUserBalance> = await db.query(`
                SELECT balance
                FROM user_balance
                WHERE uuid = $1
            `, [to_whom])

        if (targetUser.rows.length === 0) {
            res.status(500).json({
                status: "error",
                message: `user uuid '${to_whom}' not found`
            })
        }

        const currentDate: Date = new Date();

        await db.query(`
                INSERT INTO transaction_log (pay_by, to_whom, amount, created_at)
                VALUES ($1, $2, $3, $4)
            `, [pay_by, to_whom, amount, currentDate])

        const newBalance = targetUser.rows[0].balance - amount

        await db.query(`
                UPDATE user_balance
                SET balance = $1
                WHERE uuid = $2
            `, [newBalance, to_whom])

        res.status(200).json({
            status: "success",
            message: "label dataset complete"
        })

    } catch (error: any) {
        res.status(500).json({
            status: "error",
            message: error.message
        })
    }

})


if (process.env.NODE_ENV === "development") {
    const swaggerDocs = swaggerJsDoc(swaggerJson);
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

app.listen(port, () => {
    console.log(`TypeScript with Express ${process.env.NODE_ENV} on http://localhost:${port}`);
});

/**
 * @swagger
 * tags:
 *  name: Payment
 *  description: For managing payment and transaction
 * /payment/topupBalance:
 *  post:
 *    security:
 *      bearerAuth: []
 *    tags: [Payment]
 *    requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                uuid:
 *                  type: string
 *                amount:
 *                  type: number
 *    responses:
 *      '200':
 *        description: OK
 * /payment/uploadDataset:
 *  post:
 *    security:
 *      bearerAuth: []
 *    tags: [Payment]
 *    requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                uuid:
 *                  type: string
 *                amount:
 *                  type: number
 *    responses:
 *      '200':
 *        description: OK
 */
