import * as Yup from "yup";

export const moneySchema = () => Yup.object({
  amount: Yup.number().required(),
  currency: Yup.string().oneOf(["USD"]).required()
});