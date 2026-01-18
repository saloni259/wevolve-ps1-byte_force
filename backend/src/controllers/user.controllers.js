import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { normalizeArray } from "../utils/normalizeArray.js";
import { Candidate } from "../models/candidate.models.js";
import { Job } from "../models/job.models.js";
import { Match } from "../models/match.models.js";


const generateRefreshAccessToken = async (userId) => {
  try {
    const user = await Candidate.findById(userId);
    if (!user) {
      throw new apiError(500, "User not fount")
    }
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    return { refreshToken, accessToken }

  } catch (error) {
    throw new apiError(500, "Something went wrong")
  }
}


const WEIGHTS = {
  skill: 0.40,
  location: 0.20,
  salary: 0.15,
  experience: 0.15,
  role: 0.10
};


const registerUser = asyncHandler(async (req, res) => {
  const {
      fullname,
      email,
      password,
      profile,
      skills,
      experience_years,
      degree,
      field,
      cgpa,
      preferred_locations,
      preferred_roles,
      expected_salary
    } = req.body;


  if (
      !fullname ||
      !email ||
      !password ||
      !skills ||
      !degree ||
      !cgpa ||
      experience_years === undefined||
      !preferred_locations ||
      !preferred_roles||
      !expected_salary
    )  {
    throw new apiError(400, "required field missing")
  }
  

  if (!(email === email.toLowerCase()) || !email.includes("@")) {
    throw new apiError(403, "Invalid email..")
  }


  const cgpaNum = Number(cgpa);
  const expectedSalaryNum = Number(expected_salary);

  if (Number.isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
    throw new apiError(404, "CGPA must be between 0 and 10")
  }

  if (Number.isNaN(expectedSalaryNum) || expectedSalaryNum < 0) {
    throw new apiError(405, "Expected salary must be a non-negative number")
  }

  const sameemailexist = await Candidate.findOne({ email });

  if (sameemailexist) {
    throw new apiError(403, "Email already registered");
  }

  const skillsArray = normalizeArray(skills);
  const preferred_locationsArray = normalizeArray(preferred_locations);
  const preferred_rolesArray = normalizeArray(preferred_roles);

  const finalRequirment = {
    skills: skillsArray,
    experience_years: experience_years,
    preferred_locations: preferred_locationsArray,
    preferred_roles: preferred_rolesArray,
    expected_salary: expectedSalaryNum,
    education: {
      degree: degree,
      field: field,
      cgpa: cgpaNum
    }
  };

  const user = await Candidate.create({
    fullname,
    email,
    password,
    requirment: finalRequirment
  });

  const ispresent = await Candidate.findById(user?._id).select("-password -refreshToken")

  if (!ispresent) {
    throw new apiError(500, "Opps !!!! Registration failed....Try again")
  }
  const { refreshToken, accessToken } = await generateRefreshAccessToken(user._id)

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(200, ispresent, "registration Successfully...")
    )

})

const checkMatch = asyncHandler(async (req, res) => {
  const { job_id } = req.body;

  const present = await Match.findOne({ job_id: job_id })
  if (present) {
    return res.status(200).json(
      new apiResponse(200, present, "Match already present....")
    )
  }

  const job = await Job.findOne({ job_id: job_id });
  const candidate = await Candidate.findById(req.user._id);

  if (!candidate || !job) {
    throw new apiError(404, "Candidate or Job not found");
  }

  const reqData = candidate.requirment;

  // skills
  const candidateSkills = new Set(reqData.skills || []);
  const jobSkills = new Set(job.required_skills || []);

  let skillMatch = 0;
  let missingSkills = [];

  if (jobSkills.size > 0) {
    const matched = [...jobSkills].filter(skill =>
      candidateSkills.has(skill)
    );
    skillMatch = (matched.length / jobSkills.size) * 100;
    missingSkills = [...jobSkills].filter(
      skill => !candidateSkills.has(skill)
    );
  }

  // location
  const locationMatch = reqData.preferred_locations.includes(job.location)
    ? 100
    : 0;

  // salary
  let salaryMatch = 0;
  if (reqData.expected_salary > 0 && job.salary_range?.length === 2) {
    const [minSalary, maxSalary] = job.salary_range;
    const expectedSalary = reqData.expected_salary;

    if (expectedSalary < minSalary) salaryMatch = 0;
    else if (expectedSalary > maxSalary) salaryMatch = 100;
    else {
      const avgSalary = (minSalary + maxSalary) / 2;
      salaryMatch = Math.min(
        100,
        Math.max(0, (avgSalary / expectedSalary) * 100)
      );
    }
  }

  // experience
  const experienceMatch =
    reqData.experience_years >= job.experience_required.min &&
      reqData.experience_years <= job.experience_required.max
      ? 100
      : 0;

  // role
  const roleMatch = reqData.preferred_roles.includes(job.title)
    ? 100
    : 0;

  // final score
  const finalScore =
    skillMatch * WEIGHTS.skill +
    locationMatch * WEIGHTS.location +
    salaryMatch * WEIGHTS.salary +
    experienceMatch * WEIGHTS.experience +
    roleMatch * WEIGHTS.role;

  const recommendationReason =
    skillMatch >= 60
      ? `Strong skill alignment with ${jobSkills.size - missingSkills.length
      }/${jobSkills.size} matching skills.`
      : "Partial match based on skills and preferences.";

  const match = await Match.create({
    email: candidate.email,
    job_id: job_id,
    match_score: Number(finalScore.toFixed(2)),
    breakdown: {
      skill_match: skillMatch,
      location_match: locationMatch,
      salary_match: salaryMatch,
      experience_match: experienceMatch,
      role_match: roleMatch
    },
    missing_skills: missingSkills,
    recommendation_reason: recommendationReason
  });

  return res.status(200).json(
    new apiResponse(200, match, "Match calculated successfully")
  );
});


const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new apiError(400, "Email is required")
  }
  if (!password) {
    throw new apiError(401, "Password is required")
  }
  if (!(email === email.toLowerCase()) || !email.includes("@")) {
    throw new apiError(403, "Invalid email..")
  }
  //console.log(email);
  const user = await Candidate.findOne({ email: email });
  //console.log(user);
  //const users = await User.find({});
  //console.log("TOTAL USERS:", users.length);

  if (!user) {
    throw new apiError(404, "No account exist with this mail")
  }
  const validpassword = await user.isPasswordCorrect(password);

  if (!validpassword) {
    throw new apiError(405, "Password is not correct")
  }
  const { refreshToken, accessToken } = await generateRefreshAccessToken(user._id)


  const options = {
    httpOnly: true,
    secure: true
  }

  const newuser = await Candidate.findById(user._id).select("-password -refreshToken")
  return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(200, {
        User: newuser, refreshToken, accessToken
      }, "Login successfully....")
    )
})

const updateCandidate = asyncHandler(async (req, res) => {
   const allowedFields = [
    "fullname",
    "email",
    "skills",
    "experience_years",
    "preferred_locations",
    "preferred_roles",
    "expected_salary",
    "degree",
    "field",
    "cgpa"
  ];

  const isAllFieldsEmpty = allowedFields.every(
    field => req.body[field] === undefined
  );

  if (isAllFieldsEmpty) {
    throw new apiError(400, "No update fields provided");
  }

  

  await Match.deleteMany({ email: req.user.email })

  const candidate = await Candidate.findById(req.user._id);

  if (!candidate) {
    throw new apiError(404, "Candidate not found");
  }

  if (req.body.fullname) {
    candidate.fullname = req.body.fullname;
  }

  if (req.body.email) {
    candidate.email = req.body.email;
  }

  
  const reqData = candidate.requirment;

  if (req.body.skills) {
    const skillsArray = normalizeArray(req.body.skills)
    reqData.skills = skillsArray;
  }

  if (req.body.experience_years !== undefined) {
    reqData.experience_years = Number(req.body.experience_years);
  }

  if (req.body.preferred_locations) {
    const preferred_locationsArray = normalizeArray(req.body.preferred_locations)
    reqData.preferred_locations = preferred_locationsArray;
  }

  if (req.body.preferred_roles) {
    const preferred_rolesArray = normalizeArray(req.body.preferred_roles)
    reqData.preferred_roles = preferred_rolesArray;
  }

  if (req.body.expected_salary !== undefined) {
    const salary = Number(req.body.expected_salary);
    if (salary < 0) {
      throw new apiError(400, "Expected salary cannot be negative");
    }
    reqData.expected_salary = salary;
  }

 
  if (req.body.degree) {
    reqData.education.degree = req.body.degree;
  }

  if (req.body.field) {
    reqData.education.field = req.body.field;
  }

  if (req.body.cgpa !== undefined) {
    const cgpa = Number(req.body.cgpa);
    if (cgpa < 0 || cgpa > 10) {
      throw new apiError(400, "CGPA must be between 0 and 10");
    }
    reqData.education.cgpa = cgpa;
  }

  
  await candidate.save();

  return res.status(200).json(
    new apiResponse(200, candidate, "Candidate updated successfully")
  );
});

const logoutUser = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    return res.status(401).json(
      new apiResponse(401, {}, "Unauthorized request")
    );
  }

  await Candidate.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 }
    }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
      new apiResponse(200, {}, "Logout successful")
    );
});



export { registerUser, checkMatch, loginUser, logoutUser, updateCandidate }

