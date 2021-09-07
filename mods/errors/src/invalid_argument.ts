import FonosError from "./error";
import {INVALID_ARGUMENT} from "./codes";

export default class extends FonosError {
  constructor(message?: string) {
    super(message, INVALID_ARGUMENT);
    this.name = "FonosInvalidArgument";
  }
}
