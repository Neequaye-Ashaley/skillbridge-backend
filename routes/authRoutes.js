const express = require('express');
const router = express.Router();
const passport = require('passport');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

const getClientUrl = () => process.env.CLIENT_URL || 'http://localhost:3000';

// Google OAuth routes
router.get('/google', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.redirect(`${getClientUrl()}/login?error=${encodeURIComponent('Google login is not configured yet.')}`);
    }
    const { role } = req.query;
    // Store the role in session for use in the callback
    if (role) {
        req.session.signupRole = role;
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get(
    '/google/callback',
    (req, res, next) => {
        passport.authenticate('google', { failureRedirect: `${getClientUrl()}/login` })(req, res, next);
    },
    (req, res) => {
        try {
            // Successful authentication, generate JWT token
            const token = req.user.generateAuthToken();
            // Redirect to frontend with token
            res.redirect(`${getClientUrl()}/login?token=${token}`);
        } catch (error) {
            console.error('Error in Google callback:', error);
            res.redirect(`${getClientUrl()}/login?error=${encodeURIComponent(error.message)}`);
        }
    }
);

module.exports = router;
