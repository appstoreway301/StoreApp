const db = require('../db/connection');

const UserModel = {
  create({ email, passwordHash, name, verificationToken }) {
    const stmt = db.prepare(
      'INSERT INTO users (email, password_hash, name, verification_token) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(email, passwordHash, name, verificationToken);
    return result.lastInsertRowid;
  },

  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  findById(id) {
    return db.prepare('SELECT id, email, name, role, email_verified, created_at FROM users WHERE id = ?').get(id);
  },

  verifyEmail(token) {
    const result = db.prepare(
      'UPDATE users SET email_verified = 1, verification_token = NULL, updated_at = datetime(\'now\') WHERE verification_token = ?'
    ).run(token);
    return result.changes > 0;
  },

  verifyEmailByEmail(email) {
    const result = db.prepare(
      'UPDATE users SET email_verified = 1, verification_token = NULL, updated_at = datetime(\'now\') WHERE email = ?'
    ).run(email);
    return result.changes > 0;
  },

  updateRefreshToken(userId, token) {
    db.prepare(
      'UPDATE users SET refresh_token = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(token, userId);
  },

  findByRefreshToken(token) {
    return db.prepare('SELECT * FROM users WHERE refresh_token = ?').get(token);
  },

  updatePassword(userId, passwordHash) {
    db.prepare(
      'UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(passwordHash, userId);
  },

  updateEmail(userId, email) {
    db.prepare(
      'UPDATE users SET email = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(email, userId);
  },
};

module.exports = UserModel;
