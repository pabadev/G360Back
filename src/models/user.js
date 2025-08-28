import mongoose from 'mongoose'
import bcrypt from 'bcryptjs' // ✅ Necesario para encriptar y comparar contraseñas

const { Schema } = mongoose

// Definimos el esquema de usuarios
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // clave única
    password: { type: String, required: true }, // se encripta antes de guardar
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

/**
 * 🔹 Middleware pre-save:
 * Antes de guardar, si la contraseña fue modificada, la encripta
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10) // 10 salt rounds
  next()
})

/**
 * 🔹 Método comparePassword:
 * Compara una contraseña ingresada con la almacenada en la DB
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// ✅ Patrón seguro para evitar OverwriteModelError
export default mongoose.models.User || mongoose.model('User', userSchema)
