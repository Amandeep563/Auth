import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Otp } from "../models/otp.models.js";
import { User } from "../models/user.model.js";
import { sendEmail } from "../utils/sendEmail.js";
//zod schema for validation
const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

const registerUser = async (req, res) => {
  try {
    //validate req body
    const parsedData = registerSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res
        .status(400)
        .json({ message: "Invalid input", errors: parsedData.error.errors });
    }

    const { username, email, password } = parsedData.data;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "user already exists with this email" });
    }

    //TODO: add hash password and send verification email
    //hash the password
    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashPassword });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // const verifyLink = `http://localhost:3000/api/auth/verify-email/${token}`;

    // await sendEmail(
    //   newUser.email,
    //   "Verify your account",
    //   `<h2>Hello ${newUser.username},</h2>
    //     <p>Please click below to verify your account:</p>
    //     <a href="${verifyLink}">${verifyLink}</a>`
    // );

    //gen otp
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    //hash otp before saving
    const otpHash = await bcrypt.hash(otp, 10);

    //save otp in db
    await Otp.create({
      userId: newUser._id,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    //send OTP in email
    await sendEmail(
      newUser.email,
      "Verify your Account",
      `<h2>Hello ${newUser.username},</h2>
       <p>Your verification OTP is: <b>${otp}</b></p>
       <p>This OTP will expire in 5 minutes.</p>`
    );
    await res.status(201).json({
      message: "User registered succesfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error" });
  }
};

// const verifyEmail = async (req, res) => {
//   const { token } = req.params;
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.userId);

//     if (!user) {
//       return res.status(400).json({ message: "User not found" });
//     }

//     user.isVerified = true;
//     await user.save();

//     res.json({ message: "email verified successfully! you can now login" });
//   } catch (error) {
//     res.status(500).json({ message: "Invalid or expired token" });
//   }
// };

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    //find otp
    const otpFind = await Otp.findOne({ userId: user._id });
    if (!otpFind) {
      return res
        .status(400)
        .json({ message: "No Otp found, please request again" });
    }

    //check expiry
    if (otpFind.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ message: "Otp expired, please request new one" });
    }

    //compare hashed OTP
    const isMatch = await bcrypt.compare(otp, otpFind.otpHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    //Mark user verified
    user.isVerified = true;
    await user.save();

    //after delete that otp
    await Otp.deleteOne({ _id: otpFind._id });

    res.json({ message: "Otp verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email first" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      user: { username: user.username, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "logged out Successfully" });
};

export { loginUser, logout, registerUser, verifyOtp };
