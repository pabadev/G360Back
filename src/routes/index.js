import express from 'express'
import UserController from '../controllers/userController.js'
import jsonPlaceholderController from '../controllers/jsonPlaceholderController.js'
import businessController from '../controllers/businessController.js'
import auth from '../middlewares/auth.js'
import admin from '../middlewares/admin.js'
import adminController from '../controllers/adminController.js'
import integrationController from '../controllers/integrationController.js'

const router = express.Router()

// health check
router.get('/', (req, res) => res.json({ ok: true }))

// ------------------ AUTH ------------------ //
router.post('/auth/register', UserController.createUser)
router.post('/auth/login', UserController.loginUser)

// perfil del usuario autenticado
router.get('/profile', auth, UserController.getCurrentUser)

// ------------------ BUSINESSES ------------------ //
router.post('/businesses', auth, businessController.createBusiness)
router.get('/businesses', auth, businessController.getUserBusinesses)
router.get('/businesses/:id', auth, businessController.getBusinessById)
router.put('/businesses/:id', auth, businessController.updateBusiness)
router.delete('/businesses/:id', auth, businessController.deleteBusiness)

// ------------------ ADMIN ------------------ //
router.get('/admin/users', auth, admin, adminController.getAllUsers)
router.get('/admin/businesses', auth, admin, adminController.getAllBusinesses)

// ------------------ EXTERNAL (EJEMPLO JSONPLACEHOLDER) ------------------ //
router.get('/external/posts', jsonPlaceholderController.getPosts)

// ------------------ INTEGRATIONS ------------------ //
// Autenticar con un proveedor externo (Alegra, Siigo, etc.)
router.post('/integrations/:source/auth', auth, integrationController.authIntegration)

// Sincronizar facturas desde un proveedor externo
router.post('/integrations/:source/invoices/sync', auth, integrationController.syncInvoices)

// Consultar info de conexión (sin exponer credenciales)
router.get('/integrations/:source/connection', auth, integrationController.getConnectionInfo)

export default router
