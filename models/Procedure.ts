import { Schema, model, models } from "mongoose";

const procedureSchema = new Schema({
  procedureId: { type: Number, index: true, unique: true },
  name: { type: String, required: true },
  seq: { type: Number, required: true },
  groups: [
    {
      seq: Number,
      groupName: String,
      hideHeader: { type: Boolean, default: false },
      hideGroup: { type: Boolean, default: false },
      fieldName: { type: String },
      inputType: String,
      groupItems: [Number],
    },
  ],
});

const Procedure = models.Procedure || model("Procedure", procedureSchema);

export default Procedure;
