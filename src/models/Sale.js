import mongoose from 'mongoose'

const SaleSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  source: { type: String, default: 'siigo' }
})

export default mongoose.model('Sale', SaleSchema)
