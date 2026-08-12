const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Emprendimiento, Usuario } = require('../models');

function firmarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      emprendimientoId: usuario.emprendimientoId,
      rol: usuario.rol,
      email: usuario.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
// Crea un nuevo emprendimiento junto con su usuario administrador inicial.
async function register(req, res) {
  const { nombreEmprendimiento, rubro, nombreUsuario, email, password } = req.body;

  if (!nombreEmprendimiento || !nombreUsuario || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  const existente = await Usuario.findOne({ where: { email } });
  if (existente) {
    return res.status(409).json({ error: 'Ya existe un usuario con ese email.' });
  }

  const emprendimiento = await Emprendimiento.create({ nombre: nombreEmprendimiento, rubro });

  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await Usuario.create({
    emprendimientoId: emprendimiento.id,
    nombre: nombreUsuario,
    email,
    passwordHash,
    rol: 'admin',
  });

  const token = firmarToken(usuario);
  res.status(201).json({
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    emprendimiento,
  });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
  }

  const usuario = await Usuario.findOne({ where: { email, activo: true } });
  if (!usuario) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  const passwordValido = await bcrypt.compare(password, usuario.passwordHash);
  if (!passwordValido) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  const token = firmarToken(usuario);
  res.json({
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
  });
}

// GET /api/auth/me
async function me(req, res) {
  const usuario = await Usuario.findByPk(req.user.id, {
    attributes: { exclude: ['passwordHash'] },
    include: [{ association: 'emprendimiento' }],
  });
  res.json(usuario);
}

module.exports = { register, login, me };
