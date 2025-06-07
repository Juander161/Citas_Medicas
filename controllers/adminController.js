// controllers/adminController.js
const Doctor = require("../models/Doctor");
const Paciente = require("../models/Paciente");
const Admin = require("../models/Admin");
const Cita = require("../models/Cita");
const Horario = require("../models/Horario");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const Sequelize = require("sequelize");

exports.mostrarDashboard = async (req, res) => {
  try {
    const doctores = await Doctor.findAll();
    const pacientes = await Paciente.findAll({ where: { rol: "paciente" } });
    const citas = await Cita.findAll({
      include: [{ model: Doctor }, { model: Paciente }],
    });

    res.render("admin/dashboard", {
      pagina: "Panel de Administrador",
      doctores,
      pacientes,
      citas,
      usuario: req.session.usuario,
      css: "admin.css", 
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

exports.mostrarFormularioAdmin = (req, res) => {
  res.render("admin/nuevo-admin", {
    pagina: "Registrar Administrador",
    mensaje: null,
    usuario: req.session.usuario,
    css: "admin.css", 
  });
};

exports.registrarAdmin = async (req, res) => {
  // Validar formulario
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.render("admin/nuevo-admin", {
      pagina: "Registrar Administrador",
      mensaje: errores.array()[0].msg,
      datos: req.body,
      usuario: req.session.usuario,
      css: "admin.css", 
    });
  }

  try {
    // Crear nuevo administrador
    await Admin.create({
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      email: req.body.email,
      password: req.body.password,
      telefono: req.body.telefono || "",
    });

    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error);
    res.render("admin/nuevo-admin", {
      pagina: "Registrar Administrador",
      mensaje: "Error al registrar administrador",
      datos: req.body,
      usuario: req.session.usuario,
      css: "admin.css", 
    });
  }
};

exports.mostrarFormularioDoctor = (req, res) => {
  res.render("admin/nuevo-doctor", {
    pagina: "Registrar Doctor",
    mensaje: null,
    usuario: req.session.usuario,
    css: "admin.css", 
  });
};

exports.registrarDoctor = async (req, res) => {
  const {
    nombre,
    apellido,
    especialidad,
    email,
    telefono,
    password,
    confirmarPassword,
    dias,
  } = req.body;

  try {
    // Validación de contraseñas
    if (password !== confirmarPassword) {
      return res.render("admin/nuevo-doctor", {
        pagina: "Registrar Doctor",
        mensaje: "Las contraseñas no coinciden",
        css: "admin.css", 
      });
    }

    // Verificar que no exista otro con mismo correo
    const existente = await Doctor.findOne({ where: { email } });
    if (existente) {
      return res.render("admin/nuevo-doctor", {
        pagina: "Registrar Doctor",
        mensaje: "Ya existe un doctor con ese correo",
        css: "admin.css", 
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Crear doctor
    const nuevoDoctor = await Doctor.create({
      nombre,
      apellido,
      especialidad,
      email,
      telefono,
      password,
    });

    // Procesar horarios por día
    if (dias && Array.isArray(dias)) {
      for (const diaObj of dias) {
        if (diaObj.activo) {
          await Horario.create({
            dia: diaObj.dia,
            horaInicio: diaObj.horaInicio,
            horaFin: diaObj.horaFin,
            comidaInicio: diaObj.comidaInicio || null,
            comidaFin: diaObj.comidaFin || null,
            horasDisponibles: diaObj.horasDisponibles || 0,
            disponible: true,
            doctorId: nuevoDoctor.id,
          });
        }
      }
    }

    res.redirect("/admin/doctores");
  } catch (error) {
    console.error("Error al registrar doctor:", error);
    res.render("admin/nuevo-doctor", {
      pagina: "Registrar Doctor",
      mensaje: "Hubo un error al guardar el doctor.",
      css: "admin.css", // Añadido el CSS admin.css
    });
  }
};

exports.mostrarDoctores = async (req, res) => {
  try {
    const doctores = await Doctor.findAll({
      include: [{ model: Horario }],
    });

    res.render("admin/doctores", {
      pagina: "Gestión de Doctores",
      doctores,
      usuario: req.session.usuario,
      css: "admin.css", // Añadido el CSS admin.css
    });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/dashboard");
  }
};

exports.eliminarDoctor = async (req, res) => {
  const { id } = req.params;

  try {
    const doctor = await Doctor.findByPk(id, {
      include: [Horario],
    });

    if (!doctor) {
      return res.redirect("/admin/doctores");
    }

    // Eliminar horarios
    await Horario.destroy({ where: { doctorId: id } });

    // Eliminar paciente con rol doctor si existe
    await Paciente.destroy({ where: { email: doctor.email, rol: "doctor" } });

    // Eliminar doctor
    await doctor.destroy();

    res.redirect("/admin/doctores");
  } catch (error) {
    console.error("Error al eliminar doctor:", error);
    res.redirect("/admin/doctores");
  }
};

// Nuevo método para mostrar formulario de edición de doctor
exports.mostrarFormularioEditarDoctor = async (req, res) => {
  const { id } = req.params;

  try {
    const doctor = await Doctor.findByPk(id, {
      include: [{ model: Horario }],
    });

    if (!doctor) {
      return res.redirect("/admin/doctores");
    }

    res.render("admin/editar-doctor", {
      pagina: "Editar Doctor",
      doctor,
      mensaje: null,
      usuario: req.session.usuario,
      css: "admin.css",
    });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/doctores");
  }
};


exports.editarDoctor = async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    apellido,
    especialidad,
    email,
    telefono,
    password,
    confirmarPassword,
    horarios = [],
  } = req.body;

  try {
    const doctor = await Doctor.findByPk(id, {
      include: [Horario],
    });

    if (!doctor) {
      return res.redirect("/admin/doctores");
    }

    // Validación básica
    if (password && password !== confirmarPassword) {
      return res.render("admin/editar-doctor", {
        doctor,
        mensaje: "Las contraseñas no coinciden",
        css: "admin.css", // Añadido el CSS admin.css
      });
    }

    // Actualizar datos
    doctor.nombre = nombre;
    doctor.apellido = apellido;
    doctor.especialidad = especialidad;
    doctor.email = email;
    doctor.telefono = telefono;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      doctor.password = await bcrypt.hash(password, salt);
    }

    await doctor.save();

    // Actualizar horarios
    if (Array.isArray(horarios)) {
      for (const h of horarios) {
        const horario = await Horario.findByPk(h.id);
        if (horario && horario.doctorId === doctor.id) {
          horario.horaInicio = h.horaInicio;
          horario.horaFin = h.horaFin;
          horario.comidaInicio = h.comidaInicio || null;
          horario.comidaFin = h.comidaFin || null;
          horario.horasDisponibles = parseInt(h.horasDisponibles, 10);
          await horario.save();
        }
      }
    }

    res.redirect("/admin/doctores");
  } catch (error) {
    console.error("Error al editar doctor:", error);
    res.render("admin/editar-doctor", {
      doctor: await Doctor.findByPk(id, { include: [Horario] }),
      mensaje: "Hubo un error al guardar los cambios. Intenta de nuevo.",
      css: "admin.css", // Añadido el CSS admin.css
    });
  }
};

exports.mostrarCitas = async (req, res) => {
  try {
    const citas = await Cita.findAll({
      include: [Doctor, Paciente],
      order: [["fecha", "ASC"], ["hora", "ASC"]],
    });

    res.render("admin/citas", {
      citas,
      mensaje: null,
      css: "admin.css", // Añadido el CSS admin.css
    });
  } catch (error) {
    console.error("Error al cargar citas:", error);
    res.render("admin/citas", {
      citas: [],
      mensaje: "Hubo un error al cargar las citas.",
      css: "admin.css", // Añadido el CSS admin.css
    });
  }
};

exports.reasignarCita = async (req, res) => {
  const { citaId, doctorId } = req.body;

  try {
    const cita = await Cita.findByPk(citaId);
    if (cita) {
      cita.doctorId = doctorId;
      await cita.save();
    }

    res.redirect("/admin/citas");
  } catch (error) {
    console.log(error);
    res.redirect("/admin/citas");
  }
};

// Nuevo método para mostrar formulario de nueva cita (admin)
exports.mostrarFormularioNuevaCita = async (req, res) => {
  try {
    const doctores = await Doctor.findAll();
    const pacientes = await Paciente.findAll({ where: { rol: "paciente" } });

    res.render("admin/nueva-cita", {
      pagina: "Registrar Cita",
      doctores,
      pacientes,
      mensaje: null,
      usuario: req.session.usuario,
      css: "admin.css", // Añadido el CSS admin.css
    });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/citas");
  }
};

// Nuevo método para crear cita (admin)
exports.crearCita = async (req, res) => {
  const { pacienteId, doctorId, fecha, hora, estado } = req.body;

  try {
    if (!pacienteId || !doctorId || !fecha || !hora) {
      return res.render("admin/nueva-cita", {
        doctores: await Doctor.findAll(),
        pacientes: await Paciente.findAll({ where: { rol: "paciente" } }),
        mensaje: "Todos los campos son obligatorios",
        css: "admin.css", // Añadido el CSS admin.css
      });
    }

    await Cita.create({
      pacienteId,
      doctorId,
      fecha,
      hora,
      estado: estado || "pendiente",
    });

    res.redirect("/admin/citas");
  } catch (error) {
    console.error("Error al crear cita:", error);
    res.render("admin/nueva-cita", {
      doctores: await Doctor.findAll(),
      pacientes: await Paciente.findAll({ where: { rol: "paciente" } }),
      mensaje: "Hubo un error al crear la cita.",
      css: "admin.css", // Añadido el CSS admin.css
    });
  }
};

// Nuevo método para mostrar formulario de edición de cita
exports.mostrarFormularioEditarCita = async (req, res) => {
  const { id } = req.params;

  try {
    const cita = await Cita.findByPk(id, {
      include: [{ model: Doctor }, { model: Paciente }],
    });

    if (!cita) {
      return res.redirect("/admin/citas");
    }

    const doctores = await Doctor.findAll();
    const pacientes = await Paciente.findAll({ where: { rol: "paciente" } });

    res.render("admin/editar-cita", {
      pagina: "Editar Cita",
      cita,
      doctores,
      pacientes,
      mensaje: null,
      usuario: req.session.usuario,
      css: "admin.css", // Añadido el CSS admin.css
    });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/citas");
  }
};

// Nuevo método para actualizar cita
exports.actualizarCita = async (req, res) => {
  const { id } = req.params;
  const { doctorId, pacienteId, fecha, hora, motivo, estado } = req.body;

  try {
    const cita = await Cita.findByPk(id);

    if (!cita) {
      return res.redirect("/admin/citas");
    }

    // Si cambia el doctor o la fecha/hora, verificar disponibilidad
    if ((doctorId !== cita.doctorId || fecha !== cita.fecha || hora !== cita.hora) && estado !== "cancelada") {
      const citaExistente = await Cita.findOne({
        where: {
          doctorId,
          fecha,
          hora,
          id: { [Sequelize.Op.ne]: id }, // Excluir la cita actual
          estado: {
            [Sequelize.Op.notIn]: ["cancelada"], // Excluir citas canceladas
          },
        },
      });

      if (citaExistente) {
        const doctores = await Doctor.findAll();
        const pacientes = await Paciente.findAll({ where: { rol: "paciente" } });

        return res.render("admin/editar-cita", {
          pagina: "Editar Cita",
          cita,
          doctores,
          pacientes,
          mensaje: "Ya existe una cita para este doctor en la fecha y hora seleccionadas",
          usuario: req.session.usuario,
          css: "admin.css", // Añadido el CSS admin.css
        });
      }
    }

    // Si la cita estaba activa y ahora se cancela, devolver la hora disponible
    if (cita.estado !== "cancelada" && estado === "cancelada") {
      const horario = await Horario.findOne({
        where: {
          doctorId: cita.doctorId,
          dia: new Date(cita.fecha).toLocaleDateString("es-ES", { weekday: "long" }).toLowerCase(),
        },
      });

      if (horario) {
        horario.horasDisponibles += 1;
        await horario.save();
      }
    }

    // Si la cita estaba cancelada y ahora se activa, restar una hora disponible
    if (cita.estado === "cancelada" && estado !== "cancelada") {
      const horario = await Horario.findOne({
        where: {
          doctorId,
          dia: new Date(fecha).toLocaleDateString("es-ES", { weekday: "long" }).toLowerCase(),
        },
      });

      if (horario && horario.horasDisponibles > 0) {
        horario.horasDisponibles -= 1;
        await horario.save();
      }
    }

    // Actualizar cita
    cita.doctorId = doctorId;
    cita.pacienteId = pacienteId;
    cita.fecha = fecha;
    cita.hora = hora;
    cita.motivo = motivo;
    cita.estado = estado;
    await cita.save();

    res.redirect("/admin/citas");
  } catch (error) {
    console.log(error);
    res.redirect("/admin/citas");
  }
};

// Nuevo método para eliminar cita
exports.eliminarCita = async (req, res) => {
  const { id } = req.params;

  try {
    const cita = await Cita.findByPk(id);

    if (!cita) {
      return res.redirect("/admin/citas");
    }

    await cita.destroy();
    res.redirect("/admin/citas");
  } catch (error) {
    console.error("Error al eliminar cita:", error);
    res.redirect("/admin/citas");
  }
};

exports.eliminarPaciente = async (req, res) => {
  const { id } = req.params;

  try {
    const paciente = await Paciente.findByPk(id);

    if (!paciente) {
      return res.redirect("/admin/pacientes");
    }

    // Evitar eliminar pacientes que sean doctores por rol
    if (paciente.rol === "doctor") {
      return res.redirect("/admin/pacientes");
    }

    await paciente.destroy();
    res.redirect("/admin/pacientes");
  } catch (error) {
    console.error("Error al eliminar paciente:", error);
    res.redirect("/admin/pacientes");
  }
};

exports.mostrarDoctores = async (req, res) => {
  const doctores = await Doctor.findAll({ include: ["horarios"] });
  res.render("admin/doctores", { doctores, css: "admin.css" });
};

exports.mostrarPacientes = async (req, res) => {
  const pacientes = await Paciente.findAll({ where: { rol: "paciente" } });
  res.render("admin/pacientes", { pacientes, css: "admin.css" });
};
exports.mostrarFormularioEditarCita = async (req, res) => {
  const { id } = req.params;

  try {
    const cita = await Cita.findByPk(id);
    const doctores = await Doctor.findAll();
    const pacientes = await Paciente.findAll({ where: { rol: "paciente" } });

    if (!cita) return res.status(404).send("Cita no encontrada");

    res.render('admin/editar-cita', {
      pagina: "Editar Cita",
      cita,
      doctores,
      pacientes,
      mensaje: null, // <= solución
      usuario: req.session.usuario,
      css: "admin.css", 
    });
    
  } catch (error) {
    console.error("Error al cargar cita:", error);
    res.status(500).send("Error al cargar la cita");
  }
};
exports.verHistorialPaciente = async (req, res) => {
  const { id } = req.params;
  try {
    const paciente = await Paciente.findByPk(id);
    if (!paciente) return res.status(404).send("Paciente no encontrado");

    const citas = await Cita.findAll({
      where: { pacienteId: id },
      include: [{ model: Doctor }],
      order: [['fecha', 'DESC'], ['hora', 'DESC']]
    });

    res.render('admin/historial-paciente', {
      paciente,
      citas,
      usuario: req.session.usuario,
      css: "admin.css", 
    });
  } catch (error) {
    console.error("Error al mostrar historial:", error);
    res.status(500).send("Error al mostrar historial del paciente");
  }
};
exports.mostrarFormularioEditarCita = async (req, res) => {
  try {
    const cita = await Cita.findByPk(req.params.id);
    const doctores = await Doctor.findAll();
    const pacientes = await Paciente.findAll({ where: { rol: "paciente" } });

    res.render("admin/editar-cita", {
      cita,
      doctores,
      pacientes,
      css: "admin.css",
      mensaje: null
    });
  } catch (error) {
    console.log("Error al cargar cita:", error);
    res.redirect("/admin/citas");
  }
};
exports.actualizarCita = async (req, res) => {
  const { id } = req.params;
  const { pacienteId, doctorId, fecha, hora, motivo, estado } = req.body;

  try {
    await Cita.update(
      {
        pacienteId,
        doctorId,
        fecha,
        hora,
        motivo,
        estado
      },
      {
        where: { id }
      }
    );

    res.redirect("/admin/citas");
  } catch (error) {
    console.error("Error al actualizar la cita:", error);
    res.render("admin/editar-cita", {
      mensaje: "Error al actualizar la cita.",
      css: "admin.css",
      cita: { id, pacienteId, doctorId, fecha, hora, motivo, estado },
      doctores: await Doctor.findAll(),
      pacientes: await Paciente.findAll({ where: { rol: "paciente" } }),
    });
  }
};
exports.actualizarDoctor = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, email, telefono, especialidad } = req.body;

  try {
    await Doctor.update(
      {
        nombre,
        apellido,
        email,
        telefono,
        especialidad
      },
      {
        where: { id }
      }
    );

    res.redirect("/admin/doctores");
  } catch (error) {
    console.error("Error al actualizar doctor:", error);
    const doctor = await Doctor.findByPk(id);
    res.render("admin/editar-doctor", {
      doctor,
      mensaje: "Error al actualizar el doctor",
      css: "admin.css",
    });
  }
};
exports.verHistorialPaciente = async (req, res) => {
  const { id } = req.params;

  try {
    const paciente = await Paciente.findByPk(id);
    const citas = await Cita.findAll({
      where: { pacienteId: id },
      include: [Doctor],
      order: [['fecha', 'DESC']]
    });

    res.render("admin/historial-paciente", {
      paciente,
      citas,
      css: "admin.css"
    });

  } catch (error) {
    console.error("Error al cargar historial del paciente:", error);
    res.redirect("/admin/pacientes");
  }
};
