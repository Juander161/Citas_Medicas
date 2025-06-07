const Paciente = require("../models/Paciente")
const Admin = require("../models/Admin")
const Doctor = require("../models/Doctor"); // ✅ Aquí

exports.mostrarFormularioLogin = (req, res) => {
  res.render("login", {
    pagina: "Iniciar Sesión",
    mensaje: null,
  })
}

exports.autenticarPaciente = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar como administrador
    const admin = await Admin.findOne({ where: { email } });
    if (admin && admin.verificarPassword(password)) {
      req.session.usuario = {
        id: admin.id,
        nombre: admin.nombre,
        rol: "admin",
      };
      return res.redirect("/admin/dashboard");
    }

    // 2. Buscar como doctor
    const doctor = await Doctor.findOne({ where: { email } });
    if (doctor && doctor.verificarPassword(password)) {
      req.session.usuario = {
        id: doctor.id,
        nombre: doctor.nombre,
        rol: "doctor",
        email: doctor.email,
      };
      return res.redirect("/doctor/dashboard");
    }

    // 3. Buscar como paciente
    const paciente = await Paciente.findOne({ where: { email } });
    if (paciente && await paciente.verificarPassword(password)) {
      req.session.usuario = {
        id: paciente.id,
        nombre: paciente.nombre,
        rol: paciente.rol,
      };
      return res.redirect("/citas/mis-citas");
    }

    // Si no se encontró ningún usuario válido
    return res.render("login", {
      pagina: "Iniciar Sesión",
      mensaje: "Usuario o contraseña incorrectos",
      email,
    });

  } catch (error) {
    console.log("Error en autenticación:", error);
    res.render("login", {
      pagina: "Iniciar Sesión",
      mensaje: "Error interno al iniciar sesión",
      email,
    });
  }
};