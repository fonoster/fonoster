import FonosError from "./error";
import { UNAUTHENTICATED } from "./codes";

export default class extends FonosError {
  constructor(message?: string) {
    super(message, UNAUTHENTICATED);
  }
}
