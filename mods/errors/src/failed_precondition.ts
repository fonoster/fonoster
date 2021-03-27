import FonosError from "./error";
import { FAILED_PRECONDITION } from "./codes";

export default class extends FonosError {
  constructor(message?: string) {
    super(message, FAILED_PRECONDITION);
  }
}
