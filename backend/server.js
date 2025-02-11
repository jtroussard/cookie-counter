import dotenv from "dotenv";
dotenv.config();

import express, { raw } from "express";
import cors from "cors";
import fetch from "node-fetch";

import * as messages from "./constants.js";

const app = express();
app.use(express.json());
app.use(cors());

const AUTH_PASSWORD = (process.env.AUTH_PASSWORD || "").trim(); // GCP secret adds a newline to the value for some reason
const GOOGLE_SHEETS_API = process.env.GOOGLE_SHEETS_API;
const FAILED_ATTEMPTS_LIMIT = 5;
const LOCK_TIME_MS = 3 * 60 * 1000;
const MAX_TRACKING_DURATION_MS = 60 * 60 * 1000; // 1 hour

const failedAttempts = {};

const cleanIpList = () => {
    console.log("[CLEANUP] Running IP list cleanup...");

    const now = Date.now();
    for (const ip in failedAttempts) {
        if (failedAttempts[ip].lockUntil && now - failedAttempts[ip].lockUntil > MAX_TRACKING_DURATION_MS) {
            delete failedAttempts[ip];
            console.log(`[CLEANUP] Removed old IP tracking for ${ip}`);
        }
    }
};

// Helthcheck route
app.get("/health", (req, res) => {
    res.json({ success: true, message: messages.MSG_SUCCESS_HEALTHCHECK });
});

// Authentication route
app.post("/auth", (req, res) => {
    cleanIpList();
    const ip = req.ip;
    const { password } = req.body;

    console.log(`[AUTH] Request from IP: ${ip}`);

    if (!failedAttempts[ip]) {
        failedAttempts[ip] = { count: 0, lockUntil: null };
        console.log(`[AUTH] Initializing failed attempts tracking for ${ip}`);
    }

    if (failedAttempts[ip].lockUntil && Date.now() < failedAttempts[ip].lockUntil) {
        console.log(`[AUTH] IP ${ip} is locked until ${new Date(failedAttempts[ip].lockUntil).toISOString()}`);
        return res.status(403).json({ success: false, message: messages.MSG_ERROR_TOO_MANY_ATTEMPTS });
    }

    if (password === AUTH_PASSWORD) {
        console.log(`[AUTH] Successful login from ${ip}, resetting failed attempts.`);
        failedAttempts[ip] = { count: 0, lockUntil: null };
        return res.json({ success: true, token: "valid-session-token" });
    }

    failedAttempts[ip].count += 1;
    console.log(`[AUTH] Failed attempt ${failedAttempts[ip].count}/${FAILED_ATTEMPTS_LIMIT} from ${ip}`);

    if (failedAttempts[ip].count >= FAILED_ATTEMPTS_LIMIT) {
        failedAttempts[ip].lockUntil = Date.now() + LOCK_TIME_MS;
        console.log(`[AUTH] IP ${ip} is locked for ${LOCK_TIME_MS / 1000} seconds until ${new Date(failedAttempts[ip].lockUntil).toISOString()}`);
        return res.status(403).json({ success: false, message: "Too many failed attempts. The app is temporarily locked." });
    }

    return res.status(401).json({ success: false, message: messages.MSG_ERROR_PASSWORD });
});


// Fetch inventory data
app.get("/inventory", async (req, res) => {
    console.log("[SERVER] Received inventory request");
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
    console.log("[SERVER] Received submit request");
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
