import mongoose, { Schema, HydratedDocument, Model } from "mongoose";
import { HmacSHA1 } from "crypto-js";

const userShema = new mongoose.Schema(
  {
    userName: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      max: 32,
    },
    firstName: {
      type: String,
      trim: true,
      required: false,
      max: 32,
    },
    lastName: {
      type: String,
      trim: true,
      required: false,
      max: 32,
    },
    email: {
      type: String,
      trim: true,
      required: false,
      unique: false,
      lowercase: true,
    },
    hashed_password: {
      type: String,
      required: true,
    },
    salt: String,
    roles: [],
  },
  { timestamps: true }
);

userShema
  .virtual("password")
  .set(function (password: string) {
    (this as any)._password = password;
    this.salt = (this as any).makeSalt();
    this.hashed_password = (this as any).encryptPassword(password);
  })
  .get(function () {
    return (this as any)._password;
  });

// methods
userShema.methods = {
  authenticate: function (plainText: string) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },
  encryptPassword: function (password: string) {
    if (!password) return "";
    return HmacSHA1(password, this.salt).toString();
  },
  makeSalt: function () {
    return (
      Math.round(
        new Date().valueOf() * Math.random() * Math.random() * 1000000000
      ) + ""
    );
  },
};

const User = mongoose.model("User", userShema);
export type UserDocument = typeof User;
export default User;
