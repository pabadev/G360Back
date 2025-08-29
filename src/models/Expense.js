import mongoose from 'mongoose'

const { Schema } = mongoose

const expenseSchema = new Schema(
  {
    // 🔑 Asociación multi-tenant: cada gasto pertenece a un negocio
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },

    // 🆔 Identificador externo para integración con APIs (Siigo, Alegra, etc.)
    externalId: { type: String, required: true },

    number: { type: String },

    // 📅 Fechas clave del gasto
    date: { type: Date, required: true }, // fecha de registro

    // 🏢 Proveedor embebido (snapshot)
    supplier: {
      externalId: String,
      name: String,
      identification: String,
      email: String
    },

    // 📦 Items del gasto
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
    currency: { type: String, default: 'COP' },

    // 📌 Clasificación del gasto (opcional, para dashboards)
    category: String,

    // 📌 Estado de pago controlado con enum
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'cancelled'],
      default: 'pending'
    },

    // 🌐 Fuente del dato (Alegra, Siigo...)
    source: { type: String, required: true },

    // 🗂 Guardamos el JSON crudo para auditoría
    rawData: { type: Object },

    // 🗑 Soft delete: marcar sin borrar físicamente
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
)

// ⚡ Índice compuesto: evita duplicados del mismo gasto por negocio + proveedor
expenseSchema.index({ externalId: 1, source: 1, business: 1 }, { unique: true })

// 📊 Índice extra: acelera consultas por negocio y fecha
expenseSchema.index({ business: 1, date: -1 })

// ✅ Middleware: valida consistencia de montos antes de guardar
expenseSchema.pre('save', function (next) {
  const calculatedTotal = (this.subtotal || 0) - (this.discounts || 0) + (this.taxes || 0)
  if (this.total !== calculatedTotal) {
    this.total = calculatedTotal // forzamos consistencia
  }
  next()
})

// 🔒 Patrón seguro para export
export default mongoose.models.Expense || mongoose.model('Expense', expenseSchema)
