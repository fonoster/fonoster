import RoleModel, { Role } from '../models/role'

export default class RoleController {
  public async getRoles () {
    return await RoleModel.find({})
  }

  public async createRole (obj: any) {
    const { role, description, access } = obj
    const roles: Role = new RoleModel({
      role,
      description,
      access
    })
    await roles.save()
  }
}
