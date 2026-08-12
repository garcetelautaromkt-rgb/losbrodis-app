const express = require('express');
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/compraController');

const router = express.Router();

router.use(auth);
router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', ctrl.crear);

module.exports = router;
