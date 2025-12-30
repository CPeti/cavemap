const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireInternalService } = require('../middleware/auth');

const router = express.Router();


// GET /users/debug - Debug endpoint to get all users
router.get('/debug', async (req, res) => {
  res.json({
    users: await User.find({}).lean()
  });
});

// GET /users/me - Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    console.log('req.user:', JSON.stringify(req.user, null, 2));

    let user = await User.findOne({ email: req.user.email });

    // Create user record if it doesn't exist
    if (!user) {
      console.log('Creating new user for email:', req.user.email);

      // Use JWT-decoded information if available, otherwise use defaults
      const userData = {
        email: req.user.email,
        username: req.user.username || req.user.email.split('@')[0], // Use email prefix as username initially
        firstName: req.user.firstName || '',
        lastName: req.user.lastName || '',
        avatar: req.user.avatar || null,
        bio: '',
        role: 'user',
        isActive: true
      };

      console.log('Creating user with JWT-decoded data:', JSON.stringify(userData, null, 2));
      user = new User(userData);
      await user.save();
      user = user.toObject();
    }

    // Return comprehensive profile data for frontend compatibility
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /users/me - Update current user profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const allowedUpdates = ['username', 'firstName', 'lastName', 'avatar', 'bio'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    updates.updatedAt = new Date();

    let user = await User.findOneAndUpdate(
      { email: req.user.email },
      updates,
      { new: true, runValidators: true }
    );

    // Create user record if it doesn't exist
    if (!user) {
      console.log('Creating user during profile update for email:', req.user.email);
      const userData = {
        email: req.user.email,
        username: req.user.username || req.user.email.split('@')[0],
        firstName: req.user.firstName || updates.firstName || '',
        lastName: req.user.lastName || updates.lastName || '',
        avatar: req.user.avatar || updates.avatar || null,
        bio: updates.bio || null,
        role: 'user',
        isActive: true,
        ...updates
      };

      user = new User(userData);
      await user.save();
      user = user.toObject();
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    // Handle MongoDB duplicate key error (E11000)
    if (error.code === 11000 && error.keyPattern?.username) {
      return res.status(409).json({ error: 'That username is already taken. Please choose another.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users/lookup - Get usernames by emails
router.post('/lookup', async (req, res) => {
  console.log('lookup request:', req.body);
  try {
    const { emails } = req.body;
    
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'emails array is required' });
    }

    const users = await User.find({ email: { $in: emails } })
      .select('email username')
      .lean();

    // Create a map of email -> username
    const emailToUsername = {};
    users.forEach(user => {
      emailToUsername[user.email] = user.username;
    });

    res.json(emailToUsername);
  } catch (error) {
    console.error('Error looking up users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/:id - Get user by ID (public profile)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username firstName lastName avatar bio createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users - Get users list (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /users/me - Delete current user profile
router.delete('/me', authenticateToken, async (req, res) => {
  try {
    console.log('Deleting user profile for email:', req.user.email);

    // Find and delete the user
    const deletedUser = await User.findOneAndDelete({ email: req.user.email });

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User profile deleted successfully:', deletedUser.email);
    res.json({ message: 'Profile deleted successfully' });

  } catch (error) {
    console.error('Error deleting user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
