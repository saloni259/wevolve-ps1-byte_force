import mongoose, { Schema } from "mongoose";

const breakdownSchema = new Schema(
  {
    skill_match: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    location_match: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    salary_match: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    experience_match: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    role_match: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  },
  { _id: false }
);

const matchSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },

    job_id: {
      type: String,
      required: true
    },

    match_score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    breakdown: {
      type: breakdownSchema,
      required: true
    },

    missing_skills: {
      type: [String],
      default: []
    },

    recommendation_reason: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export const Match = mongoose.model("Match", matchSchema);
