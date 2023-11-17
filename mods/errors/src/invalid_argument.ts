import FonosterError from "./error";
import { INVALID_ARGUMENT } from "./codes";

export default class extends FonosterError {
  constructor(message?: string) {
    super(message, INVALID_ARGUMENT);
    this.name = "FonosInvalidArgument";
  }
}
