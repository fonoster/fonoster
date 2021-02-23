import mongoose, { Schema, model } from 'mongoose'
import { Role } from './role'

export interface User extends mongoose.Document {
  firstName: string
  lastName: string
  email: string
  accessKeyId: string
  role: Role
  createTime: string
  updateTime: string
  status: string
}

const UserSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, match: [/.+\@.+\..+/, 'Invalid email format']}, 
  accessKeyId: { type: String, required: true },
  role: { type: Schema.Types.String, required: true },
  createTime: { type: String },
  updateTime: { type: String },
  status: { type: String, required: true }
})

// Export the model and return your IUser interface
export default model<User>('User', UserSchema)
