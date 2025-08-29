import mongoose from 'mongoose'

const { Schema } = mongoose

const customerSchema = new Schema(
  {
    // 🔑 Asociación multi-tenant: el cliente pertenece a un negocio
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },

    // 🆔 Identificadores externos para integración con proveedores
    externalId: { type: String, required: true },
    source: { type: String, required: true }, // Alegra, Siigo...

    // 👤 Datos principales del cliente
    name: { type: String, required: true },
    identification: { type: String }, // NIT, CC, etc.
    email: { type: String },
    phone: { type: String },
    address: { type: String },

    // 🗂 Datos crudos del proveedor (auditoría / debugging)
    rawData: { type: Object },

    // 🗑 Soft delete (ej: si el cliente se elimina en el sistema externo)
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
)

// ⚡ Índice compuesto: evita duplicados por negocio + proveedor
customerSchema.index({ externalId: 1, source: 1, business: 1 }, { unique: true })

// 📊 Índice extra: acelera búsquedas por negocio + nombre (útil en dashboards, autocompletado, etc.)
customerSchema.index({ business: 1, name: 1 })

// 🔒 Export seguro
export default mongoose.models.Customer || mongoose.model('Customer', customerSchema)
