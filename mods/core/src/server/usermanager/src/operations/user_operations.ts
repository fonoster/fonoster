import UserModel, { User } from '../models/user'

class UserOperation {
  public async getUsers () {
    const users = await UserModel.find()
    return users
  }

  public async getAll () {
    const users = await UserModel.find()
    return users
  }

  public async getUserByEmail (mail: string) {
    const users = await UserModel.findOne({ email: { $eq: mail } })
    return users
  }

  public async saveUser (obj: any) {
    const {
      firstName,
      lastName,
      email,
      role,
      accessKeyId,
      createTime,
      updateTime,
      status
    } = obj
    const users: User = new UserModel({
      firstName,
      lastName,
      email,
      role,
      accessKeyId,
      createTime,
      updateTime,
      status
    })
    await users.save()
  }

  public async updateUserStatus (mail: string, new_status: string) {
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
