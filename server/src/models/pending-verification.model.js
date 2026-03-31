const db = require('../db/connection');

const PendingVerificationModel = {
  create({ email, token, expiresAt }) {
    // Remove any existing pending verification for this email
    db.prepare('DELETE FROM pending_verifications WHERE email = ?').run(email);

    const stmt = db.prepare(
      'INSERT INTO pending_verifications (email, token, expires_at) VALUES (?, ?, ?)'
    );
    return stmt.run(email, token, expiresAt);
  },

  findByToken(token) {
    return db.prepare(
      'SELECT * FROM pending_verifications WHERE token = ? AND expires_at > datetime(\'now\')'
    ).get(token);
  },

  deleteByToken(token) {
    db.prepare('DELETE FROM pending_verifications WHERE token = ?').run(token);
  },

  deleteExpired() {
    db.prepare('DELETE FROM pending_verifications WHERE expires_at <= datetime(\'now\')').run();
  },
};

module.exports = PendingVerificationModel;
