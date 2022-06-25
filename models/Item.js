import { Schema, model, models } from "mongoose";

const itemSchema = new Schema({
  itemId: { type: Number, index: true, unique: true, required: true },
  procedureName: { type: String, required: true },
  procedureId: { type: Number, required: true },
  groupName: { type: String, required: true },
  fieldName: { type: String, default: null },
  value: { type: String, default: null },
  isCustom: { type: Boolean, required: true },
  fieldAbbr: String,
  valuePrefix: String,
  valueSuffix: String,
});

const Item = models.Item || model("Item", itemSchema);

export default Item;
