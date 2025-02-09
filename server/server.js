import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

import * as messages from "./constants.js";

const app = express();
app.use(express.json());
app.use(cors());

const AUTH_PASSWORD = (process.env.AUTH_PASSWORD || "").trim(); // GCP secret adds a newline to the value for some reason
const GOOGLE_SHEETS_API = process.env.GOOGLE_SHEETS_API;

// Authentication route
app.post("/auth", (req, res) => {
    const { password } = req.body;
    if (password === AUTH_PASSWORD) {
        return res.json({ success: true, token: "valid-session-token" });
    }
    return res.status(401).json({ success: false, message: messages.MSG_ERROR_PASSWORD });
});

// Fetch inventory data
app.get("/inventory", async (req, res) => {
    if (req.headers.authorization !== "valid-session-token") {
        console.log("Failed authorization");
        return res.status(403).json({ success: false, message: messages.MSG_ERROR_UNAUTHORIZED });
    }

    try {
        const response = await fetch(`${GOOGLE_SHEETS_API}?action=getInventory`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, message: messages.MSG_ERROR_UNABLE_TO_FETCH_INVENTORY });
    }
});

// Submit staged items
app.post("/submit", async (req, res) => {
    console.log("Received submit request");
    // Authorized?
    if (req.headers.authorization !== "valid-session-token") {
        console.log("Failed authorization");
        return res.status(403).json({ success: false, message: messages.MSG_ERROR_UNAUTHORIZED });
    }

    // Validation, anything to submit?
    const stagedItems = req.body;
    if (!Array.isArray(stagedItems) || stagedItems.length === 0) {
        console.log("[SERVER] No items to submit");
        return res.status(400).json({ success: false, message: messages.MSG_ERROR_GENERIC });
    }

    // Lets try to submit and update the inventory
    try {
        console.log(`Trying to submit staged items: ${JSON.stringify(stagedItems)}`);
        const response = await fetch(`${GOOGLE_SHEETS_API}?action=updateInventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stagedItems),
        });

        const data = await response.json();
        console.log(`Data looks like ${JSON.stringify(data)}`);

        console.log(`Checking response status ${data.success}`)
        if (data.success) {
            return res.json({ success: true, message: messages.MSG_SUCCESS_SUBMITTED });
        } else {
            return res.status(500).json({ success: false, message: messages.MSG_ERROR_GENERIC });
        }
    } catch (err) {
        console.log(`Failed to submit items: ${err}`);
        res.status(500).json({ success: false, message: messages.MSG_ERROR_GENERIC });
    }
});

// Start server
const PORT = process.env.PORT || 5174;

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
