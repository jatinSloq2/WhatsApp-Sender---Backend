const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const routes = require('./routes/index.routes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Serve static files from /public
app.use(express.static('public'));

// Routes
app.use('/', routes);

// Default route example
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'WhatsApp Web.js Server running' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
