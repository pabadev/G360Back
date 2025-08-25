import express from 'express'
import UserController from '../controllers/userController.js'
import jsonPlaceholderController from '../controllers/jsonPlaceholderController.js'
import businessController from '../controllers/businessController.js'
import auth from '../middlewares/auth.js'
import admin from '../middlewares/admin.js'
import adminController from '../controllers/adminController.js'

const router = express.Router()

router.get('/', (req, res) => res.json({ ok: true }))

// auth
router.post('/auth/register', UserController.createUser)
router.post('/auth/login', UserController.loginUser)

// profile: devuelve SOLO el usuario autenticado
router.get('/profile', auth, UserController.getCurrentUser)

// businesses (protected) - cada usuario solo puede gestionar/ver sus propios negocios
router.post('/businesses', auth, businessController.createBusiness)
router.get('/businesses', auth, businessController.getUserBusinesses)
router.get('/businesses/:id', auth, businessController.getBusinessById)
router.put('/businesses/:id', auth, businessController.updateBusiness)
router.delete('/businesses/:id', auth, businessController.deleteBusiness)

// external API via axios
router.get('/external/posts', jsonPlaceholderController.getPosts)

// admin routes (protegidas)
router.get('/admin/users', auth, admin, adminController.getAllUsers)
router.get('/admin/businesses', auth, admin, adminController.getAllBusinesses)

export default router
