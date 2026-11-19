const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const ArtisanProfile = require('../models/ArtisanProfile');
const Notification = require('../models/Notification');

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
            rating_avg: 0,
            total_jobs_completed: 0,
            categories: [],
          });

          await Notification.create({
            user_id: user._id,
            title: 'Complete Your Profile',
            message: 'Please finish setting up your profile to start receiving job requests and attract more customers.',
            link: '/artisan-profile',
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

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
