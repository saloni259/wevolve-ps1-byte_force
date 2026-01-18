import mongoose,{Schema} from "mongoose";

const jobSchema = new Schema({
    job_id: {
        type: String,
        required: true
    },
    title: {
       type: String,
       required: true
    },
    required_skills: {
      type: [String],
      required: true
    },
    experience_required: {
       min: { type: Number, required: true },
       max: { type: Number, required: true }
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
     company: {
      type: String,
      required: true,
      trim: true
    },
    salary_range: {
      type: [Number],
      required: true,
      validate: {
         validator: function (value) {
         return (
            Array.isArray(value) &&
            value.length === 2 &&
            value[0] >= 0 &&
            value[1] >= 0 &&
            value[0] <= value[1]
            );
        },
   
       }
    }
    
},{timestamps:true})

export const Job = mongoose.model("Job",jobSchema);