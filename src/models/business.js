import mongoose from 'mongoose'

const { Schema, model } = mongoose

const businessSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true }
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

const Business = model('Business', businessSchema)

export default Business
