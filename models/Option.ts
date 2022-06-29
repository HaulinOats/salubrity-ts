import { Schema, model, models } from "mongoose";

const optionSchema = new Schema({
  optionId: { type: Number, required: true },
  name: String,
  inputType: String,
  callFieldName: { type: String, index: true, unique: true },
  options: {
    type: [Object],
    default: () => {
      return null;
    },
  },
});

const Option = models.Option || model("Option", optionSchema);

export default Option;
