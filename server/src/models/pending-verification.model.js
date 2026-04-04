const pool = require('../db/connection');

const PendingVerificationModel = {
  async create({ email, token, expiresAt }) {
    // Limpiar verificaciones expiradas de todos los usuarios
    await pool.query('DELETE FROM pending_verifications WHERE expires_at <= NOW()');
    await pool.query('DELETE FROM pending_verifications WHERE email = $1', [email]);
    await pool.query(
      'INSERT INTO pending_verifications (email, token, expires_at) VALUES ($1, $2, $3)',
      [email, token, expiresAt]
    );
  },

  async findByToken(token) {
    const { rows } = await pool.query(
      'SELECT * FROM pending_verifications WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    return rows[0] || null;
  },

  async deleteByToken(token) {
    await pool.query('DELETE FROM pending_verifications WHERE token = $1', [token]);
  },

  async deleteExpired() {
    await pool.query('DELETE FROM pending_verifications WHERE expires_at <= NOW()');
  },
};

module.exports = PendingVerificationModel;
