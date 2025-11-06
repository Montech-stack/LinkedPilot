import { connectToDatabase } from "@/lib/mongodb"
import bcrypt from "bcrypt"
import User from "@/models/User"

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json()

    if (!username || !email || !password) {
      return new Response("Missing required fields", { status: 400 })
    }

    await connectToDatabase()

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return new Response("User already exists", { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await User.create({
      name: username,
      email,
      password: hashedPassword,
    })

    return new Response(JSON.stringify(newUser), { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
