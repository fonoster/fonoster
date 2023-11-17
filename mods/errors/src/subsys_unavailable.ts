import FonosterError from "./error";
import { INTERNAL } from "./codes";

export default class extends FonosterError {
  constructor(message?: string) {
    super(message, INTERNAL);
  }
}
