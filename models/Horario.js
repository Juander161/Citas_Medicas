const Sequelize = require("sequelize")
const db = require("../config/db")
const Doctor = require("./Doctor")

const Horario = db.define("horario", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  dia: {
    type: Sequelize.ENUM("lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"),
    allowNull: false,
  },
  horaInicio: {
    type: Sequelize.TIME,
    allowNull: false,
  },
  horaFin: {
    type: Sequelize.TIME,
    allowNull: false,
  },
  comidaInicio: {
    type: Sequelize.TIME,
    allowNull: true,
  },
  comidaFin: {
    type: Sequelize.TIME,
    allowNull: true,
  },
  disponible: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  horasDisponibles: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 8, // Valor predeterminado de horas disponibles
  },
})



module.exports = Horario

