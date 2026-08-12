const express = require('express');
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/ventaController');

const router = express.Router();

router.use(auth);
router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', ctrl.crear);
router.post('/:id/cancelar', ctrl.cancelar);

module.exports = router;
