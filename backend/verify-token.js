const verifyToken = (req, res, next) => {
    const token = req.cookies.sessionToken;
    if (!token) {
        return res.status(403).json({ success: false, message: messages.MSG_ERROR_UNAUTHORIZED });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (decoded.ip !== req.ip) {
            return res.status(403).json({ success: false, message: messages.MSG_ERROR_BAD_TOKEN });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: messages.MSG_ERROR_SERVER_ERROR });
    }
};

export default verifyToken;