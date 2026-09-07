require('dotenv').config(); // loads variables from .env

const app = require('./app');

const PORT = process.env.PORT || 3000; // 3000 if PORT is not set

app.listen(PORT, () => {
  console.log(`HustleHub+ listening on http://localhost:${PORT}`);
});
