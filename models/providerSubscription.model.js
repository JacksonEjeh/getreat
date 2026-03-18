import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    plan: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },

    status: {
      type: String,
      enum: ["active", "cancelled", "expired"],
      default: "active",
    },

    start_date: {
      type: Date,
      default: Date.now,
    },

    end_date: {
      type: Date, // for paid plans later
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* -------------------- PREVENT DUPLICATE SUBSCRIPTIONS -------------------- */
subscriptionSchema.index({ patient: 1, provider: 1 }, { unique: true });

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;