const express = require('express');
const router = express.Router();

// controllers
const { requireSignin, adminMiddleware } = require('../controllers/auth');
const { create, list, read, readp, remove } = require('../controllers/tag');

// validators
const { runValidation } = require('../validators');
const { createTagValidator } = require('../validators/tag');

// only difference is methods not name 'get' | 'post' | 'delete'
router.post('/tag', createTagValidator, runValidation, requireSignin, adminMiddleware, create);
router.get('/tags', list);
router.get('/tag/:slug', read);
router.get('/tag/:slug', readp);
router.delete('/tag/:slug', requireSignin, adminMiddleware, remove);

module.exports = router; 
