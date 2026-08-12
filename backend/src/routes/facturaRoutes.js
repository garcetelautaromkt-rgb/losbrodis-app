const express = require('express');
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/facturaController');

const router = express.Router();

router.use(auth);
router.get('/', ctrl.listar);
router.get('/analisis', ctrl.analisis);
router.get('/:id', ctrl.obtener);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
