import Admin from "../models/Admin";
import Doctor from "../models/Doctor";
import Patient from "../models/Patient";

export const DuplicateUsername = async (v: string) => {
  const admin: Document | null = await Admin.findOne({ userName: v });
  const doctor: Document | null = await Doctor.findOne({ userName: v });
  const patient: Document | null = await Patient.findOne({ userName: v });
  const noDuplicateUsername =
    admin == null && doctor == null && patient == null;
  return noDuplicateUsername; // If user exists, validation fails
};

// export default DuplicateUsername;
