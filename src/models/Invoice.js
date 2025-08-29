import mongoose from 'mongoose'

const { Schema } = mongoose

const invoiceSchema = new Schema(
  {
    // 🔑 Asociación multi-tenant: cada factura pertenece a un negocio
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },

    // 🆔 Identificador externo (ej: ID en Siigo/Alegra)
    externalId: { type: String, required: true },
    number: { type: String },

    // 📅 Fechas clave de la factura
    date: { type: Date, required: true }, // fecha de emisión
    dueDate: { type: Date }, // fecha de vencimiento

    // 👤 Relación con Customer (para métricas globales y reportes)
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },

    // 👤 Cliente embebido (snapshot en el momento de la factura)
    // Esto conserva la foto del cliente tal como estaba al emitirse la factura,
    // incluso si luego cambian sus datos en el modelo Customer.
    client: {
      externalId: String,
      name: String,
      identification: String,
      email: String
    },

    // 📦 Items de la factura (detalles de compra)
    items: [
      {
        externalId: String,
        name: String,
        description: String,
        quantity: Number,
        price: Number,
        tax: Number,
        total: Number
      }
    ],

    // 💰 Montos principales
    subtotal: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    discounts: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    // 💵 Moneda (default COP)
    currency: { type: String, default: 'COP' },

    // 📌 Estado controlado con enum para consistencia
    status: { type: String, enum: ['paid', 'pending', 'cancelled'], default: 'pending' },

    // 🌐 Fuente del dato (ej: Alegra, Siigo...)
    source: { type: String, required: true },

    // 🗂 Guardamos el JSON crudo de la API para auditoría
    rawData: { type: Object },

    // 🗑 Soft delete: permite marcar facturas como eliminadas sin borrarlas físicamente
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
)

// ⚡ Índice compuesto: evita duplicados de la misma factura por negocio y fuente
invoiceSchema.index({ externalId: 1, source: 1, business: 1 }, { unique: true })

// 📊 Índice extra: acelera consultas por negocio y fecha (útil para dashboards/reportes)
invoiceSchema.index({ business: 1, date: -1 })

// ✅ Middleware: valida consistencia de montos antes de guardar
invoiceSchema.pre('save', function (next) {
  const calculatedTotal = (this.subtotal || 0) - (this.discounts || 0) + (this.taxes || 0)
  if (this.total !== calculatedTotal) {
    this.total = calculatedTotal // forzamos consistencia
  }
  next()
})

// 🔒 Export seguro (evita redefinir el modelo en hot-reload)
export default mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema)
