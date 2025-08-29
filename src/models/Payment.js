import mongoose from 'mongoose'

const { Schema } = mongoose

const paymentSchema = new Schema(
  {
    // 🔑 Asociación multi-tenant: cada pago pertenece a un negocio
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },

    // 🆔 Identificador externo para integración
    externalId: { type: String, required: true },

    // 📅 Fecha del pago
    date: { type: Date, required: true },

    // 👤 Cliente embebido (snapshot)
    client: {
      externalId: String,
      name: String
    },

    // 📊 Relación con facturas pagadas (referencia + snapshot)
    invoices: [
      {
        invoice: { type: Schema.Types.ObjectId, ref: 'Invoice' }, // referencia para métricas
        externalId: String,
        number: String,
        amountApplied: Number
      }
    ],

    // 💰 Detalles del pago
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'COP' },
    method: { type: String }, // tarjeta, efectivo, etc.

    // 📌 Estado controlado con enum
    status: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'pending' },

    // 🌐 Fuente del dato (ej: Alegra, Siigo...)
    source: { type: String, required: true },

    // 🗂 Datos crudos de la API
    rawData: { type: Object },

    // 🗑 Soft delete: para mantener historial aunque se elimine en el sistema externo
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
)

// ⚡ Índice compuesto: evita duplicados del mismo pago por negocio + proveedor
paymentSchema.index({ externalId: 1, source: 1, business: 1 }, { unique: true })

// 📊 Índice extra: acelera consultas por negocio y fecha
paymentSchema.index({ business: 1, date: -1 })

// 🔒 Patrón seguro
export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema)
