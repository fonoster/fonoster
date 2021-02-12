import mongoose, { Schema, model } from 'mongoose'

export interface Role extends mongoose.Document {
  role: string
  description: string
}

const RoleSchema: Schema = new Schema({
  role: { type: String, required: true },
  description: { type: String, required: true },
  access: { type: Array, default: [] }
})

export default model<Role>('Role', RoleSchema)
