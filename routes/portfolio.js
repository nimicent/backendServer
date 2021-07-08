const express = require('express');
const router = express.Router();
const {
    create,
    list,
    listAllPortfoliosCategoriesTags,
    read,
    remove,
    update,
    photo,
    listRelated,
    listSearch,
    listByUser
} = require('../controllers/portfolio');

const { requireSignin, adminMiddleware, authMiddleware, canUpdateDeletePortfolio } = require('../controllers/auth');

router.post('/portfolio', requireSignin, adminMiddleware, create);
router.get('/portfolios', list);
router.post('/portfolio-categories-tags', listAllPortfoliosCategoriesTags);
router.get('/portfolio/:slug', read);
router.delete('/portfolio/:slug', requireSignin, adminMiddleware, remove);
router.put('/portfolio/:slug', requireSignin, adminMiddleware, update);
router.get('/portfolio/photo/:slug', photo);
router.post('/portfolios/related', listRelated);
router.get('/portfolios/search', listSearch);

// auth user blog crud...
router.post('/user/portfolio', requireSignin, authMiddleware, create);
router.get('/:username/portfolios', listByUser);
router.delete('/user/portfolio/:slug', requireSignin, authMiddleware, canUpdateDeletePortfolio, remove);
router.put('/user/portfolio/:slug', requireSignin, authMiddleware, canUpdateDeletePortfolio, update);

module.exports = router;
