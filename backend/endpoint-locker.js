// backend/utils/EndpointLocker.js
export default class EndpointLocker {
    constructor(failedAttemptsLimit = 5, lockTimeMs = 3 * 60 * 1000, maxTrackingDurationMs = 60 * 60 * 1000) {
        this.failedAttemptsLimit = failedAttemptsLimit;
        this.lockTimeMs = lockTimeMs;
        this.maxTrackingDurationMs = maxTrackingDurationMs;
        this.failedAttempts = {};
    }

    isIpLocked(ip) {
        return (
            this.failedAttempts[ip] &&
            this.failedAttempts[ip].lockUntil &&
            Date.now() < this.failedAttempts[ip].lockUntil
        );
    }

    resetFailedAttempts(ip) {
        delete this.failedAttempts[ip];
    }

    incrementFailedAttempts(ip) {
        if (!this.failedAttempts[ip]) {
            this.failedAttempts[ip] = { count: 0, lockUntil: null };
            console.log(`[AUTH] Initializing failed attempts tracking for ${ip}`);
        }

        this.failedAttempts[ip].count += 1;
        console.log(`[AUTH] Failed attempt ${this.failedAttempts[ip].count}/${this.failedAttemptsLimit} from ${ip}`);

        if (this.failedAttempts[ip].count >= this.failedAttemptsLimit) {
            this.failedAttempts[ip].lockUntil = Date.now() + this.lockTimeMs;
            console.log(`[AUTH] IP ${ip} is locked for ${this.lockTimeMs / 1000} seconds until ${new Date(this.failedAttempts[ip].lockUntil).toISOString()}`);
        }
    }

    cleanIpList() {
        console.log("[CLEANUP] Running IP list cleanup...");

        const now = Date.now();
        for (const ip in this.failedAttempts) {
            if (this.failedAttempts[ip].lockUntil && now - this.failedAttempts[ip].lockUntil > this.maxTrackingDurationMs) {
                delete this.failedAttempts[ip];
                console.log(`[CLEANUP] Removed old IP tracking for ${ip}`);
            }
        }
    }
}
