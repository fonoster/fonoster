import { WhiteText } from '@/ui'

const Terms = () => (
  <a
    className="term"
    href="https://learn.fonoster.com/docs/company/terms"
    target="_blank"
    rel="noopener noreferrer"
  >
    Terms
  </a>
)

const Privacy = () => (
  <a
    className="term"
    href="https://learn.fonoster.com/docs/company/privacy"
    target="_blank"
    rel="noopener noreferrer"
  >
    Privacy Policy.
  </a>
)

export const PoliciesOfUse = () => (
  <WhiteText className="my-7">
    By signing, I agree to Fonoster’s <Terms /> and <Privacy />
  </WhiteText>
)
