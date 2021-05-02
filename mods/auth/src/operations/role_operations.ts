import RoleModel, {Role} from "../models/role";

interface Filter {
  readonly role: string;
  readonly access: string;
}

export default class RoleController {
  public async getRoles(filter: Filter) {
    return await RoleModel.find(filter as any);
  }

  public async createRole(obj: any) {
    const {role, description, access} = obj;
    const roles: Role = new RoleModel({
      role,
      description,
      access
    });
    await roles.save();
  }
}
