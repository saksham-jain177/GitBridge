require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mcpRoutes = require('./routes/mcp');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// MCP routes
app.use('/mcp', mcpRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});
