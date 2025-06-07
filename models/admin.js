const Sequelize = require("sequelize")
const db = require("../config/db")
const bcrypt = require("bcryptjs")

const Admin = db.define("admin", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  apellido: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  telefono: {
    type: Sequelize.STRING,
    allowNull: true,
  },
})

// Método para comparar contraseñas
Admin.prototype.verificarPassword = function (password) {
  return bcrypt.compareSync(password, this.password)
}

// Hooks para hashear la contraseña antes de guardar
Admin.beforeCreate(async (admin) => {
  const salt = await bcrypt.genSalt(10)
  admin.password = await bcrypt.hash(admin.password, salt)
})

module.exports = Admin

