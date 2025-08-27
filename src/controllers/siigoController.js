import Invoice from '../models/Invoice.js'
import { getInvoices } from '../services/siigoService.js'

export async function syncSiigo(req, res) {
  try {
    console.log('yeeeeahhhh')

    // const token = 'access token' // 👈 luego lo manejamos dinámico
    // const invoicesFromApi = await getInvoices(token)

    // let savedInvoices = []

    // for (const inv of invoicesFromApi) {
    //   const invoiceData = {
    //     id: inv.id,
    //     number: inv.number,
    //     date: inv.date,
    //     customer: {
    //       id: inv.customer?.id,
    //       name: inv.customer?.name,
    //       identification: inv.customer?.identification
    //     },
    //     total: inv.total,
    //     status: inv.status,
    //     rawData: inv
    //   }

    //   // upsert → si existe la actualiza, si no la crea
    //   const saved = await Invoice.findOneAndUpdate({ id: inv.id }, invoiceData, { upsert: true, new: true })

    //   savedInvoices.push(saved)
    // }

    res.json({
      message: '✅ Facturas sincronizadas correctamente'
      // synced: savedInvoices.length,
      // invoices: savedInvoices
    })
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
