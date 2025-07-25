import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User.mjs'; 


passport.use(new LocalStrategy(
  async (username, password, done) => {
    console.log('Backend: LocalStrategy: Attempting to authenticate user:', username);
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        console.log('Backend: LocalStrategy: User not found:', username);
        return done(null, false, { message: 'Incorrect username.' });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log('Backend: LocalStrategy: Incorrect password for user:', username);
        return done(null, false, { message: 'Incorrect password.' });
      }
      console.log('Backend: LocalStrategy: User authenticated successfully:', username);
      return done(null, user); 
    } catch (err) {
      console.error('Backend: LocalStrategy Error:', err);
      return done(err); 
    }
  }
));

// Serialize user (what user data to store in the session)
passport.serializeUser((user, done) => {
  console.log('Backend: Passport.serializeUser: Serializing user ID:', user.id); // NEW LOG
  if (!user || !user.id) { // Added a check for user.id
    console.error('Backend: Passport.serializeUser: User or user.id is undefined/null!', user);
    return done(new Error('Failed to serialize user into session: User ID is missing.'));
  }
  done(null, user.id); // Store only the user ID in the session
});

// Deserialize user (how to retrieve user data from the session)
passport.deserializeUser(async (id, done) => {
  console.log('Backend: Passport.deserializeUser: Deserializing user ID:', id);
  try {
    const user = await User.findById(id);
    if (user) {
      console.log('Backend: Passport.deserializeUser: User found:', user.username);
      done(null, user); // Attach the full user object to req.user
    } else {
      console.log('Backend: Passport.deserializeUser: User not found for ID:', id);
      done(null, false); 
    }
  } catch (err) {
    console.error('Backend: Passport.deserializeUser Error:', err);
    done(err);
  }
});
