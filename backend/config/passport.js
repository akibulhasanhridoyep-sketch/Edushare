const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

// Local Strategy for username/password
passport.use('local', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user) return done(null, false, { message: 'User not found' });
    
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return done(null, false, { message: 'Invalid password' });
    
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Google OAuth Strategy
passport.use('google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      return done(null, user);
    }

    // Check if user exists with this email
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.googleProfile = {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value,
        picture: profile.photos[0]?.value
      };
      if (!user.profilePicture && profile.photos[0]?.value) {
        user.profilePicture = profile.photos[0].value;
      }
      await user.save();
      return done(null, user);
    }

    // Create new user
    const newUser = new User({
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      googleId: profile.id,
      googleProfile: {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value,
        picture: profile.photos[0]?.value
      },
      profilePicture: profile.photos[0]?.value,
      role: 'student'
    });

    await newUser.save();
    return done(null, newUser);
  } catch (err) {
    return done(err);
  }
}));

// JWT Strategy
passport.use('jwt', new JWTStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
  try {
    const user = await User.findById(payload.id);
    if (!user) return done(null, false);
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Serialize user for sessions
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from sessions
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
