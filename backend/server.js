import dotenv from "dotenv";
dotenv.config();

import csurf from "csurf";
import express, { raw } from "express";
import cors from "cors";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import * as messages from "./constants.js";
import EndpointLocker from "./endpoint-locker.js";
import verifyToken from "./verify-token.js";

const app = express();
app.use(express.json());
app.use(cors({ credentials: true, origin: (process.env.FRONTEND_URL || "http://localhost:5173") }));
app.use(cookieParser());
app.use(csurf({ cookie: true }));

const AUTH_PASSWORD = (process.env.AUTH_PASSWORD || "").trim(); // GCP secret adds a newline to the value for some reason
const GOOGLE_SHEETS_API = process.env.GOOGLE_SHEETS_API;
const FAILED_ATTEMPTS_LIMIT = 5;
const LOCK_TIME_MS = 3 * 60 * 1000;
const MAX_TRACKING_DURATION_MS = 60 * 60 * 1000;

// TODO create a service that handles these two weirdos
const JWT_EXPIRATION = "1h";
const JWT_EXPIRATION_MS = 60 * 60 * 1000;

const endpointLocker = new EndpointLocker(FAILED_ATTEMPTS_LIMIT, LOCK_TIME_MS, MAX_TRACKING_DURATION_MS);

// PUBLIC
// Health check route
app.get("/health", (req, res) => {
    res.json({ success: true, message: messages.MSG_SUCCESS_HEALTHCHECK });
});

app.get("/csrf-token", (req, res) => {
    const csrfToken = req.csrfToken();
    res.cookie("XSRF-TOKEN", csrfToken, {
        sameSite: "Strict",
        secure: false // I want to be able to verify during development
    });
    res.json({ csrfToken });
});

// PUBLIC 
// Authentication route
app.post("/auth", (req, res) => {
    const csrfToken = req.cookies["XSRF-TOKEN"];
    if (!csrfToken || csrfToken !== req.headers["x-csrf-token"]) {
        return res.status(403).json({ success: false, message: "Invalid CSRF token" });
    }

    const ip = req.ip;
    const { password } = req.body;

    console.log(`[AUTH] Request from IP: ${ip}`);

    if (endpointLocker.isIpLocked(ip)) {
        return res.status(403).json({ success: false, message: messages.MSG_ERROR_TOO_MANY_ATTEMPTS });
    }

    if (password === AUTH_PASSWORD) {
        console.log(`[AUTH] Successful login from ${ip}, resetting failed attempts.`);
        endpointLocker.resetFailedAttempts(ip);
        const sessionId = crypto.randomUUID();
        const timestamp = Date.now();

        // Before we can do anything with tokens we need to make sure we have a secret
        if (!process.env.ACCESS_TOKEN_SECRET) {
            console.error("[AUTH] ERROR: Missing ACCESS_TOKEN_SECRET!");
            return res.status(500).json({ success: false, message: messages.MSG_ERROR_SERVER_MISCONFIGURATION });
        }

        const token = jwt.sign(
            { ip, sessionId, timestamp },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );
        return res
            .cookie("sessionToken", token,
                {
                    httpOnly: true,
                    sameSite: "Strict",
                    secure: false, // I want to be able to verify during development,
                    maxAge: JWT_EXPIRATION_MS
                })
            .json({ success: true, message: messages.MSG_SUCCESS_AUTH });
    }

    endpointLocker.incrementFailedAttempts(ip);
    return res.status(401).json({ success: false, message: messages.MSG_ERROR_PASSWORD });
});

// PRIVATE
// Fetch inventory data
app.get("/inventory", verifyToken, async (req, res) => {
    console.log("[SERVER] Received inventory request");
    if (!req.cookies.sessionToken) {
        return res.status(403).json({ success: false, message: messages.MSG_ERROR_UNAUTHORIZED })
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
app.post("/submit", verifyToken, async (req, res) => {
    const csrfToken = req.cookies["XSRF-TOKEN"];
    if (!csrfToken || csrfToken !== req.headers["x-csrf-token"]) {
        return res.status(403).json({ success: false, message: "Invalid CSRF token" });
    }

    console.log("[SERVER] Received submit request");
    if (!req.cookies.sessionToken) {
        return res.status(403).json({ success: false, message: messages.MSG_ERROR_UNAUTHORIZED })
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

app.post("/logout", (req, res) => {
    res.clearCookie("sessionToken", {
        httpOnly: true,
        sameSite: "Strict",
        secure: false // I want to be able to verify during development
    });
    res.json({ success: true, message: messages.MSG_SUCCESS_LOGOUT });
});

// Start server
const PORT = process.env.PORT || 5174;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
