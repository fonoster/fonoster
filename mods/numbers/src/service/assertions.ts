import {FonosInvalidArgument} from "@fonoster/errors";
import {NumbersPB} from "../client/numbers";

export const assertIsE164 = (number: string) => {
  if (!number) {
    throw new FonosInvalidArgument(
      "e164Number field must be a valid e164 value."
    );
  }
};

export const assertHasAorLinkOrIngressInfo = (
  number: NumbersPB.CreateNumberRequest
) => {
  if (number.getAorLink() && number.getIngressInfo()) {
    throw new FonosInvalidArgument(
      "'webhook' and 'aorLink' are not compatible parameters"
    );
  } else if (!number.getAorLink() && !number.getIngressInfo()) {
    throw new FonosInvalidArgument(
      "You must provider either an 'webhook' or and 'aorLink'"
    );
  }
};
