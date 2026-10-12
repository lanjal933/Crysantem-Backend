const { body, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn('Errores de validación:', errors.array());
    return res.status(400).json({
      error: 'Datos inválidos',
      details: errors.array()
    });
  }
  next();
};

/**
 * Reglas de validación para registro
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nombre es requerido')
    .isLength({ min: 2, max: 50 }).withMessage('Nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Nombre solo puede contener letras y espacios'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email es requerido')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Contraseña es requerida')
    .isLength({ min: 6, max: 100 }).withMessage('Contraseña debe tener entre 6 y 100 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  handleValidationErrors
];

/**
 * Reglas de validación para login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email es requerido')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Contraseña es requerida'),
  handleValidationErrors
];

/**
 * Reglas de validación para código de email
 */
const emailCodeValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email es requerido')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('code')
    .trim()
    .notEmpty().withMessage('Código es requerido')
    .isLength({ min: 6, max: 6 }).withMessage('Código debe tener 6 dígitos')
    .isNumeric().withMessage('Código debe ser numérico'),
  handleValidationErrors
];

/**
 * Reglas de validación para mensaje de IA
 */
const aiMessageValidation = [
  body('message')
    .trim()
    .notEmpty().withMessage('Mensaje es requerido')
    .isLength({ min: 1, max: 2000 }).withMessage('Mensaje debe tener entre 1 y 2000 caracteres')
    .escape(),  // Sanitizar contra XSS
  handleValidationErrors
];

/**
 * Reglas de validación para configuración MyIA
 */
const myiaConfigValidation = [
  body('userId')
    .trim()
    .notEmpty().withMessage('User ID es requerido')
    .isUUID().withMessage('User ID inválido'),
  body('config.business_name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Nombre de negocio no puede exceder 100 caracteres')
    .escape(),
  body('config.slug')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[a-z0-9-]+$/).withMessage('Slug solo puede contener letras minúsculas, números y guiones')
    .isLength({ min: 3, max: 50 }).withMessage('Slug debe tener entre 3 y 50 caracteres'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  emailCodeValidation,
  aiMessageValidation,
  myiaConfigValidation
};
