const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const ArtisanProfile = require('../models/ArtisanProfile');
const Notification = require('../models/Notification');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with the same email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.profile_picture = profile.photos[0]?.value || user.profile_picture;
            await user.save();
            return done(null, user);
          }

          // Get role from session or default to customer
          const role = req.session?.signupRole || 'customer';

          // Create new user
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            profile_picture: profile.photos[0]?.value || null,
            role: role,
            is_active: true,
            is_verified: true, // Google users are considered verified
          });

          // If artisan, create profile and notification
          if (role === 'artisan') {
            await ArtisanProfile.create({
              user_id: user._id,
              business_name: user.name,
              category: 'General',
              is_available: true,
            });

            // Welcome notification for artisan
            await Notification.create({
              recipient: user._id,
              type: 'system',
              title: 'Welcome to Skillbridge!',
              message: 'Your artisan profile has been created. Please complete your profile to start receiving job requests.',
            });
          } else {
            // Welcome notification for customer
            await Notification.create({
              recipient: user._id,
              type: 'system',
              title: 'Welcome to Skillbridge!',
              message: 'Your customer account is ready. Browse services to find skilled artisans near you.',
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth is disabled: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not configured.');
}

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
