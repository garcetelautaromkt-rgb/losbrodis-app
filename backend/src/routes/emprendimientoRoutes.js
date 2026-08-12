const express = require('express');
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/emprendimientoController');

const router = express.Router();

router.get('/actual', auth, ctrl.obtenerActual);
router.put('/actual', auth, ctrl.actualizarActual);

module.exports = router;
