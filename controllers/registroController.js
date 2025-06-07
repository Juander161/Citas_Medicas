// controllers/registroController.js
const { validationResult } = require('express-validator');
const Paciente = require('../models/Paciente');


exports.registrarPaciente = async (req, res) => {
    // Validar formulario
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.render('registro', {
        pagina: 'Registro de Paciente',
        mensaje: errores.array()[0].msg,
        datos: req.body
      });
    }
  
    // Verificar que las contraseñas coincidan
    const { password, confirmarPassword } = req.body;
    if (password !== confirmarPassword) {
      return res.render('registro', {
        pagina: 'Registro de Paciente',
        mensaje: 'Las contraseñas no coinciden',
        datos: req.body
      });
    }
  
    try {
      // Crear nuevo paciente
      await Paciente.create({
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        email: req.body.email,
        password: req.body.password, // Se hasheará automáticamente por el hook
        telefono: req.body.telefono,
        fechaNacimiento: req.body.fechaNacimiento,
        historialMedico: req.body.historialMedico || ''
      });
  
      res.redirect('/login');
    } catch (error) {
      console.log(error);
      res.render('registro', {
        pagina: 'Registro de Paciente',
        mensaje: 'Error al registrar paciente',
        datos: req.body
      });
    }
  };