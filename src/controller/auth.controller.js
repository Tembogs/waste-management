import * as authServices from "../services/auth.services.js";

export const register = async (req, res) => {
  const { name, email, password, phoneNumber, role, location, gender } = req.body;

  const user = await authServices.register(name, email, password, phoneNumber, role, location, gender);

  if (!user) {
    return res.status(400).json({ message: "Invalid credentials, could not register" });
  }

  res.status(201).json(user);
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authServices.login(email, password);

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    res.status(200).json(result); // contains { user, token }
  } catch (error) {
    console.log("login error", error);
    res.status(500).json({ message: "internal server error" });
  }
};
