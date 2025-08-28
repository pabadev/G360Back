import mongoose from 'mongoose'

const { Schema } = mongoose

const businessSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },

    // Relación con el dueño (usuario que creó el negocio)
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // Conexiones a APIs externas (Alegra, Siigo, etc.)
    sourceConnections: [
      {
        source: { type: String, enum: ['Alegra', 'Siigo'], required: true },
        credentials: {
          accessToken: String,
          refreshToken: String,
          expiresAt: Date
        },
        isActive: { type: Boolean, default: true },
        lastSync: Date
      }
    ]
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id?.toString()
        delete ret._id
        return ret
      }
    }
  }
)

// ✅ Patrón seguro
export default mongoose.models.Business || mongoose.model('Business', businessSchema)
