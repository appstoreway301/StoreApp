const pool = require('../db/connection');

const UserModel = {
  async create({ email, passwordHash, name, verificationToken }) {
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, name, verification_token) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, passwordHash, name, verificationToken]
    );
    return rows[0].id;
  },

  async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, email, name, role, email_verified, avatar_url, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async findByIdFull(id) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async verifyEmail(token) {
    const { rowCount } = await pool.query(
      "UPDATE users SET email_verified = TRUE, verification_token = NULL, updated_at = NOW() WHERE verification_token = $1",
      [token]
    );
    return rowCount > 0;
  },

  async verifyEmailByEmail(email) {
    const { rowCount } = await pool.query(
      "UPDATE users SET email_verified = TRUE, verification_token = NULL, updated_at = NOW() WHERE email = $1",
      [email]
    );
    return rowCount > 0;
  },

  async updateRefreshToken(userId, token) {
    await pool.query(
      'UPDATE users SET refresh_token = $1, updated_at = NOW() WHERE id = $2',
      [token, userId]
    );
  },

  async findByRefreshToken(token) {
    const { rows } = await pool.query('SELECT * FROM users WHERE refresh_token = $1', [token]);
    return rows[0] || null;
  },

  async updatePassword(userId, passwordHash) {
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, userId]
    );
  },

  async updateEmail(userId, email) {
    await pool.query(
      'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2',
      [email, userId]
    );
  },

  async updateAvatar(userId, avatarUrl) {
    await pool.query(
      'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
      [avatarUrl, userId]
    );
  },
};

module.exports = UserModel;
