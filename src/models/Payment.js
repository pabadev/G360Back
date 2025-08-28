import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    externalId: { type: String, required: true },

    date: { type: Date, required: true },
    client: {
      externalId: String,
      name: String
    },

    amount: Number,
    currency: { type: String, default: 'COP' },
    method: String, // tarjeta, efectivo, etc.

    invoices: [
      {
        externalId: String,
        number: String,
        amountApplied: Number
      }
    ],

    status: String, // confirmado, pendiente, anulado
    source: { type: String, required: true },
    rawData: { type: Object }
  },
  { timestamps: true }
)

paymentSchema.index({ externalId: 1, source: 1, business: 1 }, { unique: true })

// ✅ Patrón seguro
export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema)
