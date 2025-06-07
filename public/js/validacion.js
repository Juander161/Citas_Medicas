// Modificar el archivo public/js/validacion.js
document.addEventListener('DOMContentLoaded', function() {
    // Validación del formulario de registro
    const formularioRegistro = document.getElementById('formulario-registro');
    if (formularioRegistro) {
      formularioRegistro.addEventListener('submit', function(event) {
        let error = false;
        const nombre = document.getElementById('nombre').value.trim();
        const apellido = document.getElementById('apellido').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmarPassword = document.getElementById('confirmarPassword').value;
        const telefono = document.getElementById('telefono').value.trim();
        const fechaNacimiento = document.getElementById('fechaNacimiento').value;
        
        // Validar nombre
        if (nombre === '') {
          mostrarError('nombre', 'El nombre es obligatorio');
          error = true;
        } else if (nombre.length < 2) {
          mostrarError('nombre', 'El nombre debe tener al menos 2 caracteres');
          error = true;
        } else {
          limpiarError('nombre');
        }
        
        // Validar apellido
        if (apellido === '') {
          mostrarError('apellido', 'El apellido es obligatorio');
          error = true;
        } else if (apellido.length < 2) {
          mostrarError('apellido', 'El apellido debe tener al menos 2 caracteres');
          error = true;
        } else {
          limpiarError('apellido');
        }
        
        // Validar email
        if (email === '') {
          mostrarError('email', 'El email es obligatorio');
          error = true;
        } else if (!validarEmail(email)) {
          mostrarError('email', 'El formato del email no es válido');
          error = true;
        } else {
          limpiarError('email');
        }
        
        // Validar contraseña
        if (password === '') {
          mostrarError('password', 'La contraseña es obligatoria');
          error = true;
        } else if (password.length < 6) {
          mostrarError('password', 'La contraseña debe tener al menos 6 caracteres');
          error = true;
        } else {
          limpiarError('password');
        }
        
        // Validar confirmación de contraseña
        if (confirmarPassword === '') {
          mostrarError('confirmarPassword', 'Debe confirmar su contraseña');
          error = true;
        } else if (password !== confirmarPassword) {
          mostrarError('confirmarPassword', 'Las contraseñas no coinciden');
          error = true;
        } else {
          limpiarError('confirmarPassword');
        }
        
        // Validar teléfono
        if (telefono === '') {
          mostrarError('telefono', 'El teléfono es obligatorio');
          error = true;
        } else if (!validarTelefono(telefono)) {
          mostrarError('telefono', 'El formato del teléfono no es válido (10 dígitos)');
          error = true;
        } else {
          limpiarError('telefono');
        }
        
        // Validar fecha de nacimiento
        if (fechaNacimiento === '') {
          mostrarError('fechaNacimiento', 'La fecha de nacimiento es obligatoria');
          error = true;
        } else {
          const hoy = new Date();
          const fechaNac = new Date(fechaNacimiento);
          const edad = hoy.getFullYear() - fechaNac.getFullYear();
          
          if (edad < 0) {
            mostrarError('fechaNacimiento', 'La fecha de nacimiento no puede ser en el futuro');
            error = true;
          } else if (edad > 120) {
            mostrarError('fechaNacimiento', 'La fecha de nacimiento no es válida');
            error = true;
          } else {
            limpiarError('fechaNacimiento');
          }
        }
        
        if (error) {
          event.preventDefault();
        }
      });
    }
    
    // Validación del formulario de login
    const formularioLogin = document.getElementById('formulario-login');
    if (formularioLogin) {
      formularioLogin.addEventListener('submit', function(event) {
        let error = false;
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Validar email
        if (email === '') {
          mostrarError('email', 'El email es obligatorio');
          error = true;
        } else if (!validarEmail(email)) {
          mostrarError('email', 'El formato del email no es válido');
          error = true;
        } else {
          limpiarError('email');
        }
        
        // Validar contraseña
        if (password === '') {
          mostrarError('password', 'La contraseña es obligatoria');
          error = true;
        } else {
          limpiarError('password');
        }
        
        if (error) {
          event.preventDefault();
        }
      });
    }
    
    // Validación del formulario de cita
    const formularioCita = document.getElementById('formulario-cita');
    if (formularioCita) {
      formularioCita.addEventListener('submit', function(event) {
        let error = false;
        const doctor = document.getElementById('doctor').value;
        const fecha = document.getElementById('fecha').value;
        const hora = document.getElementById('hora').value;
        const motivo = document.getElementById('motivo').value.trim();
        
        // Validar doctor
        if (doctor === '') {
          mostrarError('doctor', 'Debe seleccionar un doctor');
          error = true;
        } else {
          limpiarError('doctor');
        }
        
        // Validar fecha
        if (fecha === '') {
          mostrarError('fecha', 'Debe seleccionar una fecha');
          error = true;
        } else {
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          const fechaSeleccionada = new Date(fecha);
          
          if (fechaSeleccionada < hoy) {
            mostrarError('fecha', 'No puede seleccionar una fecha pasada');
            error = true;
          } else {
            limpiarError('fecha');
          }
        }
        
        // Validar hora
        if (hora === '') {
          mostrarError('hora', 'Debe seleccionar una hora');
          error = true;
        } else {
          limpiarError('hora');
        }
        
        // Validar motivo
        if (motivo === '') {
          mostrarError('motivo', 'El motivo de la consulta es obligatorio');
          error = true;
        } else if (motivo.length < 10) {
          mostrarError('motivo', 'El motivo debe tener al menos 10 caracteres');
          error = true;
        } else {
          limpiarError('motivo');
        }
        
        if (error) {
          event.preventDefault();
        }
      });
    }
    
    // Funciones auxiliares
    function mostrarError(id, mensaje) {
      const input = document.getElementById(id);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'invalid-feedback';
      errorDiv.textContent = mensaje;
      
      input.classList.add('is-invalid');
      
      // Eliminar mensaje de error anterior si existe
      const errorAnterior = input.nextElementSibling;
      if (errorAnterior && errorAnterior.className === 'invalid-feedback') {
        errorAnterior.remove();
      }
      
      input.parentNode.insertBefore(errorDiv, input.nextSibling);
      
      // Mostrar alerta en la parte superior del formulario
      const form = input.closest('form');
      const alertaExistente = form.querySelector('.alert-danger');
      
      if (!alertaExistente) {
        const alerta = document.createElement('div');
        alerta.className = 'alert alert-danger';
        alerta.textContent = 'Por favor, corrija los errores en el formulario.';
        form.insertBefore(alerta, form.firstChild);
      }
    }
    
    function limpiarError(id) {
      const input = document.getElementById(id);
      input.classList.remove('is-invalid');
      
      const errorDiv = input.nextElementSibling;
      if (errorDiv && errorDiv.className === 'invalid-feedback') {
        errorDiv.remove();
      }
      
      // Verificar si aún hay errores en el formulario
      const form = input.closest('form');
      const errores = form.querySelectorAll('.is-invalid');
      
      if (errores.length === 0) {
        const alerta = form.querySelector('.alert-danger');
        if (alerta) {
          alerta.remove();
        }
      }
    }
    
    function validarEmail(email) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    }
    
    function validarTelefono(telefono) {
      const regex = /^\d{10}$/;
      return regex.test(telefono);
    }
  });

  