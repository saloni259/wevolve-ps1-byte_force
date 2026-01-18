import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { normalizeArray } from "../utils/normalizeArray.js";
import { Job } from "../models/job.models.js"

const addJob = asyncHandler(async (req, res) => {
  const {
    job_id,
    title,
    required_skills,
    experience_min,
    experience_max,
    location,
    company,
    salary_range
  } = req.body;

  if (
    !job_id ||
    !title ||
    !required_skills ||
    experience_min === undefined ||
    experience_max === undefined ||
    !location ||
    !company ||
    !salary_range
  ) {
    throw new apiError(400, "All fields are required in the provided JSON format")
  }

  const existingJob = await Job.findOne({
    $and: [
      { job_id },
      { title },
      { company },
      { location },
      { "experience_required.min": experience_min },
      { "experience_required.max": experience_max }
    ]
  });


  if (existingJob) {
    throw new apiError(400, "Job already exist");
  }

  const mini = Number(experience_min);
  const maxi = Number(experience_max);


  if (Number.isNaN(mini) || mini < 0 || Number.isNaN(maxi) || maxi < 0) {
    throw new apiError(404, "Experience can not be negative")
  }





  const required_skillsArray = normalizeArray(required_skills);
  const salary_rangeArray = normalizeArray(salary_range);

  if (salary_rangeArray.length !== 2) {
    throw new apiError(404, "Salary range must contain exactly two values [min, max]")
  }

  const minSalary = Number(salary_rangeArray[0]);
  const maxSalary = Number(salary_rangeArray[1]);

  if (
    Number.isNaN(minSalary) ||
    Number.isNaN(maxSalary)
  ) {
    throw new apiError(401, "Salary range values must be numbers")
  }

  if (minSalary < 0 || maxSalary < 0) {
    throw new apiError(403, "Salary values cannot be negative")
  }


  if (minSalary >= maxSalary) {
    throw new apiError(404, "Minimum salary cannot be greater than maximum salary")
  }
  const job = await Job.create({
    job_id,
    title,
    required_skills: required_skillsArray,
    experience_required: {
      min: experience_min,
      max: experience_max
    },
    location,
    company,
    salary_range: salary_rangeArray
  });

  const ispresent = await Job.findById(job?._id)

  if (!ispresent) {
    throw new apiError(500, "Opps !!!! Problem in adding job")
  }

  return res.status(200).json(
    new apiResponse(200, ispresent, "Job added successfully")
  )
})


export { addJob }