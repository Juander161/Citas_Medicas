const Sequelize = require('sequelize');
const db = require('../config/db');
const Paciente = require('./Paciente');
const Doctor = require('./Doctor');

const Cita = db.define('cita', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: Sequelize.DATEONLY,
    allowNull: false
  },
  hora: {
    type: Sequelize.TIME,
    allowNull: false
  },
  motivo: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  estado: {
    type: Sequelize.ENUM('pendiente', 'confirmada', 'cancelada', 'completada'),
    defaultValue: 'pendiente'
  }
});

// Relaciones

Cita.belongsTo(Doctor);
Cita.belongsTo(Paciente);
module.exports = Cita;