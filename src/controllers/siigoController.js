import Invoice from '../models/Invoice.js'
import { getSiigoToken } from '../services/siigoAuthService.js'

export async function syncSiigo(req, res) {
  try {
    await getSiigoToken()
    res.json({ message: 'Token obtenido, revisar consola' })
  } catch (error) {
    console.error('❌ Error en syncInvoices:', error.message)
    res.status(500).json({ error: 'Error al sincronizar facturas' })
  }
}

export const listInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ date: -1 })
    res.json(invoices)
  } catch (error) {
    res.status(500).json({ error: 'Error al listar facturas' })
  }
}
