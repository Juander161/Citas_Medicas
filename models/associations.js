// models/associations.js
const Doctor = require('./Doctor');
const Horario = require('./Horario');

Horario.belongsTo(Doctor); // Relación aquí, sin errores de circularidad

module.exports = () => {
  // Aquí podrías poner más relaciones si las tienes
};
