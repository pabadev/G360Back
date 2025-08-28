import mongoose from 'mongoose'

const { Schema } = mongoose

// Definimos el esquema de usuarios
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // clave única
    password: { type: String, required: true }, // en producción, cifrar con bcrypt
    role: { type: String, enum: ['admin', 'user'], default: 'user' }
  },
  {
    timestamps: true, // añade createdAt y updatedAt automáticamente
    versionKey: false, // elimina el campo __v
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id?.toString()
        delete ret._id
        delete ret.password // nunca devolver password al cliente
        return ret
      }
    }
  }
)

// ✅ Patrón seguro para evitar OverwriteModelError
export default mongoose.models.User || mongoose.model('User', userSchema)
