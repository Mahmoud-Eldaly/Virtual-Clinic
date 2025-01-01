import Doctor from "../models/Doctor";

const PDFDocument = require("pdfkit");
const fs = require("fs");

export const generateContract = async (doctorId: string) => {
  // Create a new PDF document
  const doc = new PDFDocument();

  const doctor = await Doctor.findById(doctorId);

  // Define the output path for the generated contract
  const filePath = `./contracts/${doctor?.userName}_contract.pdf`;

  // Pipe the document to a file
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  // Title
  doc.fontSize(20).text("Employment Contract", { align: "center" });
  doc.moveDown();

  // Employee Details
  doc.fontSize(12).text(`Employee Name: ${doctor?.name}`);
  doc.text(`User Name: ${doctor?.userName}`);
  doc.text(`Birth Date: ${doctor?.birthDate}`);
  doc.text(`Email: ${doctor?.email}`);
  doc.text(`Affilation: ${doctor?.affiliation}`);
  doc.text(`Educational Background: ${doctor?.educationalBackground}`);
  doc.text(`Hourly Rate: ${doctor?.hourlyRate}`);
  doc.moveDown();

  // Contract Body
  doc.text(
    "This contract is entered into by the above doctor and Virtual C. The terms and conditions of employment are detailed below:"
  );
  doc.moveDown();
  doc.text("1. Term of Employment...");
  doc.text("2. Salary and Benefits...");
  doc.text("3. Duties and Responsibilities...");
  doc.text("4. Confidentiality and Non-Disclosure...");
  doc.text("5. Termination...");
  doc.moveDown();

  // Signature line
  //   doc.text("___________________________", { align: "left" });
  //   doc.text("Signature", { align: "left" });

  // Finalize the document
  doc.end();


  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => {
      console.log("PDF file successfully created.");
      resolve(filePath); // Resolve the file path once done
      return filePath
    });
    writeStream.on('error', (error: any) => {
      console.error("Error writing PDF file:", error);
      reject(error);
    });
  });
};
