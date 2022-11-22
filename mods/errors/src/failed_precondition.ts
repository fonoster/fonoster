import FonosterError from "./error";
import { FAILED_PRECONDITION } from "./codes";

export default class extends FonosterError {
  constructor(message?: string) {
    super(message, FAILED_PRECONDITION);
  }
}
