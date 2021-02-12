import RoleModel, { Role } from '../models/role'

class RoleController {
  public async getRoles () {
    const roles = await RoleModel.find({})
    console.log(roles)
  }

  public async createRole (obj: any) {
    const { role, description } = obj
    const roles: Role = new RoleModel({
      role,
      description
    })
    await roles.save()
    console.log(roles)
  }
}

export const roleController = new RoleController()
