import mongoose, { Schema, model } from 'mongoose'
import { Role } from './role'

export interface User extends mongoose.Document {
  firstname: string
  lastname: string
  username: string
  email: string
  password: string
  roles: Role
  create_time: string
  update_time: string
  status: string
}

const UserSchema: Schema = new Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: { type: Schema.Types.ObjectId, required: true },
  create_time: { type: String },
  update_time: { type: String },
  status: { type: String, required: true }
})

// Export the model and return your IUser interface
export default model<User>('User', UserSchema)
