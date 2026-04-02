const crypto = require('crypto');
const bcrypt = require('bcrypt');
const UserModel = require('../models/user.model');
const PendingVerificationModel = require('../models/pending-verification.model');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendVerificationEmail } = require('../utils/email');

const SALT_ROUNDS = 12;

async function sendVerification(req, res, next) {
  try {
    const { email } = req.body;

    const existing = UserModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    PendingVerificationModel.create({ email, token, expiresAt });

    await sendVerificationEmail(email, token);

    res.json({ message: 'Verification email sent. Check your inbox.' });
  } catch (err) {
    next(err);
  }
}

function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const pending = PendingVerificationModel.findByToken(token);
    if (!pending) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    res.json({ message: 'Email verified successfully.', email: pending.email, token });
  } catch (err) {
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const { token, password, name } = req.body;

    const pending = PendingVerificationModel.findByToken(token);
    if (!pending) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    const existing = UserModel.findByEmail(pending.email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    UserModel.create({ email: pending.email, passwordHash, name, verificationToken: null });
    UserModel.verifyEmailByEmail(pending.email);

    PendingVerificationModel.deleteByToken(token);

    res.status(201).json({ message: 'Account created successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.email_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    UserModel.updateRefreshToken(user.id, refreshToken);

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar_url: user.avatar_url || null },
    });
  } catch (err) {
    next(err);
  }
}

function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = UserModel.findByRefreshToken(refreshToken);
    if (!user) {
      return res.status(401).json({ error: 'Refresh token has been revoked' });
    }

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);
    UserModel.updateRefreshToken(user.id, newRefreshToken);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
}

function logout(req, res, next) {
  try {
    UserModel.updateRefreshToken(req.userId, null);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

function getMe(req, res, next) {
  try {
    const user = UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = UserModel.findByEmail(
      UserModel.findById(req.userId).email
    );
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    UserModel.updatePassword(req.userId, passwordHash);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

async function changeEmail(req, res, next) {
  try {
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res.status(400).json({ error: 'New email and password are required' });
    }

    const existing = UserModel.findByEmail(newEmail);
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const user = UserModel.findByEmail(
      UserModel.findById(req.userId).email
    );
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Password is incorrect' });
    }

    UserModel.updateEmail(req.userId, newEmail);

    res.json({ message: 'Email changed successfully', email: newEmail });
  } catch (err) {
    next(err);
  }
}

function updateAvatar(req, res, next) {
  try {
    const { avatar_url } = req.body;
    UserModel.updateAvatar(req.userId, avatar_url || null);
    const user = UserModel.findById(req.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { sendVerification, verifyEmail, register, login, refresh, logout, getMe, changePassword, changeEmail, updateAvatar };
