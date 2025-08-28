import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    externalId: { type: String, required: true },

    name: { type: String, required: true },
    reference: String,
    description: String,
    category: String,

    price: {
      cost: Number,
      sale: Number,
      currency: { type: String, default: 'COP' }
    },

    inventory: {
      unit: String,
      quantity: Number,
      minQuantity: Number,
      maxQuantity: Number
    },

    isActive: { type: Boolean, default: true },
    source: { type: String, required: true },
    rawData: { type: Object }
  },
  { timestamps: true }
)

productSchema.index({ externalId: 1, source: 1, business: 1 }, { unique: true })

// ✅ Patrón seguro
export default mongoose.models.Product || mongoose.model('Product', productSchema)
