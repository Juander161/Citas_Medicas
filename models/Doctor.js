const Sequelize = require("sequelize");
const db = require("../config/db");
const bcrypt = require("bcryptjs");

const Doctor = db.define("doctor", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: Sequelize.STRING,
  apellido: Sequelize.STRING,
  especialidad: Sequelize.STRING,
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  telefono: Sequelize.STRING,
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

// Asociaciones
const Horario = require("./Horario");
Doctor.hasMany(Horario, { foreignKey: "doctorId" });

// Verificar password
Doctor.prototype.verificarPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

// Hashear password antes de crear
Doctor.beforeCreate(async (doctor) => {
  const salt = await bcrypt.genSalt(10);
  doctor.password = await bcrypt.hash(doctor.password, salt);
});

module.exports = Doctor;
