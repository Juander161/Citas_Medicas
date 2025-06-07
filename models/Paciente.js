// models/Paciente.js
const { validationResult } = require('express-validator');
const Sequelize = require('sequelize');
const db = require('../config/db');
const bcrypt = require('bcryptjs'); // Necesitarás instalar: npm i bcryptjs

const Paciente = db.define('paciente', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: Sequelize.STRING,
    allowNull: false
  },
  apellido: {
    type: Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  telefono: {
    type: Sequelize.STRING,
    allowNull: false
  },
  fechaNacimiento: {
    type: Sequelize.DATEONLY,
    allowNull: false
  },
  historialMedico: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  rol: {
    type: Sequelize.ENUM('paciente', 'doctor', 'admin'),
    defaultValue: 'paciente'
  }
});

// Método para comparar contraseñas
Paciente.prototype.verificarPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };
  
// Hooks para hashear la contraseña antes de guardar
Paciente.beforeCreate(async (paciente) => {
  const salt = await bcrypt.genSalt(10);
  paciente.password = await bcrypt.hash(paciente.password, salt);
});

module.exports = Paciente;