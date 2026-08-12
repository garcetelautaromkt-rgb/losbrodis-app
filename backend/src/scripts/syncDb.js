require('dotenv').config();
const { sequelize } = require('../models');

// Crea/actualiza todas las tablas en la base de datos según los modelos.
// Uso: npm run db:migrate
async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ Base de datos sincronizada correctamente.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al sincronizar la base de datos:', err);
    process.exit(1);
  }
}

run();
