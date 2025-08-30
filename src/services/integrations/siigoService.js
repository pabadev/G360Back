// src/services/integrations/siigoService.js
import { getActiveConnection } from '../auth/authService.js'
import siigoStrategy from '../auth/strategies/siigoStrategy.js'
import Invoice from '../../models/Invoice.js'

/**
 * Base URL de Siigo. Puedes moverlo a process.env si prefieres.
 * Docs reales: https://api.siigo.com/
 * Nota: endpoints y estructura pueden variar; ajusta cuando tengas la doc final.
 */
const SIIGO_BASE_URL = process.env.SIIGO_BASE_URL || 'https://api.siigo.com'

/**
 * Mapeo básico de una factura de Siigo al modelo unificado Invoice.
 * Ajusta los nombres según la respuesta real de la API.
 */
function mapSiigoInvoiceToUnified(siigoInvoice, businessId) {
  const externalId = String(siigoInvoice?.id ?? siigoInvoice?.document_id ?? siigoInvoice?.number ?? '')

  const customerObj = siigoInvoice?.customer || siigoInvoice?.client || {}
  const customerId = customerObj?.id ?? customerObj?.identification ?? customerObj?.code
  const customerName = customerObj?.name ?? customerObj?.fullName ?? customerObj?.display_name

  return {
    business: businessId,
    externalId,
    number: String(siigoInvoice?.number ?? externalId ?? ''),
    date: siigoInvoice?.date ? new Date(siigoInvoice.date) : new Date(),
    dueDate: siigoInvoice?.dueDate ? new Date(siigoInvoice.dueDate) : undefined,
    source: 'Siigo',

    subtotal: Number(siigoInvoice?.subtotal ?? siigoInvoice?.total_before_taxes ?? 0),
    taxes: Number(siigoInvoice?.taxes ?? siigoInvoice?.tax ?? 0),
    discounts: Number(siigoInvoice?.discounts ?? siigoInvoice?.discount ?? 0),
    total: Number(siigoInvoice?.total ?? 0),

    status: siigoInvoice?.status ?? 'open',
    currency: siigoInvoice?.currency ?? 'COP',

    customer:
      customerId || customerName ? { id: String(customerId ?? ''), name: String(customerName ?? '') } : undefined
  }
}

/**
 * Obtiene facturas desde Siigo con Bearer Token.
 * El formato real del endpoint puede diferir; ajústalo cuando tengas la doc precisa.
 */
export async function fetchSiigoInvoices({ credentials, query = {} }) {
  const url = new URL('/v1/invoices', SIIGO_BASE_URL)
  // Pasar filtros de fecha u otros si vienen en query (opcional/placeholder)
  if (query?.from) url.searchParams.set('from', query.from)
  if (query?.to) url.searchParams.set('to', query.to)

  const headers = {
    ...siigoStrategy.buildAuthHeaders(credentials),
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }

  const resp = await fetch(url.toString(), { method: 'GET', headers })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Siigo invoices fetch failed: ${resp.status} ${text}`)
  }
  return resp.json()
}

/**
 * Sincroniza facturas de Siigo hacia Mongo (colección Invoice).
 * - Obtiene la conexión activa del negocio
 * - Consume la API
 * - Mapea al modelo unificado
 * - Upsert por (business + source + externalId)
 */
export async function syncSiigoInvoices({ businessId, query = {} }) {
  const { connection } = await getActiveConnection({ businessId, source: 'Siigo' })
  const raw = await fetchSiigoInvoices({ credentials: connection.credentials, query })

  // Normaliza la lista (según cómo venga: raw.data || raw.invoices || raw.sales || [])
  const list = Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw?.invoices)
    ? raw.invoices
    : Array.isArray(raw?.sales)
    ? raw.sales
    : Array.isArray(raw)
    ? raw
    : []

  let created = 0
  let updated = 0

  for (const inv of list) {
    const doc = mapSiigoInvoiceToUnified(inv, businessId)

    // Filtro único por negocio + source + externalId
    const filter = { business: businessId, source: 'Siigo', externalId: doc.externalId }
    const update = { $set: doc }
    const options = { upsert: true }

    const res = await Invoice.updateOne(filter, update, options)

    if (res.upsertedCount && res.upsertedCount > 0) created++
    else if (res.matchedCount && res.modifiedCount >= 0) updated++
  }

  return { created, updated, total: list.length }
}

export default {
  fetchSiigoInvoices,
  syncSiigoInvoices
}
