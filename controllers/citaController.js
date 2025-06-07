const Cita = require("../models/Cita")
const Doctor = require("../models/Doctor")
const Paciente = require("../models/Paciente")
const Horario = require("../models/Horario")
const Sequelize = require("sequelize")



exports.mostrarFormularioCita = async (req, res) => {
  try {
    const doctores = await Doctor.findAll({
      include: [
        {
          model: Horario,
          where: {
            horasDisponibles: { [Sequelize.Op.gt]: 0 },
            disponible: true,
          },
        },
      ],
    })

    res.render("citas/nueva", {
      pagina: "Nueva Cita",
      doctores,
      mensaje: null,
      usuario: req.session.usuario,
      css: "citas.css"
    })
  } catch (error) {
    console.log(error)
    res.redirect("/")
  }
}

exports.mostrarHorarios = async (req, res) => {
  const { doctorId, fecha } = req.body

  try {
    // Obtener el día de la semana de la fecha seleccionada
    const diaSemana = new Date(fecha).toLocaleDateString("es-ES", { weekday: "long" }).toLowerCase()

    // Buscar el horario del doctor para ese día
    const horario = await Horario.findOne({
      where: {
        doctorId,
        dia: diaSemana,
        disponible: true,
        horasDisponibles: { [Sequelize.Op.gt]: 0 },
      },
    })

    if (!horario) {
      return res.json([])
    }

    // Verificar citas existentes para ese doctor y fecha
    const citasExistentes = await Cita.findAll({
      where: {
        doctorId,
        fecha,
        estado: {
          [Sequelize.Op.notIn]: ["cancelada"], // Excluir citas canceladas
        },
      },
    })

    // Filtrar horarios disponibles
    const horasOcupadas = citasExistentes.map((cita) => cita.hora)
    const horariosDisponibles = []

    // Convertir horas a minutos para facilitar cálculos
    const inicioMinutos = convertirHoraAMinutos(horario.horaInicio)
    const finMinutos = convertirHoraAMinutos(horario.horaFin)
    const comidaInicioMinutos = horario.comidaInicio ? convertirHoraAMinutos(horario.comidaInicio) : null
    const comidaFinMinutos = horario.comidaFin ? convertirHoraAMinutos(horario.comidaFin) : null

    // Generar horarios cada 30 minutos
    for (let minutos = inicioMinutos; minutos < finMinutos; minutos += 30) {
      // Saltar horarios durante la hora de comida
      if (comidaInicioMinutos && comidaFinMinutos && minutos >= comidaInicioMinutos && minutos < comidaFinMinutos) {
        continue
      }

      const horaFormateada = convertirMinutosAHora(minutos)

      // Verificar si la hora ya está ocupada
      if (!horasOcupadas.includes(horaFormateada + ":00")) {
        horariosDisponibles.push({
          horaInicio: horaFormateada + ":00",
        })
      }
    }

    res.json(horariosDisponibles)
  } catch (error) {
    console.log(error)
    res.status(500).json({ mensaje: "Error al cargar horarios" })
  }
}

exports.crearCita = async (req, res) => {
  const { doctorId, fecha, hora, motivo } = req.body;
  const pacienteId = req.session.usuario.id;

  try {
    // Validación básica
    if (!doctorId || !fecha || !hora) {
      return res.render("citas/nueva", {
        mensaje: "Debe seleccionar doctor, fecha y hora",
        doctores: await Doctor.findAll(),
        css: "citas.css", 
      });
    }
  // Validar que no exista una cita duplicada
  const citaExistente = await Cita.findOne({
    where: {
      doctorId,
      fecha,
      hora,
    },
  });

  if (citaExistente) {
    return res.render("citas/nueva", {
      mensaje: "Ya existe una cita para ese doctor a esa hora.",
      doctores: await Doctor.findAll(),
      css: "citas.css",
    });
  }
    // Convertir fecha a día (lunes, martes...)
    const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const dia = dias[new Date(fecha).getDay()];

    // Buscar el horario del doctor para ese día
    const horario = await Horario.findOne({
      where: { doctorId, dia, disponible: true }
    });

    if (!horario) {
      return res.render("citas/nueva", {
        mensaje: "El doctor no trabaja ese día",
        doctores: await Doctor.findAll(),
        css: "citas.css",
      });
    }

    // Validar que la hora esté en el rango permitido
    const horaSimple = hora.slice(0, 5);
    if (horaSimple < horario.horaInicio || horaSimple >= horario.horaFin) {
      return res.render("citas/nueva", {
        mensaje: "La hora seleccionada está fuera del horario disponible",
        doctores: await Doctor.findAll(),
        css: "citas.css",
      });
    }

    // Registrar cita
    await Cita.create({
      pacienteId,
      doctorId,
      fecha,
      hora: horaSimple,
      motivo,
      estado: "pendiente",
    });

    res.redirect("/citas/mis-citas");
  } catch (err) {
    console.error("Error al agendar cita:", err);
    res.render("citas/nueva", {
      mensaje: "Ocurrió un error al agendar la cita",
      doctores: await Doctor.findAll(),
      css: "citas.css",
    });
  }
};


exports.mostrarMisCitas = async (req, res) => {
  const pacienteId = req.session.usuario.id

  try {
    const citas = await Cita.findAll({
      where: { pacienteId },
      include: [{ model: Doctor }, { model: Paciente }],
      order: [
        ["fecha", "ASC"],
        ["hora", "ASC"],
      ],
    })

    res.render("citas/mis-citas", {
      pagina: "Mis Citas",
      citas,
      usuario: req.session.usuario,
      css: "citas.css",
    })
  } catch (error) {
    console.log(error)
    res.redirect("/")
  }
}

exports.cancelarCita = async (req, res) => {
  const { id } = req.params
  const pacienteId = req.session.usuario.id

  try {
    const cita = await Cita.findOne({
      where: { id, pacienteId },
    })

    if (!cita) {
      return res.redirect("/citas/mis-citas")
    }

    // Actualizar estado de la cita
    cita.estado = "cancelada"
    await cita.save()

    // Devolver la hora disponible al horario del doctor
    const diaSemana = new Date(cita.fecha).toLocaleDateString("es-ES", { weekday: "long" }).toLowerCase()
    const horario = await Horario.findOne({
      where: {
        doctorId: cita.doctorId,
        dia: diaSemana,
      },
    })

    if (horario) {
      horario.horasDisponibles += 1
      await horario.save()
    }

    res.redirect("/citas/mis-citas")
  } catch (error) {
    console.log(error)
    res.redirect("/citas/mis-citas")
  }
}

exports.mostrarCalendario = async (req, res) => {
  const pacienteId = req.session.usuario.id;

  try {
    const citas = await Cita.findAll({
      where: { pacienteId },
      include: [{ model: Doctor }],
      order: [["fecha", "ASC"], ["hora", "ASC"]],
    });

    const eventos = citas.map(cita => ({
      title: `${cita.doctor.nombre} ${cita.doctor.apellido} - ${cita.motivo}`,
      start: `${cita.fecha}T${cita.hora}`,
      color:
        cita.estado === "confirmada" ? "#0d6efd" :
        cita.estado === "completada" || cita.estado === "concluida" ? "#198754" :
        cita.estado === "cancelada" ? "#dc3545" : "#ffc107",
    }));

    const doctores = await Doctor.findAll();

    res.render("citas/calendario", {
      pagina: "Calendario de Citas",
      usuario: req.session.usuario,
      eventos,
      doctores,
      css: "citas.css",
    });
    
  } catch (error) {
    console.log("Error al mostrar el calendario:", error);
    res.redirect("/");
  }
};


// Funciones auxiliares para convertir entre formatos de hora
function convertirHoraAMinutos(hora) {
  const [horas, minutos] = hora.split(":").map(Number)
  return horas * 60 + minutos
}

function convertirMinutosAHora(minutos) {
  const horas = Math.floor(minutos / 60)
  const mins = minutos % 60
  return `${horas.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

exports.actualizarEstadoCita = async (req, res) => {
  const { id, estado } = req.params;

  try {
    const cita = await Cita.findByPk(id);
    if (!cita) {
      return res.status(404).send("Cita no encontrada");
    }

    cita.estado = estado;
    await cita.save();

    res.redirect("/doctor/dashboard"); // o la ruta a donde debe regresar
  } catch (error) {
    console.error("Error al actualizar estado de cita:", error);
    res.status(500).send("Error del servidor");
  }
};
exports.actualizarEstadoCita = async (req, res) => {
  const { id, estado } = req.params;

  try {
    const cita = await Cita.findByPk(id);
    if (!cita) {
      return res.status(404).send("Cita no encontrada");
    }

    cita.estado = estado;
    await cita.save();

    res.redirect("/doctor/dashboard"); 
  } catch (error) {
    console.error("Error al actualizar estado de cita:", error);
    res.status(500).send("Error del servidor");
  }
};

exports.concluirCita = async (req, res) => {
  const { citaId } = req.body;

  try {
      const cita = await Cita.findByPk(citaId);
      if (!cita) {
          return res.status(404).send("Cita no encontrada");
      }

      cita.estado = 'concluida'; // asegúrate que el modelo tenga este campo
      await cita.save();

      res.redirect('/doctor/citas');
  } catch (error) {
      console.error("Error al concluir la cita:", error);
      res.status(500).send("Error al concluir la cita");
  }
};


