import FonosterError from "./error";
import { UNAUTHENTICATED } from "./codes";

export default class extends FonosterError {
  constructor(message?: string) {
    super(message, UNAUTHENTICATED);
  }
}
