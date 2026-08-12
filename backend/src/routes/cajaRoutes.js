const express = require('express');
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/cajaController');

const router = express.Router();

router.use(auth);
router.get('/movimientos', ctrl.listar);
router.post('/movimientos', ctrl.crear);
router.get('/balance', ctrl.balance);

module.exports = router;
