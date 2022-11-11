"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./db"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_json_1 = __importDefault(require("./swagger.json"));
dotenv_1.default.config();
const port = parseInt(process.env.HOST_PORT || "4001") || 4000;
const app = (0, express_1.default)();
//  middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({
        status: "success",
        message: "test in docker",
    });
}));
app.get("/account/getUserBalance/:user_id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id } = req.params;
    try {
        const targetUser = yield db_1.default.query(`
            SELECT balance
            FROM user_balance
            WHERE user_id = $1
        `, [user_id]);
        if (targetUser.rows.length === 0) {
            res.status(500).json({
                status: "error",
                message: `user user_id '${user_id}' not found`,
            });
        }
        else {
            res.status(200).json({
                status: "success",
                message: "get user balance",
                data: targetUser.rows[0].balance,
            });
        }
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
}));
app.post("/account/topup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id, amount } = req.body;
    try {
        const targetUser = yield db_1.default.query(`
            SELECT balance
            FROM user_balance
            WHERE user_id = $1
        `, [user_id]);
        const currentDate = new Date();
        yield db_1.default.query(`
          INSERT INTO transaction_log (pay_by, amount, created_at)
          VALUES ($1, $2, $3)
        `, [user_id, amount, currentDate]);
        if (targetUser.rows.length === 0) {
            yield db_1.default.query(`
            INSERT INTO user_balance (user_id, balance)
            VALUES ($1, $2)
          `, [user_id, amount]);
            res.status(200).json({
                status: "success",
                message: "topup complete",
                data: {
                    balance: amount,
                },
            });
        }
        else {
            const newBalance = targetUser.rows[0].balance + amount;
            yield db_1.default.query(`
            UPDATE user_balance
            SET balance = $1
            WHERE user_id = $2
          `, [newBalance, user_id]);
            res.status(200).json({
                status: "success",
                message: "topup complete",
                data: {
                    balance: newBalance,
                },
            });
        }
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
}));
app.post("/account/withdraw", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_id, amount } = req.body;
    try {
        const targetUser = yield db_1.default.query(`
                SELECT balance
                FROM user_balance
                WHERE user_id = $1
            `, [user_id]);
        if (targetUser.rows.length === 0) {
            res.status(500).json({
                status: "error",
                message: `user user_id '${user_id}' not found`,
            });
        }
        const currentDate = new Date();
        yield db_1.default.query(`
                INSERT INTO transaction_log (pay_by, amount, created_at)
                VALUES ($1, $2, $3)
            `, [user_id, amount, currentDate]);
        const newBalance = targetUser.rows[0].balance - amount;
        yield db_1.default.query(`
                UPDATE user_balance
                SET balance = $1
                WHERE user_id = $2
            `, [newBalance, user_id]);
        res.status(200).json({
            status: "success",
            message: "withdraw complete",
            data: {
                balance: newBalance,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
}));
app.get("/account/labelEntry", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pay_by, to_whom, amount } = req.body;
    try {
        const targetUser = yield db_1.default.query(`
                SELECT balance
                FROM user_balance
                WHERE user_id = $1
            `, [to_whom]);
        if (targetUser.rows.length === 0) {
            res.status(500).json({
                status: "error",
                message: `user user_id '${to_whom}' not found`,
            });
        }
        const currentDate = new Date();
        yield db_1.default.query(`
                INSERT INTO transaction_log (pay_by, to_whom, amount, created_at)
                VALUES ($1, $2, $3, $4)
            `, [pay_by, to_whom, amount, currentDate]);
        const newBalance = targetUser.rows[0].balance - amount;
        yield db_1.default.query(`
                UPDATE user_balance
                SET balance = $1
                WHERE user_id = $2
            `, [newBalance, to_whom]);
        res.status(200).json({
            status: "success",
            message: "label dataset complete",
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
}));
if (process.env.NODE_ENV === "development") {
    const swaggerDocs = (0, swagger_jsdoc_1.default)(swagger_json_1.default);
    app.use("/api/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocs));
}
app.listen(port, () => {
    console.log(`TypeScript with Express ${process.env.NODE_ENV} on http://localhost:${port}`);
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
