require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'https://kindler.vercel.app' }));
app.use(express.json());

// Connect to MongoDB
mongoose
mongoose.connect(process.env.MONGO_URI);

// Project Schema
const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  skills_required: [String],
  creator_id: String,
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

// Routes
app.get('/api/projects', async (req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 });
  res.json(projects);
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

app.get('/', (req, res) => res.json({ message: 'Kindler API is live!' }));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log('Server running on port', port));
