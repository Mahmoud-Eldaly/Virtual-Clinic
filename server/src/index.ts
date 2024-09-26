// import express from 'express';
import express from "express";
import { connect } from "./config/database";
const app = express();

app.get("/", (req, res) => {
  console.log("get slasha");
});

app.listen(5000, async () => {
  await connect();
  console.log("listening at 5000");
});
