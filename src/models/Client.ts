
import mongoose, { Schema, Model } from "mongoose";

export interface IClient {
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Client: Model<IClient> =
  mongoose.models.Client ||
  mongoose.model<IClient>("Client", ClientSchema);

export default Client;
