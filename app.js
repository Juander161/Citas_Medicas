const express = require("express")
const path = require("path")
const app = express()
const routes = require("./routes/router")
const session = require("express-session")
require('./models/associations')();
// Configuración
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

// Middleware
app.use(express.static(path.join(__dirname, "public")))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(
  session({
    secret: "secreto_citas_medicas",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
)
app.use((req, res, next) => {
  res.locals.css = null;
  res.locals.usuario = req.session.usuario || null
  next()
})

app.use ((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});


// Rutas
app.use("/", routes)

// Conexión a la base de datos
const db = require("./config/db")
const initAdmin = require("./config/initAdmin")

// Sincronizar base de datos y luego inicializar el admin
db.sync()
  .then(async () => {
    console.log("Base de datos conectada")
    // Inicializar administrador por defecto
    await initAdmin()

    // Para depuración: verificar si el admin se creó correctamente
    const Admin = require("./models/Admin")
    const admin = await Admin.findOne({ where: { email: "IDGS8B@utna.com" } })
    if (admin) {
      console.log("Admin encontrado en la base de datos:", {
        id: admin.id,
        email: admin.email,
        passwordHash: admin.password.substring(0, 20) + "...", // Solo mostrar parte del hash por seguridad
      })
    } else {
      console.log("No se encontró el admin en la base de datos")
    }
  })
  .catch((error) => console.log(error))

// Iniciar servidor
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`)
})

