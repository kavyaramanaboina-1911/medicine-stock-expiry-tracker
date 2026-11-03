
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Admin = require("./Models/Admin");

const admins = [
  {
    name: "kavya",
    email: "kavya1911@gmail.com",
    password: "Kavya"
  },
  {
    name: "vani",
    email: "vani3842@gmail.com",
    password: "Vani"
  },
  {
    name: "samy",
    email: "samy1667@gmail.com",
    password: "Samy"
  }
];

async function createAdmins() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Delete previous sample admin accounts
    await Admin.deleteMany({
      email: {
        $in: [
          "kavya1911@gmail.com",
          "vani3842@gmail.com",
          "samy1667@gmail.com"
        ]
      }
    });

    // Create or update the three admin accounts
    for (const item of admins) {
      const hashedPassword = await bcrypt.hash(
        item.password,
        12
      );

      await Admin.findOneAndUpdate(
        { email: item.email.toLowerCase() },
        {
          name: item.name,
          email: item.email.toLowerCase(),
          password: hashedPassword,
          role: "Administrator"
        },
        {
          upsert: true,
          new: true,
          runValidators: true
        }
      );

      console.log("Admin saved:", item.email);
    }

    console.log("All 3 admin accounts created successfully!");

  } catch (error) {
    console.error("Admin creation failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmins();
