require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors({ origin: 'https://kindler.vercel.app' }));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('MongoDB connection error:', err));

// ────────────────────────── PROJECTS ──────────────────────────
const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  skills_required: [String],
  creator_id: String,
}, { timestamps: true });
const Project = mongoose.model('Project', projectSchema);

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────── AUTH ──────────────────────────
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  university: String,          // ← ADDED
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// REGISTER – now accepts university
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, university } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Missing required fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed, name, university });
    await user.save();

    res.json({
      success: true,
      message: 'Account created successfully!',
      user: { id: user._id, email, name, university }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN – returns university too
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      success: true,
      message: 'Welcome back!',
      user: { id: user._id, email, name: user.name, university: user.university }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Kindler API is LIVE!' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
