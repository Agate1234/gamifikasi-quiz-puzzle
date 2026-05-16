require("dotenv").config();
const jwt = require("jsonwebtoken");

const payload = {
  id_user: 1,
  email: "admin@email.com",
  id_role: 1,
};

const token = jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: "1d",
});

console.log("SECRET:", process.env.JWT_SECRET);
console.log("TOKEN:", token);
console.log("DECODE:", jwt.decode(token));
console.log("VERIFY:", jwt.verify(token, process.env.JWT_SECRET));