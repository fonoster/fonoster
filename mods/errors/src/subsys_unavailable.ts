import FonosError from "./error";
import {INTERNAL} from "./codes";

export default class extends FonosError {
  constructor(message?: string) {
    super(message, INTERNAL);
  }
}
