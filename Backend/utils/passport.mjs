import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User.mjs'; 


passport.use(new LocalStrategy(
  async (username, password, done) => {
    // --- DEBUG LOG ---
    console.log('LocalStrategy: Attempting to authenticate user:', username);
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        console.log('LocalStrategy: User not found:', username);
        return done(null, false, { message: 'Incorrect username.' });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log('LocalStrategy: Incorrect password for user:', username);
        return done(null, false, { message: 'Incorrect password.' });
      }
      console.log('LocalStrategy: User authenticated successfully:', username);
      return done(null, user); 
    } catch (err) {
      console.error('LocalStrategy Error:', err);
      return done(err); 
    }
  }
));

// Serialize user (what user data to store in the session)
passport.serializeUser((user, done) => {
  // --- DEBUG LOG ---
  console.log('Passport.serializeUser: Serializing user ID:', user.id);
  done(null, user.id); // Store only the user ID in the session
});

// Deserialize user (how to retrieve user data from the session)
passport.deserializeUser(async (id, done) => {
  // --- DEBUG LOG ---
  console.log('Passport.deserializeUser: Deserializing user ID:', id);
  try {
    const user = await User.findById(id);
    if (user) {
      console.log('Passport.deserializeUser: User found:', user.username);
      done(null, user); // Attach the full user object to req.user
    } else {
      console.log('Passport.deserializeUser: User not found for ID:', id);
      done(null, false);
    }
  } catch (err) {
    console.error('Passport.deserializeUser Error:', err);
    done(err);
  }
});
