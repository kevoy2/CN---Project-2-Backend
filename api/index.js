const { createClient } = require("@supabase/supabase-js");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message:
    "You have done too many requests. Please wait 10 minutes before trying again.",
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(limiter);

const supabaseUrl = process.env.DB_URL;
const supabaseAnonKey = process.env.DB_API;
const supabaseServiceRole = process.env.SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceRole);

app.post("/save-calculation", async (req, res) => {
  const { x, y, "g-recaptcha-response": recaptchaToken } = req.body;
  try {
    const params = new URLSearchParams({
      secret: "6Ldg-uUqAAAAAHGdzk6b6NW7XSNcBtmh05IJDGAI",
      response: recaptchaToken,
      remoteip: req.ip,
    });

    const captchaResponse = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: params,
      }
    );
    const captchaJson = await captchaResponse.json();
    if (!captchaJson.success) {
      res.status(500).json({
        message: "Failed reCapatcha",
      });
      return;
    }

    const { data, error } = await serviceClient
      .from("calculations")
      .insert({
        n: x,
        y: y,
      })
      .select();

    if (error) throw error;
    res.status(201).json({
      message: "Calculation results saved successfully",
      calculation: "F(" + x + ") = " + y,
    });
  } catch (error) {
    console.error("Error saving calculation results:", error);
    res.status(500).json({
      message: "Error saving calculation",
      error: error.message,
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
