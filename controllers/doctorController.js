// controllers/doctorController.js
const Cita = require('../models/Cita');
const Paciente = require('../models/Paciente');

const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer'); 
const Horario = require("../models/Horario");

exports.mostrarDashboard = async (req, res) => {
  try {
    const doctorId = req.session.usuario.id;
    
    const citas = await Cita.findAll({
      where: { doctorId },
      include: [{ model: Paciente, as: 'paciente' }],

      order: [['fecha', 'ASC'], ['hora', 'ASC']]
    });
    
    res.render('doctor/dashboard', {
      pagina: 'Panel de Doctor',
      citas,
      usuario: req.session.usuario,
      css: 'doctor.css'
    });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
};

exports.mostrarCitas = async (req, res) => {
  try {
    const doctorId = req.session.usuario.id;
    
    const citas = await Cita.findAll({
      where: { doctorId },
      include: [{ model: Paciente, as: 'paciente' }],
      order: [['fecha', 'ASC'], ['hora', 'ASC']]
    });
    
    res.render('doctor/citas', {
      pagina: 'Mis Citas',
      citas,
      usuario: req.session.usuario,
      css: 'doctor.css'
    });
  } catch (error) {
    console.log(error);
    res.redirect('/doctor/dashboard');
  }
};
exports.cambiarEstadoCita = async (req, res) => {
  const { id, estado } = req.params;
  try {
    const cita = await Cita.findByPk(id);
    if (!cita) {
      return res.status(404).send("Cita no encontrada");
    }
    cita.estado = estado;
    await cita.save();
    res.redirect('/doctor/citas');
  } catch (error) {
    console.error("Error al cambiar el estado de la cita:", error);
    res.status(500).send("Error interno");
  }
};

/*
exports.cambiarEstadoCita = async (req, res) => {
  const { id, estado } = req.params;
  const doctorId = req.session.usuario.id;

  try {
    const cita = await Cita.findOne({
      where: { id, doctorId }
    });

    if (!cita) {
      return res.redirect('/doctor/citas');
    }

    // Actualizar estado de la cita
    cita.estado = estado;
    await cita.save();

    res.redirect('/doctor/citas');
  } catch (error) {
    console.log(error);
    res.redirect('/doctor/citas');
  }
};
*/



  
 
// Esta función es para ver los días/horarios disponibles del doctor
exports.getHorariosPorDoctor = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    const horarios = await Horario.findAll({
      where: { doctorId }
    });

    res.json(horarios);
  } catch (error) {
    console.error("Error al obtener horarios del doctor:", error);
    res.status(500).json({ error: "Error al obtener los horarios" });
  }
};

// Esta es para el calendario dinámico por fecha
exports.getHorariosDisponiblesPorFecha = async (req, res) => {
  const { doctorId } = req.params;
  const { fecha } = req.body;

  try {
    if (!fecha) {
      return res.status(400).json({ error: "Fecha requerida" });
    }

    const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const dia = diasSemana[new Date(fecha).getDay()];

    const horario = await Horario.findOne({
      where: { doctorId, dia, disponible: true }
    });

    if (!horario) return res.json([]);

    const horas = [];
    let horaActual = horario.horaInicio.slice(0, 5);
    const horaFin = horario.horaFin.slice(0, 5);
    const comidaInicio = horario.comidaInicio?.slice(0, 5);
    const comidaFin = horario.comidaFin?.slice(0, 5);

    function incrementarHora(hora) {
      const [h, m] = hora.split(":").map(Number);
      const nueva = new Date(0, 0, 0, h + 1, m);
      return nueva.toTimeString().slice(0, 5);
    }

    while (horaActual < horaFin) {
      if (!comidaInicio || horaActual < comidaInicio || horaActual >= comidaFin) {
        horas.push({ horaInicio: horaActual });
      }
      horaActual = incrementarHora(horaActual);
    }

    return res.json(horas);
  } catch (error) {
    console.error("Error al obtener horarios por fecha:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};



exports.getHorariosPorFecha = async (req, res) => {
  const { doctorId } = req.params;
  const { fecha } = req.query;

  try {
    if (!fecha) {
      return res.status(400).json({ error: "Fecha requerida" });
    }

    // Convertir fecha a día de la semana
    const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const dia = diasSemana[new Date(fecha).getDay()];

    // Buscar horario específico del doctor para ese día
    const horario = await Horario.findOne({
      where: { doctorId, dia, disponible: true }
    });

    if (!horario) {
      return res.json([]);
    }

    // Generar intervalos por hora entre horaInicio y horaFin (excluyendo comida)
    const horas = [];
    let horaActual = horario.horaInicio.slice(0, 5);
    const horaFin = horario.horaFin.slice(0, 5);
    const comidaInicio = horario.comidaInicio?.slice(0, 5);
    const comidaFin = horario.comidaFin?.slice(0, 5);

    function incrementarHora(hora) {
      const [h, m] = hora.split(":").map(Number);
      const nueva = new Date(0, 0, 0, h + 1, m); // sumar 1 hora
      return nueva.toTimeString().slice(0, 5);
    }

    while (horaActual < horaFin) {
      if (
        (!comidaInicio || horaActual < comidaInicio || horaActual >= comidaFin)
      ) {
        horas.push(horaActual);
      }
      horaActual = incrementarHora(horaActual);
    }

    return res.json(horas);
  } catch (error) {
    console.error("Error al obtener horarios por fecha:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
exports.obtenerHorariosDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const horarios = await Horario.findAll({ where: { doctorId } });
    res.json(horarios);
  } catch (error) {
    console.error("Error al obtener horarios del doctor:", error);
    res.status(500).json({ error: 'Error al obtener horarios del doctor' });
  }
};