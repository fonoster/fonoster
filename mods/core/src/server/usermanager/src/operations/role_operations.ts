import RoleModel, { Role } from '../models/role'

export default class RoleController {
  public async getRoles (filter: object = {}) {
    return await RoleModel.find(filter)
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
