import mongoose from 'mongoose'

const expenseSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    externalId: { type: String, required: true },

    number: { type: String },
    date: { type: Date, required: true },

    supplier: {
      externalId: String,
      name: String,
      identification: String,
      email: String
    },

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

    subtotal: Number,
    taxes: Number,
    discounts: Number,
    total: Number,
    currency: { type: String, default: 'COP' },
    category: String, // clasificar gastos
    paymentStatus: { type: String }, // pagado, pendiente, etc.

    source: { type: String, required: true },
    rawData: { type: Object }
  },
  { timestamps: true }
)

expenseSchema.index({ externalId: 1, source: 1, business: 1 }, { unique: true })

// ✅ Patrón seguro
export default mongoose.models.Expense || mongoose.model('Expense', expenseSchema)
