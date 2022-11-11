import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./db";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import swaggerJson from "./swagger.json";
import { QueryResult } from "pg";
import {
  ILabelEntry,
  IPayDataset,
  ITopupRequest,
  IUserBalance,
} from "./interfaces/IUserBalance";

dotenv.config();

const port: number = parseInt(process.env.HOST_PORT || "4001") || 4000;
const app: Application = express();

//  middleware
app.use(express.json());
app.use(cors());

app.get("/", async (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "test in docker",
  });
});

app.get(
  "/account/getUserBalance/:user_id",
  async (req: Request<{ user_id: number }, {}, {}, {}>, res: Response) => {
    const { user_id } = req.params;

    try {
      const targetUser: QueryResult<IUserBalance> = await db.query(
        `
            SELECT balance
            FROM user_balance
            WHERE user_id = $1
        `,
        [user_id]
      );

      if (targetUser.rows.length === 0) {
        res.status(500).json({
          status: "error",
          message: `user user_id '${user_id}' not found`,
        });
      } else {
        res.status(200).json({
          status: "success",
          message: "get user balance",
          data: targetUser.rows[0].balance,
        });
      }
    } catch (error: any) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }
);

app.post(
  "/account/topup",
  async (req: Request<{}, {}, ITopupRequest, {}>, res: Response) => {
    const { user_id, amount } = req.body;

    try {
      const targetUser: QueryResult<IUserBalance> = await db.query(
        `
            SELECT balance
            FROM user_balance
            WHERE user_id = $1
        `,
        [user_id]
      );

      const currentDate: Date = new Date();

      await db.query(
        `
          INSERT INTO transaction_log (pay_by, amount, created_at)
          VALUES ($1, $2, $3)
        `,
        [user_id, amount, currentDate]
      );

      if (targetUser.rows.length === 0) {
        await db.query(
          `
            INSERT INTO user_balance (user_id, balance)
            VALUES ($1, $2)
          `,
          [user_id, amount]
        );
        res.status(200).json({
          status: "success",
          message: "topup complete",
          data: {
            balance: amount,
          },
        });
      } else {
        const newBalance = targetUser.rows[0].balance + amount;

        await db.query(
          `
            UPDATE user_balance
            SET balance = $1
            WHERE user_id = $2
          `,
          [newBalance, user_id]
        );
        res.status(200).json({
          status: "success",
          message: "topup complete",
          data: {
            balance: newBalance,
          },
        });
      }
    } catch (error: any) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }
);

app.post(
  "/account/withdraw",
  async (req: Request<{}, {}, IPayDataset, {}>, res: Response) => {
    const { user_id, amount } = req.body;

    try {
      const targetUser: QueryResult<IUserBalance> = await db.query(
        `
                SELECT balance
                FROM user_balance
                WHERE user_id = $1
            `,
        [user_id]
      );

      if (targetUser.rows.length === 0) {
        res.status(500).json({
          status: "error",
          message: `user user_id '${user_id}' not found`,
        });
      }

      const currentDate: Date = new Date();

      await db.query(
        `
                INSERT INTO transaction_log (pay_by, amount, created_at)
                VALUES ($1, $2, $3)
            `,
        [user_id, amount, currentDate]
      );

      const newBalance = targetUser.rows[0].balance - amount;

      await db.query(
        `
                UPDATE user_balance
                SET balance = $1
                WHERE user_id = $2
            `,
        [newBalance, user_id]
      );

      res.status(200).json({
        status: "success",
        message: "withdraw complete",
        data: {
          balance: newBalance,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }
);

app.get(
  "/account/labelEntry",
  async (req: Request<{}, {}, ILabelEntry, {}>, res: Response) => {
    const { pay_by, to_whom, amount } = req.body;

    try {
      const targetUser: QueryResult<IUserBalance> = await db.query(
        `
                SELECT balance
                FROM user_balance
                WHERE user_id = $1
            `,
        [to_whom]
      );

      if (targetUser.rows.length === 0) {
        res.status(500).json({
          status: "error",
          message: `user user_id '${to_whom}' not found`,
        });
      }

      const currentDate: Date = new Date();

      await db.query(
        `
                INSERT INTO transaction_log (pay_by, to_whom, amount, created_at)
                VALUES ($1, $2, $3, $4)
            `,
        [pay_by, to_whom, amount, currentDate]
      );

      const newBalance = targetUser.rows[0].balance - amount;

      await db.query(
        `
                UPDATE user_balance
                SET balance = $1
                WHERE user_id = $2
            `,
        [newBalance, to_whom]
      );

      res.status(200).json({
        status: "success",
        message: "label dataset complete",
      });
    } catch (error: any) {
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }
);

if (process.env.NODE_ENV === "development") {
  const swaggerDocs = swaggerJsDoc(swaggerJson);
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

app.listen(port, () => {
  console.log(
    `TypeScript with Express ${process.env.NODE_ENV} on http://localhost:${port}`
  );
});

/**
 * @swagger
 * tags:
 *  name: account
 *  description: For managing account and transaction
 * /account/getUserBalance/{user_id}:
 *  get:
 *    security:
 *      bearerAuth: []
 *    tags: [account]
 *    parameters:
 *      - in: path
 *        name: user_id
 *        schema:
 *          type: string
 *        required: true
 *    responses:
 *      '200':
 *        description: OK
 * /account/topup:
 *  post:
 *    security:
 *      bearerAuth: []
 *    tags: [account]
 *    requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                user_id:
 *                  type: string
 *                amount:
 *                  type: number
 *    responses:
 *      '200':
 *        description: OK
 * /account/withdraw:
 *  post:
 *    security:
 *      bearerAuth: []
 *    tags: [account]
 *    requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                user_id:
 *                  type: string
 *                amount:
 *                  type: number
 *    responses:
 *      '200':
 *        description: OK
 */
