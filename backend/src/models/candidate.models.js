import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const educationSchema = new Schema({
    degree: {
        type: String,
        required: true,
        trim: true
    },
    field: {
        type: String,
        required: true,
        trim: true
    },
    cgpa: {
        type: Number,
        required: true,
        min: 0,
        max: 10
    }
}, { _id: false })

const requirmentSchema = new Schema({
    skills: {
        type: [String],
        required: true
    },
    experience_years: {
        type: Number,
        required: true,
        min: 0
    },

    preferred_locations: {
        type: [String],
        required: true
    },

    preferred_roles: {
        type: [String],
        required: true
    },

    expected_salary: {
        type: Number,
        required: true,
        min: 0
    },

    education: {
        type: educationSchema,
        required: true
    }
}, { _id: false })

const candidateSchema = new Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // profile: {
    //     type: String
    // },
    // profile_id: {
    //     type: String
    // },
    refreshToken: {
        type: String
    },

    requirment: {
        type: requirmentSchema,
        required: true
    }


}, { timestamps: true })


candidateSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});


candidateSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

candidateSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,

        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}


candidateSchema.methods.generateRefreshToken = async function () {
    return jwt.sign(
        {
            _id: this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}





export const Candidate = mongoose.model("Candidate", candidateSchema)