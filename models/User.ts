import { Schema, model, models } from "mongoose";

const userSchema = new Schema({
  fullname: { type: String, lowercase: true },
  username: { type: String, lowercase: true, unique: true },
  userId: { type: Number, index: true, unique: true },
  password: { type: String, lowercase: true },
  role: { type: String, default: "user", lowercase: true },
  isAvailable: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
});

const User = models.User || model("User", userSchema);

export default User;
