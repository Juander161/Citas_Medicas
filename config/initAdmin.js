const Admin = require("../models/admin")
const bcrypt = require("bcryptjs")

// Función para inicializar el administrador por defecto
const initAdmin = async () => {
  try {
    // Verificar si ya existe algún administrador
    const adminCount = await Admin.count()

    // Si no hay administradores, crear uno por defecto
    if (adminCount === 0) {
      await Admin.create({
        nombre: "Administrador",
        apellido: "Sistema",
        email: "IDGS8B@utna.com",
        password: "Admin123$",
        telefono: "0000000000",
      })

      console.log("Administrador por defecto creado con éxito")
    } else {
      console.log("Ya existe al menos un administrador en el sistema")
    }
  } catch (error) {
    console.error("Error al crear el administrador por defecto:", error)
  }
}

module.exports = initAdmin

