// config/passport.mjs
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User.mjs'; // Adjust path if needed

// Local Strategy for username/password authentication
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user); // User authenticated successfully
    } catch (err) {
      return done(err); // Server error
    }
  }
));

// Serialize user (what user data to store in the session)
passport.serializeUser((user, done) => {
  done(null, user.id); // Store only the user ID in the session
});

// Deserialize user (how to retrieve user data from the session)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); // Attach the full user object to req.user
  } catch (err) {
    done(err);
  }
});