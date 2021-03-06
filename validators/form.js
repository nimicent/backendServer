const { check } = require('express-validator');

exports.contactFormValidator = [
    check('name')
        .not()
        .isEmpty()
        .withMessage('Name is required'),
    check('email')
        .isEmail()
        .withMessage('Must be valid email address'),
    check('message')
        .not()
        .isEmpty()
        .isLength({ min: 5 })
        .withMessage('Message must be at least 5 characters long')
];
