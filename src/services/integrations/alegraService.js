// src/services/integrations/alegraService.js
import { getActiveConnection } from '../auth/authService.js'
import alegraStrategy from '../auth/strategies/alegraStrategy.js'
import Invoice from '../../models/Invoice.js'

/**
 * Base URL de Alegra. Puedes moverlo a process.env si prefieres.
 * Ejemplo real: 'https://api.alegra.com/api/v1'
 */
const ALEGRA_BASE_URL = process.env.ALEGRA_BASE_URL || 'https://api.alegra.com/api/v1'

/**
 * Mapea una factura de Alegra al modelo unificado Invoice.
 * Ajusta aquí los campos según tus ejemplos de la documentación.
 */
function mapAlegraInvoiceToUnified(alegraInvoice, businessId) {
  // Ejemplo de mapeo; ajusta las rutas exactas según tu JSON de ejemplo
  return {
    business: businessId,
    externalId: String(alegraInvoice.id ?? alegraInvoice.number ?? ''),
    number: alegraInvoice.number || String(alegraInvoice.id || ''),
    date: alegraInvoice.date ? new Date(alegraInvoice.date) : null,
    dueDate: alegraInvoice.dueDate ? new Date(alegraInvoice.dueDate) : null,
    client: {
      externalId: alegraInvoice.client?.id ? String(alegraInvoice.client.id) : undefined,
      name: alegraInvoice.client?.name,
      identification: alegraInvoice.client?.identification,
      email: alegraInvoice.client?.email
    },
    items: (alegraInvoice.items || []).map((it) => ({
      externalId: it.id ? String(it.id) : undefined,
      name: it.name,
      description: it.description,
      quantity: it.quantity,
      price: it.price,
      tax: it.tax,
      total: it.total
    })),
    subtotal: alegraInvoice.subtotal,
    taxes: alegraInvoice.taxes || alegraInvoice.tax || 0,
    discounts: alegraInvoice.discounts || 0,
    total: alegraInvoice.total,
    currency: alegraInvoice.currency || 'COP',
    status: alegraInvoice.status,
    source: 'Alegra',
    rawData: alegraInvoice
  }
}

/**
 * Trae facturas desde Alegra (paginado simple) y retorna el array crudo.
 * Puedes pasar query params como { start, limit, from, to } según la API de Alegra.
 */
export async function fetchAlegraInvoices({ credentials, query = {} }) {
  const headers = alegraStrategy.buildAuthHeaders(credentials)

  const url = new URL(`${ALEGRA_BASE_URL}/invoices`)
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  })

  const resp = await fetch(url, { headers })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Alegra invoices fetch failed: ${resp.status} ${text}`)
  }
  return resp.json()
}

/**
 * Sincroniza facturas de Alegra hacia Mongo (colección Invoice).
 * - Obtiene la conexión activa del negocio
 * - Consume la API
 * - Mapea al modelo unificado
 * - Upsert por (business + source + externalId)
 */
export async function syncAlegraInvoices({ businessId, query = {} }) {
  const { connection } = await getActiveConnection({ businessId, source: 'Alegra' })
  const raw = await fetchAlegraInvoices({ credentials: connection.credentials, query })

  // A veces la API devuelve { data: [...] } y otras un array directo. Compatibilizamos:
  const list = Array.isArray(raw) ? raw : raw.data || raw.results || []
  if (!Array.isArray(list)) {
    throw new Error('Unexpected Alegra invoices payload format')
  }

  let created = 0
  let updated = 0

  for (const inv of list) {
    const doc = mapAlegraInvoiceToUnified(inv, businessId)

    // Upsert con índice único: { externalId, source, business }
    const res = await Invoice.updateOne(
      { externalId: doc.externalId, source: 'Alegra', business: businessId },
      { $set: doc },
      { upsert: true }
    )

    // Mongoose reporta upsertedId si creó; nModified si actualizó (en versiones >=6 usar acknowledged + upsertedCount)
    if (res.upsertedCount && res.upsertedCount > 0) created++
    else if (res.matchedCount && res.modifiedCount >= 0) updated++ // matchedCount>=1 puede no modificar si igual
  }

  return { created, updated, total: list.length }
}

export default {
  fetchAlegraInvoices,
  syncAlegraInvoices
}
