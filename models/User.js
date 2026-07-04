import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["seller", "regulator", "admin"], default: "seller" },
    // e.g. a seller checking their own listings vs a regulator/admin viewing everyone's history
  },
  { timestamps: true }
);

// Instance method to verify a plaintext password against the stored hash
UserSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

export default mongoose.model("User", UserSchema);
