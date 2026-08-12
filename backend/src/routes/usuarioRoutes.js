const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/usuarioController');

const router = express.Router();

router.use(auth);
router.get('/', ctrl.listar);
router.post('/', requireRole('admin'), ctrl.crear);
router.put('/:id', requireRole('admin'), ctrl.actualizar);
router.delete('/:id', requireRole('admin'), ctrl.eliminar);

module.exports = router;
