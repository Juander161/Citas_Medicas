const Sequelize = require('sequelize');

// Configuración de la conexión a XAMPP (MySQL)
const sequelize = new Sequelize('citas_medicas', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  port: 3306,
  define: {
    timestamps: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;