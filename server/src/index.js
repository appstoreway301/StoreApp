const app = require('./app');
const config = require('./config/env');
const migrate = require('./db/migrate');

// Run migrations on startup
migrate();

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
