import user from '../models/user'
import UserModel, { User } from '../models/user'

class UserOperation {
  public async getUsers () {
    const users = await UserModel.find()
    return users
    //console.log(users);
  }

  public async getAll () {
    const users = await UserModel.find()
    return users
    //console.log(users);
  }

  public async getUserByEmail (mail: string) {
    const users = await UserModel.findOne({ email: { $eq: mail } })
    //console.log(users);
    return users
  }

  public async saveUser (obj: any) {
    const {
      firstname,
      lastname,
      username,
      email,
      password,
      roles,
      create_time,
      update_time,
      status
    } = obj
    const users: User = new UserModel({
      firstname,
      lastname,
      username,
      email,
      password,
      roles,
      create_time,
      update_time,
      status
    })
    await users.save()
    console.log({ new: users })
  }

  public async updateUser (mail: string, new_status: string) {
    await UserModel.updateOne(
      {
        email: mail
      },
      {
        $set: {
          status: new_status
        }
      }
    )
  }

  public async deleteUserByEmail (email: string) {
    UserModel.findOneAndUpdate({
      query: { name: 'Alto' },
      sort: { cno: 1 },
      update: { $inc: { speed: 10 } }
    })
  }
}

export const userOperation = new UserOperation()
