const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const Paciente = require("../models/Paciente");
const Horario = require("../models/Horario");
const Cita = require("../models/Cita");
const registroController = require("../controllers/registroController");
const loginController = require("../controllers/loginController");
const citaController = require("../controllers/citaController");
const adminController = require("../controllers/adminController");
const doctorController = require("../controllers/doctorController");

const {
  isAuthenticated,
  isAdmin,
  isDoctor,
  isPaciente,
} = require("../middleware/auth");

// Rutas públicas
router.get("/", (req, res) => {
  res.render("index", { pagina: "Inicio", css: "index.css" });
});

router.get("/registro", (req, res) => {
  res.render("registro", { pagina: "Registro de Paciente", css: "registro.css", mensaje: null, datos: {} });
});
router.post("/registro", registroController.registrarPaciente);

router.get("/login", (req, res) => {
  res.render("login", { 
    pagina: "Login", 
    css: "login.css",
    mensaje: null, });
});
router.post("/login", loginController.autenticarPaciente);

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});




// Rutas  para pacientes
router.get("/citas/nueva", isPaciente, async (req, res) => {
  const Doctor = require("../models/Doctor");
  const doctores = await Doctor.findAll();
  
  res.render("citas/nueva", {
    css: "citas.css",
    doctores,        
    mensaje: null    
  });
});
// Obtener todos los horarios registrados de un doctor
router.get("/doctores/:doctorId/horarios", isPaciente, doctorController.getHorariosPorDoctor);

// Obtener horarios disponibles para un día específico (usado en fetch)
router.post("/citas/horarios", isPaciente, doctorController.getHorariosDisponiblesPorFecha);

router.post("/citas/nueva", isPaciente, citaController.crearCita);
router.get("/citas/mis-citas", isPaciente, citaController.mostrarMisCitas);
router.get("/citas/calendario", isPaciente, citaController.mostrarCalendario);
router.post('/concluir', citaController.concluirCita);

// Rutas  para doctores
router.get("/doctor/dashboard", isDoctor, doctorController.mostrarDashboard);
router.get("/doctor/citas", isDoctor, doctorController.mostrarCitas);
router.get("/doctor/horarios/:doctorId", doctorController.getHorariosPorFecha);
router.get("/doctor/citas/estado/:id/:estado", isDoctor, citaController.actualizarEstadoCita);
router.get('/doctor/citas/estado/:id/concluida', doctorController.cambiarEstadoCita);



// Rutas  para administradores
router.get("/admin/doctores", isAdmin, adminController.mostrarDoctores);
router.get("/admin/pacientes", isAdmin, adminController.mostrarPacientes);
router.get("/admin/pacientes/historial/:id", isAdmin, adminController.verHistorialPaciente);

router.get("/admin/dashboard", isAdmin, adminController.mostrarDashboard);
router.get("/admin/nuevo-admin", isAdmin, adminController.mostrarFormularioAdmin);
router.get("/admin/nuevo-doctor", isAdmin, adminController.mostrarFormularioDoctor);
router.post("/admin/nuevo-doctor", isAdmin, adminController.registrarDoctor);
router.post("/admin/pacientes/:id/eliminar", isAdmin, adminController.eliminarPaciente);
router.get("/admin/editar-doctor/:id", isAdmin, async (req, res) => {
  const doctor = await Doctor.findByPk(req.params.id, {
    include: [Horario],
  });
  if (!doctor) return res.redirect("/admin/doctores");
  res.render("admin/editar-doctor", { doctor, css: "admin.css", mensaje: null });
});
// Guardar cambios del doctor
router.post("/admin/doctores/:id/editar", isAdmin, adminController.actualizarDoctor);


router.get("/admin/citas/editar-cita/:id", isAdmin, adminController.mostrarFormularioEditarCita);
router.post("/admin/citas/editar/:id", isAdmin, adminController.actualizarCita);

router.post("/admin/doctores/:id/eliminar", isAdmin, adminController.eliminarDoctor);
router.post("/admin/citas/:id/eliminar", isAdmin, adminController.eliminarCita);
router.get("/admin/citas/nueva", isAdmin, async (req, res) => {
  const doctores = await Doctor.findAll();
  const pacientes = await Paciente.findAll({ where: { rol: "paciente" } });
  res.render("admin/nueva-cita", {
    doctores,
    pacientes,
    css: "admin.css",
    mensaje: null,
  });
});
router.get("/admin/nuevo-doctor", isAdmin, (req, res) => {
  res.render("admin/nuevo-doctor", { pagina: "Registrar Doctor", css: "admin.css", mensaje: null });
});

router.post("/admin/citas/nueva", isAdmin, adminController.crearCita);
router.get("/admin/citas", isAdmin, adminController.mostrarCitas);

module.exports = router;
