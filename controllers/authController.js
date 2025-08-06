import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ✅ Register User
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  console.log("Register request received:", req.body); // ✅ Check body is correct

  if (!username || !email || !password) {
    return res.status(400).json({ msg: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    console.log("Saving user to DB...");

    await newUser.save();

    console.log("✅ User saved!");

    res.status(201).json({ msg: 'User registered successfully' });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ msg: 'Server error' });
  }
};


// ✅ Login User
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(200).json({
      msg: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ msg: 'Server error during login' });
  }
};
