import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Client } from "pg";
import { getEnvVarOrFail } from "./support/envVarUtils";
import { setupDBClientConfig } from "./support/setupDBClientConfig";

dotenv.config(); //Read .env file lines as though they were env vars.

const dbClientConfig = setupDBClientConfig();
const client = new Client(dbClientConfig);

//Configure express routes
const app = express();

app.use(express.json()); //add JSON body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

app.get("/", async (req, res) => {
    res.json({ msg: "Hello! There's nothing interesting for GET /" });
});

app.get("/health-check", async (req, res) => {
    try {
        //For this to be successful, must connect to db
        await client.query("select now()");
        res.status(200).send("system ok");
    } catch (error) {
        //Recover from error rather than letting system halt
        console.error(error);
        res.status(500).send("An error occurred. Check server logs.");
    }
});

connectToDBAndStartListening();

async function connectToDBAndStartListening() {
    console.log("Attempting to connect to db");
    await client.connect();
    console.log("Connected to db!");

    const port = getEnvVarOrFail("PORT");
    app.listen(port, () => {
        console.log(
            `Server started listening for HTTP requests on port ${port}.  Let's go!`
        );
    });
}

app.post("/expenses", async (req, res) => {
    try {
        const { payee, cat_id, memo, type, amount } = req.body;
        const text =
            "INSERT INTO expense (payee, cat_id, memo, type, amount) values ($1, $2, $3, $4, $5)";
        const values = [payee, cat_id, memo, type, amount];
        const newExpense = await client.query(text, values);
        res.status(200).json(newExpense);
    } catch (error) {
        console.error(error);
    }
});

app.post("/budget", async (req, res) => {
    try {
        const { cat_id, month, budgeted, spent } = req.body;
        const text =
            "INSERT INTO budget (cat_id, month, budgeted, spent) values ($1, $2, $3, $4)";
        const values = [cat_id, month, budgeted, spent];
        const newBudget = await client.query(text, values);
        res.status(200).json(newBudget);
    } catch (error) {
        console.error(error);
    }
});

app.get("/budget/:month", async (req, res) => {
    try {
        const month = req.params.month;
        console.log(month);
        const text = "SELECT * FROM budget WHERE month = $1";
        const values = [month];
        const monthsBudget = await client.query(text, values);
        res.status(200).json(monthsBudget.rows);
        console.log(monthsBudget.rows);
    } catch (error) {
        console.error(error);
    }
});

app.get("/expenses", async (req, res) => {
    try {
        const text = "SELECT * FROM expense";
        const expenses = await client.query(text);
        res.status(200).json(expenses.rows);
        console.log(expenses.rows);
    } catch (error) {
        console.error(error);
    }
});

app.get("/expenses/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const text = "SELECT * FROM expense WHERE id = $1";
        const values = [id];
        const expenses = await client.query(text, values);
        res.status(200).json(expenses.rows);
        console.log(expenses.rows);
    } catch (error) {
        console.error(error);
    }
});

app.get("/categories", async (req, res) => {
    try {
        const text = "SELECT cat_id, name, section FROM category";
        const categories = await client.query(text);
        res.status(200).json(categories.rows);
        console.log(categories.rows);
    } catch (error) {
        console.error(error);
    }
});
