import RoleModel, { Role } from '../models/role'

interface Filter {
  readonly role: String,
  readonly access: Array<String> 
}

export default class RoleController {
  public async getRoles (filter: Filter) {
    return await RoleModel.find(filter as any)
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
