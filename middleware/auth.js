exports.isAuthenticated = (req, res, next) => {
  if (req.session.usuario) {
    return next();
  }
  return res.redirect("/login");
};

exports.isAdmin = (req, res, next) => {
  if (req.session.usuario && req.session.usuario.rol === "admin") {
    return next();
  }
  return res.status(403).send("Acceso denegado. Solo administradores.");
};

exports.isDoctor = (req, res, next) => {
  if (req.session.usuario && req.session.usuario.rol === "doctor") {
    return next();
  }
  return res.status(403).send("Acceso denegado. Solo doctores.");
};

exports.isPaciente = (req, res, next) => {
  if (req.session.usuario && req.session.usuario.rol === "paciente") {
    return next();
  }
  return res.status(403).send("Acceso denegado. Solo pacientes.");
};
