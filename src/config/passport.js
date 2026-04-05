const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const AppleStrategy = require('passport-apple');
const { pool } = require('./db');
require('dotenv').config();

// Helper to find or create user
const findOrCreateUser = async (profile, provider) => {
    const providerIdColumn = `${provider}_id`;
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    const displayName = profile.displayName || profile.name.fullName || 'Social User';
    const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

    try {
        // 1. Try to find by provider ID
        const [rows] = await pool.query(`SELECT * FROM users WHERE ${providerIdColumn} = ?`, [profile.id]);
        if (rows.length > 0) return rows[0];

        // 2. Try to find by email if available
        if (email) {
            const [emailRows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
            if (emailRows.length > 0) {
                // Link account
                await pool.query(`UPDATE users SET ${providerIdColumn} = ?, avatar = COALESCE(avatar, ?) WHERE id = ?`, 
                    [profile.id, avatar, emailRows[0].id]);
                return { ...emailRows[0], [providerIdColumn]: profile.id };
            }
        }

        // 3. Create new user
        const passwordPlaceholder = Math.random().toString(36).slice(-10); // Random high entropy string
        const [result] = await pool.query(
            `INSERT INTO users (username, email, fullname, avatar, role, ${providerIdColumn}, password) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [email || `${provider}_${profile.id}`, email, displayName, avatar, 'editor', profile.id, passwordPlaceholder]
        );
        
        const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        return newUser[0];
    } catch (err) {
        console.error(`Error in findOrCreateUser (${provider}):`, err);
        throw err;
    }
};

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const user = await findOrCreateUser(profile, 'google');
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));
}

// Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "/api/auth/facebook/callback",
        profileFields: ['id', 'displayName', 'photos', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const user = await findOrCreateUser(profile, 'facebook');
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));
}

// Apple Strategy (Simplified placeholder - Apple requires complex private key setup)
if (process.env.APPLE_CLIENT_ID) {
    // passport.use(new AppleStrategy(...)); 
    // Implementation omitted for brevity due to requirement of .p8 key file and Team ID
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        done(null, rows[0]);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
