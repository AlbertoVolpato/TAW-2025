import mongoose, { Document, Schema } from "mongoose";

export interface IAirline extends Document {
  name: string;
  code: string; // IATA code (e.g., 'AZ' for Alitalia)
  country: string;
  logo?: string;
  website?: string;
  contactEmail: string;
  contactPhone?: string;
  isActive: boolean;
  userId: mongoose.Types.ObjectId; // Reference to User with role 'airline'
  createdAt: Date;
  updatedAt: Date;
}

const airlineSchema = new Schema<IAirline>(
  {
    name: {
      type: String,
      required: [true, "Airline name is required"],
      trim: true,
      maxlength: [100, "Airline name cannot exceed 100 characters"],
    },
    code: {
      type: String,
      required: [true, "Airline code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [2, "Airline code must be at least 2 characters"],
      maxlength: [3, "Airline code cannot exceed 3 characters"],
      match: [
        /^[A-Z]{2,3}$/,
        "Airline code must contain only uppercase letters",
      ],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      maxlength: [50, "Country name cannot exceed 50 characters"],
    },
    logo: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "Please enter a valid website URL"],
    },
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    contactPhone: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
airlineSchema.index({ code: 1 });
airlineSchema.index({ country: 1 });
airlineSchema.index({ isActive: 1 });

export const Airline = mongoose.model<IAirline>("Airline", airlineSchema);
