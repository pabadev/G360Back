import mongoose from 'mongoose'

const invoiceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // ID de la factura en Siigo
    number: { type: String }, // Número de la factura
    date: { type: Date },
    customer: {
      id: String,
      name: String,
      identification: String
    },
    total: { type: Number },
    status: { type: String }, // paid, pending, cancelled, etc.
    rawData: { type: Object } // Guardamos toda la data original por seguridad
  },
  { timestamps: true }
)

export default mongoose.model('Invoice', invoiceSchema)
