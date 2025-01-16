# Virtual-Clinic

## Motivation
This project meant to be a full stack project for the purpose of practicing a real life application that can be used in the healthcare field digitizing many aspect of it and give the users (patients or doctors) the best experience to get or offer the medical services. up till now, it's only the backend + database parts were implemented and tested. it's planned to continue the frontend in later time.

## Build Status
The project backend part is complete as of January 2025. Unit tests could be added for stress testing.
## Code Style
The project was built with node, express and Mongo DB. The server side was divided into routes, controllers, and middlewares to serve all the client requests. Prettier was used for formatting all the files. Most of the code was written in camelCase. Server routes were written using kebab-case.

## Tech Stack
**Server:** Node, Express

**Database:** MongoDB

## Code Examples
<details>
<summary>Server</summary>
Our backend is composed of routes that connect to controllers where all the logic is handled.

This is an example of one of the routers:

```javascript
import {
  addFamilyMembers,
  addMyMedicalHistoryItems,
  getMyData,
  removeMyMedicalHistoryItem,
  subscribeForPackage,
  viewFamilyMembers,
  viewMyMedicalHistoryItems,
  viewMyWallet,
} from "../../controllers/PatientController";
import express, { Request, Response, NextFunction } from "express";
import authenticateToken from "../../middlewares/Authentication";
import verifyPatient from "../../middlewares/PatientMW";
import { changeMyPassword } from "../../controllers/UserDataController";
import { viewDoctorAvailableSlots } from "../../controllers/DoctorController";
import {
  addAppointment,
  getFilteredAppointments,
  updateAppointment,
} from "../../controllers/AppointmentController";
import { viewPackages } from "../../controllers/PackageController";
import {
  pay_appointment,
  pay_package,
} from "../../controllers/PaymentController";
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });
const PatientRouter = express.Router();

PatientRouter.use(authenticateToken, verifyPatient);
PatientRouter.put(
  "/add-medical-history-items",
  upload.fields([{ name: "medicalHistoryItems", maxCount: 10 }]),
  (req, res) => addMyMedicalHistoryItems(req, res)
);
PatientRouter.get("/view-medical-history-items", (req, res) =>
  viewMyMedicalHistoryItems(req, res)
);
PatientRouter.get("/view-wallet", (req, res) => viewMyWallet(req, res));
PatientRouter.get("/view-doctor-slots/:id", (req, res) =>
  viewDoctorAvailableSlots(req, res)
);
PatientRouter.put("/remove-medical-history-item", (req, res) =>
  removeMyMedicalHistoryItem(req, res)
);
PatientRouter.put("/change-password", (req, res) => changeMyPassword(req, res));

PatientRouter.post("/add-family-members", (req, res) =>
  addFamilyMembers(req, res)
);

PatientRouter.get("/view-family-members", (req, res) =>
  viewFamilyMembers(req, res)
);

PatientRouter.get("/filtered-appointments", (req, res) =>
  getFilteredAppointments(req, res)
);

PatientRouter.get("/view-packages", (req, res) => viewPackages(req, res));

PatientRouter.post("/pay-package", (req, res) => pay_package(req, res));

PatientRouter.post("/pay-reserve-appiontment", (req, res) =>
  pay_appointment(req, res)
);

PatientRouter.post("/add-appointment", (req, res) => addAppointment(req, res));

PatientRouter.put("/update-appointment", (req, res) =>
  updateAppointment(req, res)
);

PatientRouter.get("/my-data", (req, res) => getMyData(req, res));

PatientRouter.put("/subscribe-to-package", (req, res) =>
  subscribeForPackage(req, res)
);

export default PatientRouter;
```
Here is an example of a controller function (doctor adds his new free available slots):
```javascript
export const addTimeSlots: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  try {
    const slots: Array<Date> = req.body.slots;
    const oldDoctor = await Doctor.findById(
      req.user?.id,
      "approved employmentContractAccepted"
    );
    if (!oldDoctor?.approved || !oldDoctor?.employmentContractAccepted)
      return res
        .status(403)
        .json({ message: "You are not allowed to add slots Yet" });
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.user?.id,
      {
        $push: {
          availableSlots: {
            $each: [...slots],
          },
        },
      },
      { new: true, runValidators: true }
    );
    return res.status(200).json(updatedDoctor?.availableSlots);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};
```
All our routers pass through an authentication middleware for logged in users:
```javascript
const jwt = require("jsonwebtoken");
const { login } = require("../controllers/UserDataController");
import { Request, Response, NextFunction } from "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: { [key: string]: any };
  }
}

const authenticateToken: (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any> = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.cookies?.jwt && req.cookies?.accessToken) {
      const accessToken = req.cookies.accessToken;
      const refreshToken = req.cookies.jwt;
      let validAccess = false,
        validRefresh = false;
      let data = {};
      jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET,
        (err: Error, decoded: { [key: string]: any }) => {
          if (err) {
            // Wrong or expired access token
            console.log(err.message);
            return res.status(401).json({ message: err.message });
          } else {
            validAccess = true;
            data = decoded;
           // console.log("decoded:", decoded);
          }
        }
      );
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err: Error, decoded: { [key: string]: any }) => {
          if (err) {
            // Wrong or expired refresh token
            return res
              .status(401)
              .json({ message: "Unauthorized,expired refresh" });
          } else {
            validRefresh = true;
          }
        }
      );

      if (validAccess && validRefresh) {
        req.user = data;
        const now = Math.floor(new Date().getTime() / 1000);
        const newAccessToken = jwt.sign(
          { ...data, exp: now + 60 * 120 },
          process.env.ACCESS_TOKEN_SECRET
        );

        res.cookie("accessToken", `${newAccessToken}`);

        return next();
      } else {
        return res
          .status(401)
          .json({ message: "Unauthorized, some cookies are expired" });
      }
    } else {
      return res
        .status(401)
        .json({ message: "Unauthorized, some cookies are missing" });
    }
  } catch (err) {
    if (!res.headersSent)
      return res.status(401).json({ message: "Unauthorized, Can Not Verify" });
  }
};
export default authenticateToken;
```
</details>



## Installation
1) Clone the repository       
```bash
  git clone https://github.com/Mahmoud-Eldaly/Virtual-Clinic.git
```
2) Install NPM packages in server
```bash
  cd ./Virtual-Clinic/server
  npm install --force
  ```

## API Reference

The API routes are divided into 4 groups.

Note: All endpoints were tested using postman to ensure correct response bodies were returned.

<details>
<summary>User Data</summary>

**Allow the user to access the functionalities offered to his type**

```http
POST/login
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Guests

Request Body
```json
{
    "userName":"user11",
    "password":"Aa20@30Aa"
}
```

Response
```json
{
    "type": "patient",
    "userName": "user11"
}
```

**Allow the user to logout from site**

```http
GET/logout
```

Parameters: None.

**Accessible by:** Admins, Patients, Doctors

Response
```json
{
    "message": "Successfully logged out"
}
```

**Change password of user's account**

```http
PUT/change-password
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Admins, Patients, Doctors

Request Body
```json
{
    "oldPassword":"Aa20@30Aa",
    "newPassword":"Aa20@30Bb"
}
```

Response
```json
{
    "message": "updated password successfully"
}
```
**User got verified by email insted of forgotten password**

```http
POST/forget-password
```
Parameters: None.

**Accessible by:** Guests

Request Body
```json
{
    "userName":"user20"
}
```

Response
```json
{
    "message": "verification email was sent successfully"
}
```


**Reset the forgetten password after being verified**

```http
Put/reset-password
```
Path Parameters
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `userName` | `string` | **Required**. Holds the account username of changing password.|
| `token` | `string` | **Required**. Holds the verification token send via email.|

**Accessible by:** Guests

Request Body
```json
{
    "newPassword":"Aa20@30Aa"
}
```

Response
```json
{
    "message": "token verified successfully and password updated!"
}
```

**New user signup as patient or doctor**

```http
POST/signup
```
**Accessible by:** Guests

Request Body for Doctors
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `name` | `string` | **Required**. Holds the Doctor's name.|
| `userName` | `string` | **Required**. Holds the Doctor's userName.|
| `medicalDegree` | `file` | **Required**. Holds the Doctor's medical Degree photo.|
| `nationalID` | `file` | **Required**. Holds the Doctor's national ID photo.|
| `medicalLicence` | `file` | **Required**. Holds the Doctor's medical licence photo.|
| `email` | `string` | **Required**. Holds the Doctor's email.|
| `password` | `string` | **Required**. Holds the Doctor's password.|
| `type` | `string` | **Required**. Must be "doctor".|
| `educationalBackground` | `string` | **Required**. Holds the Doctor's educational background.|
| `affiliation` | `string` | **Required**. Holds the Doctor's specialization.|
| `hourlyRate` | `string` | **Required**. Holds the Doctor's appointment price.|
| `birthDate` | `string` | **Required**. Holds the Doctor's Birthday.|

Response for Doctor
```json
{
    "name": "dname",
    "userName": "dusername",
    "email": "ddd@gmail.com",
    "password": "$2a$08$lUM1VQqppXBrIvbexXFoVO4vHT1Kgysa3ygfg1iSOA4prWBEmkqhG",
    "birthDate": "2004-12-31T00:00:00.000Z",
    "hourlyRate": 14.3,
    "affiliation": "bones and blood",
    "educationalBackground": "some edu bg",
    "nationalID": {
            "data": {
                "type": "Buffer",
                "data": [137, 80, 78, 71, ...]  // Array of byte values representing the file
            },
            "contentType": "image/jpeg"
        },
    "medicalDegree": {
            "data": {
                "type": "Buffer",
                "data": [137, 80, 78, 71, ...]  // Array of byte values representing the file
            },
            "contentType": "image/jpeg"
        },
    "medicalLicence": {
            "data": {
                "type": "Buffer",
                "data": [137, 80, 78, 71, ...]  // Array of byte values representing the file
            },
            "contentType": "image/jpeg"
        },
    "approved": false,
    "employmentContractAccepted": false,
    "availableSlots": [],
    "wallet": 0,
    "_id": "6783dae8593e87e2a25298eb",
    "__v": 0
}
```
Request Body for Patients
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `name` | `string` | **Required**. Holds the Patient's name.|
| `userName` | `string` | **Required**. Holds the Patient's userName.|
| `email` | `string` | **Required**. Holds the Patient's email.|
| `password` | `string` | **Required**. Holds the Patient's password.|
| `type` | `string` | **Optional**. can be "patient", it's "patient" by default.|
| `birthDate` | `string` | **Required**. Holds the Patient's Birthday.|
| `gender` | `string` | **Required**. Holds the Patient's gender "male" or "female".|
| `emergencyMobileNumber` | `string` | **Required**. Holds the mobile number that should be called in case of emergency.|
| `emergencyName` | `string` | **Required**. Holds the name of person to call in emergency.|
| `mobileNumer` | `string` | **Required**. Holds the Patient's mobile number.|

Response for Patient
```json
{
    "name": "pname",
    "userName": "puser",
    "email": "pemail@gmail.com",
    "password": "$2a$08$2AvmATShsGZcGQbZwV013.lwC4F36kq2d4Qu0dcbakR4pZrqXfnhe",
    "birthDate": "2020-12-15T00:00:00.000Z",
    "gender": "female",
    "mobileNumer": "04525632",
    "emergencyName": "emememe",
    "emergencyMobileNumber": "01256325",
    "wallet": 0,
    "_id": "678447cec809cab355b34048",
    "familyMembers": [],
    "medicalHistoryItems": [],
    "__v": 0
}
```



</details>

<details>
<summary>Patient</summary>

**Upload medical history items/files**

```http
PUT/add-medical-history-items
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Patient

Request Body

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `medicalHistoryItems` | `file[]` | **Required**. Uploaded medical history items.|


Response
```json
{
    "currentItemsNames": [
        "s9.PNG",
        "TUD calender.JPG",
        "summary app.JPG"
    ]
}
```
**view my medical history items**

```http
GET/view-medical-history-items
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Patient

Response
```json
{
    "_id": "66fc076518982fc6e480aceb",
    "medicalHistoryItems": [
        {
            "buffer": {
                "type": "Buffer",
                "data": [137, 80, 78, 71, ...]  // Array of byte values representing the file
            },
            "mimetype": "image/png",
                "originalname": "s9.PNG",
                "_id": "6712026a7b71da361f7f9377"
        },
        {
            "buffer": {
                "type": "Buffer",
                "data": [137, 80, 78, 71, ...]  // Array of byte values representing the file
            },
            "mimetype": "image/png",
                "originalname": "TUD calender.JPG",
                "_id": "6712026a7b71da361f7f9597"
        },
        {
            "buffer": {
                "type": "Buffer",
                "data": [137, 80, 78, 71, ...]  // Array of byte values representing the file
            },
            "mimetype": "image/png",
                "originalname": "summary app.JPG",
                "_id": "6712026a7b71da361f7f7852"
        }
  ]
}
```
**view my wallet money**

```http
GET/view-wallet
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Patient

Response
```json
{
    "_id": "66fc076518982fc6e480aceb",
    "wallet": 0
}
```

**view the free slots of a doctor**

```http
GET/view-doctor-slots/:id
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

Path Parameters
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `string` | **Required**. Holds the doctor offering these slots.|

**Accessible by:** Patient

Response
```json
{
    "_id": "66fc06ce18982fc6e480ace2",
    "availableSlots": [
        "2026-11-12T15:00:00.000Z",
        "2027-11-13T11:00:00.000Z",
        "2025-01-03T09:30:00.000Z",
        "2027-11-12T15:00:00.000Z",
        "2027-11-12T15:00:00.000Z"
    ]
}
```


**view my wallet money**

```http
PUT/remove-medical-history-item
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Patient
Request Body
```json
{
    "_id":"67800c6e5b1731bd4ace1d8d"
}
```

Response
```json
{
    "message": "item deleted with id 67800c6e5b1731bd4ace1d8d"
}
```

**Add family members by email/phone numbers of existing members or data for new ones**

```http
POST/add-family-members
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Patient

Request body
```json
{
    "phoneNumbers": [
        {
            "phoneNumber": "0112354465",
            "relationToPatient": "spouse"
        }
    ],
    "emails":[
        {
        "email":"email2@gmail.com",
        "relationToPatient": "spouse"

        }
    ],
    "familyMembers":[
        {
            "name":"newFamilyMember",
            "nationalID":"12563",
            "age":"23",
            "gender":"male",
            "relationToPatient":"child"
        }
    ]

}
```

Response
```json
{
    "_id": "66fc076518982fc6e480aceb",
    "familyMembers": [
        {
            "name": "newFamilyMember",
            "nationalID": "12563",
            "age": 23,
            "gender": "male",
            "relationToPatient": "child",
            "_id": "678034b12a5532d8d362587f"
        },
        {
            "userName": "user3",
            "name": "name2",
            "age": 4,
            "gender": "male",
            "relationToPatient": "spouse",
            "memberId": "66f6dddd53e58b51a3d14073",
            "_id": "678034b12a5532d8d3625880"
        },
        {
            "userName": "user1",
            "name": "name1",
            "age": 4,
            "gender": "male",
            "relationToPatient": "spouse",
            "memberId": "66f620374bb800547284f13f",
            "_id": "678034b12a5532d8d3625881"
        }
    ]
}
```


**View my family members**

```http
GET/view-family-members
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Patient

Response
```json
{
    "_id": "66fc076518982fc6e480aceb",
    "familyMembers": [
        {
            "name": "newFamilyMember",
            "nationalID": "12563",
            "age": 23,
            "gender": "male",
            "relationToPatient": "child",
            "_id": "678034b12a5532d8d362587f"
        },
        {
            "userName": "user3",
            "name": "name2",
            "age": 4,
            "gender": "male",
            "relationToPatient": "spouse",
            "memberId": "66f6dddd53e58b51a3d14073",
            "_id": "678034b12a5532d8d3625880"
        },
        {
            "userName": "user1",
            "name": "name1",
            "age": 4,
            "gender": "male",
            "relationToPatient": "spouse",
            "memberId": "66f620374bb800547284f13f",
            "_id": "678034b12a5532d8d3625881"
        }
    ]
}
```

**View my filtered appointments**

```http
GET/filtered-appointments
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

Query Params
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `status` | `string` | Holds the desired appointments status.|
| `date_gte` | `string` | Holds the desired appointments starting date.|
| `date_lte` | `string` | Holds the desired appointments ending date.|
**Accessible by:** Patient and Doctor

Response
```json
[
    {
        "_id": "677ba36c12eff962602775ff",
        "patient": "66fc076518982fc6e480aceb",
        "doctor": "66fc06ce18982fc6e480ace2",
        "date": "2027-11-11T13:00:00.000Z",
        "status": "reserved",
        "prescription": [],
        "pricePaid": 27,
        "__v": 0
    },
    {
        "_id": "677bb49b54d88a6f8a66a1a6",
        "patient": "66fc076518982fc6e480aceb",
        "doctor": "66fc06ce18982fc6e480ace2",
        "date": "2027-11-12T15:00:00.000Z",
        "status": "reserved",
        "prescription": [],
        "pricePaid": 27,
        "__v": 0
    }
]
```

**View my offered packages**

```http
GET/view-packages
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Patient

Response
```json
[
    {
        "_id": "66f924e68270f3f7257cced9",
        "name": "Silver",
        "price": 3600,
        "sessionDiscount": 0.4,
        "pharmacyDiscount": 0.2,
        "familyDiscount": 0.1,
        "__v": 0
    },
    {
        "_id": "66f925068270f3f7257ccedb",
        "name": "Gold",
        "price": 6000,
        "sessionDiscount": 0.6,
        "pharmacyDiscount": 0.3,
        "familyDiscount": 0.15,
        "__v": 0
    },
    {
        "_id": "66f973ccc05dedb41ea94d6f",
        "name": "Platinium with benifit",
        "price": 9500,
        "sessionDiscount": 0.8,
        "pharmacyDiscount": 0.7,
        "familyDiscount": 0.2,
        "__v": 0
    }
]
```
**Pay for package (wallet+stripe)**

```http
POST/pay-package
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Patient

Request Body
```json
{
    "packageId":"66f973ccc05dedb41ea94d6f",
    //family member id is optional, otherwise the  patient themselves is the subscriber
    "familyMemberID":"6723a86340f0828f505c10bb" 
}
```

Response
```json
{
    "url": "https://checkout.stripe.com/c/pay/cs_test_a1kSJPfcLglQQsdJ1Fh2EMG2YVJh8TQVCAAFgOyQ2hembdIvrWAMcV6ZNi#fidkdWxOYHwnPyd1blpxYHZxWjA0SENhVHdAbE1Sd2tKUDRTcWxUdEFuVzVncjF9SFNzU01vdmBQd2tDaklQazdKPFMwQTxMPUdPN3QwTk5vZ1U3Y0pkbnFhUkEyRmppYmMyb013VHdhc2NxNTVmSm5wVk9IXycpJ2N3amhWYHdzYHcnP3F3cGApJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl"
}
```

**Verify Payment and subscribe to package**

```http
PUT/subscribe-to-package
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Patient

Request body
```json
{
    "token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYWNrYWdlSWQiOiI2NmY5NzNjY2MwNWRlZGI0MWVhOTRkNmYiLCJzdWJzY3JpYmluZ01lbWJlciI6IjY3MjNhODYzNDBmMDgyOGY1MDVjMTBiYiIsInBhaWRGcm9tV2FsbGV0Ijo3NTczLCJwYWlkUHJpY2UiOjc2MDAsImlhdCI6MTczNjE2NDMxNCwiZXhwIjoxNzM2MTY1MjE0fQ.D5M3IwvSH1NwM0jQL0g4Kd8Ay9IZlIZGq4FUdf3V0TM"
}
```

Response
```json
{
    "_id": "66fc076518982fc6e480aceb",
    "subscribedPackage": {
        "name": "Platinium with benifit",
        "price": 9500,
        "sessionDiscount": 0.8,
        "pharmacyDiscount": 0.7,
        "familyDiscount": 0.2,
        "_id": "66f973ccc05dedb41ea94d6f",
        "__v": 0
    }
}
```
**Pay for appointment reservation (wallet+stripe)**

```http
POST/pay-reserve-appiontment
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Patient

Request Body
```json
{
    "token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXRpZW50SWQiOiI2NmZjMDc2NTE4OTgyZmM2ZTQ4MGFjZWIiLCJkb2N0b3IiOiI2NmZjMDZjZTE4OTgyZmM2ZTQ4MGFjZTIiLCJkYXRlIjoiMjAyNy0xMS0xMlQxNTowMDowMC4wMDBaIiwicGFpZEZyb21XYWxsZXQiOjAsInBhaWRQcmljZSI6MjcsImlhdCI6MTczNjUzNDg1NSwiZXhwIjoxNzM2NTM1NzU1fQ.V461X7xS7qr93PtDFghBQVmQwRC81oTQmz8v5YclDnk"
}
```

Response
```json
{
    "patient": "66fc076518982fc6e480aceb",
    "doctor": "66fc06ce18982fc6e480ace2",
    "date": "2027-11-12T15:00:00.000Z",
    "status": "reserved",
    "prescription": [],
    "pricePaid": 27,
    "_id": "67816b9ca20108438ae41d52",
    "__v": 0
}
```
**Cancel an appointment**

```http
PUT/cancel-appointment
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Patient

Request Body
```json
{
    "appointmentId":"67816b9ca20108438ae41d52",
}
```

Response
```json
{
    "_id": "67816b9ca20108438ae41d52",
    "patient": "66fc076518982fc6e480aceb",
    "doctor": "66fc06ce18982fc6e480ace2",
    "date": "2027-11-12T15:00:00.000Z",
    "status": "cancelled",
    "prescription": [],
    "pricePaid": 27,
    "__v": 0
}
```
**View Doctors using filter**

```http
GET/filtered-doctors
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

Query Params (filters)
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `string` |  Holds the desired doctor id.|
| `name` | `string` |  Holds the desired doctor name.|
| `userName` | `string` |  Holds the desired doctor userName.|
| `email` | `string` |  Holds the desired doctor email.|
| `affiliation` | `string` |  Holds the desired doctor affiliation.|
| `hourlyRate_gt` | `string` |  Holds the desired doctor hourlyRate_gt.|
| `hourlyRate_gte` | `string` |  Holds the desired doctor hourlyRate_gte.|
| `hourlyRate_lt` | `string` |  Holds the desired doctor hourlyRate_lt.|
| `hourlyRate_lte` | `string` |  Holds the desired doctor hourlyRate_lte.|

**Accessible by:** Patient , Doctor and Admin

Response
```json
[
    {
        "_id": "66f8e265251de76a9984de4d",
        "name": "name10",
        "userName": "user10",
        "email": "email10@gmail.com",
        "birthDate": "2020-12-15T00:00:00.000Z",
        "hourlyRate": 16.3,
        "affiliation": "some krankenhaus",
        "educationalBackground": "Ulm Uni",
        "availableSlots": [],
        "__v": 0
    }
]
```
**View my Data as patient**

```http
GET/my-data
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Patient
Response
```json
{
    "_id": "66fc076518982fc6e480aceb",
    "name": "name11",
    "userName": "user11",
    "email": "email11@gmail.com",
    "birthDate": "2020-12-15T00:00:00.000Z",
    "gender": "female",
    "mobileNumer": "04525632",
    "emergencyName": "emememe",
    "emergencyMobileNumber": "01256325",
    "familyMembers": [
        {
            "name": "newFamilyMember",
            "nationalID": "12563",
            "age": 23,
            "gender": "male",
            "relationToPatient": "child",
            "_id": "678034b12a5532d8d362587f"
        },
        {
            "userName": "user3",
            "name": "name2",
            "age": 4,
            "gender": "male",
            "relationToPatient": "spouse",
            "memberId": "66f6dddd53e58b51a3d14073",
            "_id": "678034b12a5532d8d3625880"
        },
        {
            "userName": "user1",
            "name": "name1",
            "age": 4,
            "gender": "male",
            "relationToPatient": "spouse",
            "memberId": "66f620374bb800547284f13f",
            "_id": "678034b12a5532d8d3625881"
        }
    ],
    "wallet": 27,
    "__v": 0,
    "subscribedPackage": {
        "name": "Platinium with benifit",
        "price": 9500,
        "sessionDiscount": 0.8,
        "pharmacyDiscount": 0.7,
        "familyDiscount": 0.2,
        "_id": "66f973ccc05dedb41ea94d6f",
        "__v": 0
    },
    "renewalDate": "2026-01-10T18:09:33.933Z",
    "resetPasswordExpires": "1970-01-01T00:00:00.000Z",
    "resetPasswordToken": ""
}
```
</details>
<details>
<summary>Doctor</summary>

**View Employment Contract**

```http
GET/view-contract
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Doctor

Response
```json
{
    "employmentContract": {
        "data": {
            "type": "Buffer",
            "data": [137, 80, 78, 71, ...]  // Array of byte values representing the Contract file
        },
        "contentType": "application/pdf"
    },
    "_id": "66fc06ce18982fc6e480ace2",
    "approved": true
}
```
**Accept Employment Contract**

```http
PUT/accept-contract
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Doctor

Response
```json
{
    "message": "Contract Accepted Successfully"
}
```
**View Doctors using filter**

```http
GET/filtered-doctors
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

Query Params (filters)
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `string` |  Holds the desired doctor id.|
| `name` | `string` |  Holds the desired doctor name.|
| `userName` | `string` |  Holds the desired doctor userName.|
| `email` | `string` |  Holds the desired doctor email.|
| `affiliation` | `string` |  Holds the desired doctor affiliation.|
| `hourlyRate_gt` | `string` |  Holds the desired doctor hourlyRate_gt.|
| `hourlyRate_gte` | `string` |  Holds the desired doctor hourlyRate_gte.|
| `hourlyRate_lt` | `string` |  Holds the desired doctor hourlyRate_lt.|
| `hourlyRate_lte` | `string` |  Holds the desired doctor hourlyRate_lte.|

**Accessible by:** Patient , Doctor and Admin

Response
```json
[
    {
        "_id": "66f8e265251de76a9984de4d",
        "name": "name10",
        "userName": "user10",
        "email": "email10@gmail.com",
        "birthDate": "2020-12-15T00:00:00.000Z",
        "hourlyRate": 16.3,
        "affiliation": "some krankenhaus",
        "educationalBackground": "Ulm Uni",
        "availableSlots": [],
        "__v": 0
    }
]
```
**View my filtered appointments**

```http
GET/filtered-appointments
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

Query Params
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `status` | `string` | Holds the desired appointments status.|
| `date_gte` | `string` | Holds the desired appointments starting date.|
| `date_lte` | `string` | Holds the desired appointments ending date.|
**Accessible by:** Doctor and Patient

Response
```json
[
    {
        "_id": "677ba36c12eff962602775ff",
        "patient": "66fc076518982fc6e480aceb",
        "doctor": "66fc06ce18982fc6e480ace2",
        "date": "2027-11-11T13:00:00.000Z",
        "status": "reserved",
        "prescription": [],
        "pricePaid": 27,
        "__v": 0
    },
    {
        "_id": "677bb49b54d88a6f8a66a1a6",
        "patient": "66fc076518982fc6e480aceb",
        "doctor": "66fc06ce18982fc6e480ace2",
        "date": "2027-11-12T15:00:00.000Z",
        "status": "reserved",
        "prescription": [],
        "pricePaid": 27,
        "__v": 0
    }
]
```
**View My Patients**

```http
Get/my-patients
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Doctor

Response
```json
[
    {
        "_id": "66fc076518982fc6e480aceb",
        "name": "name1",
        "userName": "user1",
        "email": "email.com",
        "birthDate": "2020-12-25T00:00:00.000Z",
        "mobileNumer": "0112354465",
        "emergencyName": "emnme",
        "emergencyMobileNumber": "12345022",
        "familyMembers": [],
        "__v": 0,
        "gender": "male"
    }
]
```

**view my wallet money**

```http
GET/view-wallet
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Doctor

Response
```json
{
    "_id": "66fc06ce18982fc6e480ace2",
    "wallet": 14
}
```
**Update my personal data (some data can't be updated by doctor as name,wallet,being approved...etc)**

```http
PUT/update-my-data
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Doctor
Request body
```json
{
    "hourlyRate":"21.5",
    "affiliation":"some brand new affiliation"
}
```

Response
```json
{
    "_id": "66fc06ce18982fc6e480ace2",
    "hourlyRate": 21.5,
    "affiliation": "some brand new affiliation"
}
```
**Upload medical history items for his/her patient**

```http
PUT/add-health-record
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|


Path Parameters
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `string` | **Required**. Holds the Patient id of the medical history item.|

**Accessible by:** Doctor

Request Body

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `medicalHistoryItems` | `file[]` | **Required**. Uploaded medical history items.|


Response
```json
{
    "currentItemsNames": [
        "s9.PNG",
        "TUD calender.JPG",
        "summary app.JPG"
    ]
}
```
**View medical history of my patient (already done an appointment with me)**

```http
GET/view-health-records
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

Path Parameters
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `string` | **Required**. Holds the Patient id of the medical history item.|

**Accessible by:** Doctor

Response
```json
{
    "_id": "66fc076518982fc6e480aceb",
    "medicalHistoryItems": [
        {
            "buffer": {
                "type": "Buffer",
                "data": [137, 80, 78, 71, ...]  // Array of byte values representing the file
            },
            "mimetype": "image/png",
                "originalname": "s9.PNG",
                "_id": "6712026a7b71da361f7f9377"
        },
        {
            "buffer": {
                "type": "Buffer",
                "data": [137, 80, 78, 71, ...]  // Array of byte values representing the file
            },
            "mimetype": "image/png",
                "originalname": "TUD calender.JPG",
                "_id": "6712026a7b71da361f7f9597"
        },
        {
            "buffer": {
                "type": "Buffer",
                "data": [137, 80, 78, 71, ...]  // Array of byte values representing the file
            },
            "mimetype": "image/png",
                "originalname": "summary app.JPG",
                "_id": "6712026a7b71da361f7f7852"
        }
  ]
}
```

**Add free slots**

```http
POST/add-slots
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Doctor

Request body
```json
{
  "slots": [
    "2028-11-13T13:00:00+02:00",
    "2028-11-14T19:30:00+02:00"
  ]
}
```

Response
```json
{
    "currentFreeSlots": [
        "2028-11-13T13:00:00+02:00",
        "2028-11-14T19:30:00+02:00"
    ]
}
```
**View my Data as doctor**

```http
GET/my-data
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Doctor
Response
```json
{
    "employmentContract": {
        "data": {
            "type": "Buffer",
            "data": [137, 80, 78, 71, ...]  // Array of byte values representing the file
        },
        "contentType": "application/pdf"
    },
    "_id": "66fc06ce18982fc6e480ace2",
    "name": "name20",
    "userName": "user20",
    "email": "email20@gmail.com",
    "password": "$2a$08$PwaBG19J62clFLpryM3I5.QnBWoQFS9wy3XlFeYex9fiVIgnRda7q",
    "birthDate": "2020-12-15T00:00:00.000Z",
    "hourlyRate": 21.5,
    "affiliation": "some brand new affiliation",
    "educationalBackground": "med degree MUST",
    "approved": true,
    "employmentContractAccepted": true,
    "availableSlots": [
        "2028-11-13T13:00:00+02:00",
        "2028-11-14T19:30:00+02:00"
    ],
    "wallet": 14,
    "__v": 0,
    "resetPasswordExpires": "1970-01-01T00:00:00.000Z",
    "resetPasswordToken": ""
}
```

**Update/Cancel Appointment**

```http
PUT/update-appointment
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Doctor

Request body
```json
{
    "appointmentId":"677bb49b54d88a6f8a66a1a6",
    "status":"done"
}
```

Response
```json
{
    "updatedAppointment": {
        "_id": "677bb49b54d88a6f8a66a1a6",
        "patient": "66fc076518982fc6e480aceb",
        "doctor": "66fc06ce18982fc6e480ace2",
        "date": "2027-11-12T15:00:00.000Z",
        "status": "done",
        "prescription": [],
        "pricePaid": 27,
        "__v": 0
    }
}
```
**View my filtered Appointments**

```http
GET/view-filtered-appointment
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

Query Params
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `status` | `string` | Holds the desired appointments status.|
| `date_gte` | `string` | Holds the desired appointments starting date.|
| `date_lte` | `string` | Holds the desired appointments ending date.|

**Accessible by:** Doctor and Patient

Response
```json
[
    {
        "prescription": [],
        "_id": "66fb810b096d9da3ff78a06f",
        "patient": "66fc076518982fc6e480aceb",
        "doctor": "66fc06ce18982fc6e480ace2",
        "date": "2017-12-25T07:00:00.000Z",
        "status": "done",
        "__v": 0
    },
    {
        "_id": "677bb49b54d88a6f8a66a1a6",
        "patient": "66fc076518982fc6e480aceb",
        "doctor": "66fc06ce18982fc6e480ace2",
        "date": "2027-11-12T15:00:00.000Z",
        "status": "done",
        "prescription": [],
        "pricePaid": 27,
        "__v": 0
    }
]
```
</details>

<details>
<summary>Admin</summary>


**Add new admin**

```http
POST/add-admin
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Admin

Request body
```json
{
    "userName": "adminName",
    "password": "12345678"
}
```

Response
```json
{
    "userName": "adminName",
    "password": "$2a$08$hpXKrEhxuTCgiqByLyZao.nJRhvkvlkzqQFI6XXHve6SZYMxKGEiG",
    "_id": "6783c2f3faeec24591a18846",
    "__v": 0
}
```
**Add new package**

```http
POST/add-package
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

**Accessible by:** Admin

Request body
```json
{
        "name": "VIP Package",
        "price": 10500,
        "sessionDiscount": 0.6,
        "pharmacyDiscount": 0.3,
        "familyDiscount": 0.2
}
```

Response
```json
{
    "name": "VIP Package",
    "price": 10500,
    "sessionDiscount": 0.6,
    "pharmacyDiscount": 0.3,
    "familyDiscount": 0.2,
    "_id": "6783c454faeec24591a18848",
    "__v": 0
}
```
**Approve new doctor**

```http
Put/approve-doctor
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|
Path Parameters
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `string` | **Required**. Holds the doctor id to be approved.|


**Accessible by:** Admin


Response
```json
{
    "message": "Approved doctor with id=6783dae8593e87e2a25298eb"
}
```
**Edit existing package**

```http
POST/update-package
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

Path Parameters
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `string` | **Required**. Holds the package id to be edited.|

**Accessible by:** Admin

Request body
```json
{
        "familyDiscount": 0.4
}
```

Response
```json
{
    "_id": "6783c454faeec24591a18848",
    "name": "VIP Package",
    "price": 10500,
    "sessionDiscount": 0.6,
    "pharmacyDiscount": 0.3,
    "familyDiscount": 0.4,
    "__v": 0
}
```
**View Doctors using filter**

```http
GET/filtered-doctors
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

Query Params (filters)
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `string` |  Holds the desired doctor id.|
| `name` | `string` |  Holds the desired doctor name.|
| `userName` | `string` |  Holds the desired doctor userName.|
| `email` | `string` |  Holds the desired doctor email.|
| `affiliation` | `string` |  Holds the desired doctor affiliation.|
| `hourlyRate_gt` | `string` |  Holds the desired doctor hourlyRate_gt.|
| `hourlyRate_gte` | `string` |  Holds the desired doctor hourlyRate_gte.|
| `hourlyRate_lt` | `string` |  Holds the desired doctor hourlyRate_lt.|
| `hourlyRate_lte` | `string` |  Holds the desired doctor hourlyRate_lte.|
| `approved` | `string` |  Holds the desired doctor approval status.|
| `employmentContractAccepted` | `string` |  Holds the desired doctor employment contract acceptance status.|

**Accessible by:** Admin

Response
```json
[
    {
        "nationalID": {
            "data": {
                "type": "Buffer",
                "data": [137, 80, 78, 71, ...]  // Array of byte values representing the file
            },
            "contentType": "image/jpeg"
        },
        "medicalDegree": {
            "data": {
                "type": "Buffer",
                "data": [137, 80, 78, 71, ...]  // Array of byte values representing the file
            },
            "contentType": "image/jpeg"
        },
        "medicalLicence": {
            "data": {
                "type": "Buffer",
                "data": [137, 80, 78, 71, ...]  // Array of byte values representing the file
            },
            "contentType": "image/jpeg"
        },
        "_id": "6783dae8593e87e2a25298eb",
        "name": "dname",
        "userName": "dusername",
        "email": "ddd@gmail.com",
        "birthDate": "2004-12-31T00:00:00.000Z",
        "hourlyRate": 14.3,
        "affiliation": "bones and blood",
        "educationalBackground": "some edu bg",
        "approved": false,
        "employmentContractAccepted": false,
        "availableSlots": [],
        "wallet": 0,
        "__v": 0
    }
]
```
**Remove admin**

```http
DEL/remove-admin
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

Path Parameters
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `string` | **Required**. Holds the admin id to be removed.|

**Accessible by:** Admin


Response
```json
{
    "message": "admin removed successfully",
    "removedAdmin": {
        "_id": "6783f68b966ae51cc1cd16b0",
        "userName": "adminName",
        "password": "$2a$08$Du68PAK54Fmq6TmcT3X0a.ZX46WLzRUVKRQvLNOfH/QLevQUh8fAm",
        "__v": 0
    }
}
```
**Remove doctor**

```http
DEL/remove-doctor
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

Path Parameters
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `string` | **Required**. Holds the doctor id to be removed.|

**Accessible by:** Admin


Response
```json
{
    "message": "doctor was removed successfully",
    "removedDoctor": {
        "nationalID": {
            "data": {
                "type": "Buffer",
                "data": [137, 80, 78, 71, ...]  // Array of byte values representing the file
            },
            "contentType": "image/jpeg"
        },
        "medicalDegree": {
            "data": {
                "type": "Buffer",
                "data": [137, 80, 78, 71, ...]  // Array of byte values representing the file
            },
            "contentType": "image/jpeg"
        },
        "medicalLicence": {
            "data": {
                "type": "Buffer",
                "data": [137, 80, 78, 71, ...]  // Array of byte values representing the file
            },
            "contentType": "image/jpeg"
        },
        "_id": "6783dae8593e87e2a25298eb",
        "name": "dname",
        "userName": "dusername",
        "email": "ddd@gmail.com",
        "birthDate": "2004-12-31T00:00:00.000Z",
        "hourlyRate": 14.3,
        "affiliation": "bones and blood",
        "educationalBackground": "some edu bg",
        "approved": false,
        "employmentContractAccepted": false,
        "availableSlots": [],
        "wallet": 0,
        "__v": 0
    }
}
```
**Remove patient**

```http
DEL/remove-patient
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

Path Parameters
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `string` | **Required**. Holds the patient id to be removed.|

**Accessible by:** Admin


Response
```json
{
    "message": "patient was removed successfully",
    "removedPatient": 
        {
            "_id": "66f6f3df2fdbd5fc62294f55",
            "name": "name5",
            "userName": "user5",
            "email": "email5@gmail.com",
            "password": "12345678",
            "birthDate": "2020-12-15T00:00:00.000Z",
            "gender": "male",
            "mobileNumer": "0112354465",
            "emergencyName": "emnme",
            "emergencyMobileNumber": "12345022",
            "familyMembers": [],
            "wallet": 0,
            "__v": 0,
            "medicalHistoryItems": []
        }
}
```
**Remove package**

```http
DEL/remove-package
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

Path Parameters
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `string` | **Required**. Holds the package id to be removed.|

**Accessible by:** Admin


Response
```json
{
    "message": "package was removed successfully",
    "removedPackage": {
        "_id": "6783c454faeec24591a18848",
        "name": "VIP Package",
        "price": 10500,
        "sessionDiscount": 0.6,
        "pharmacyDiscount": 0.3,
        "familyDiscount": 0.4,
        "__v": 0
    }
}
```
**Remove appointment**

```http
DEL/remove-appointment
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

Path Parameters
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `string` | **Required**. Holds the appointment id to be removed.|

**Accessible by:** Admin


Response
```json
{
    "message": "appointment was removed successfully",
    "removedAppointment": {
        "_id": "67274ce1423a3ab318ddc320",
        "patient": "66fc076518982fc6e480aceb",
        "doctor": "66fc06ce18982fc6e480ace2",
        "date": "2024-11-02T15:00:00.000Z",
        "status": "cancelled",
        "prescription": [],
        "__v": 0
    }
}
```
**View filtered appointments**

```http
GET/filtered-appointments
```
Headers
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `authorization` | `string` | **Required**. Holds the token for authorization.|

Query Params
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `doctor` | `string` | Holds the desired appointments doctor.|
| `patient` | `string` | Holds the desired appointments patient.|
| `status` | `string` | Holds the desired appointments status.|
| `date_gte` | `string` | Holds the desired appointments starting date.|
| `date_lte` | `string` | Holds the desired appointments ending date.|
**Accessible by:** Admin

Response
```json
[
    {
        "_id": "67274ce1423a3ab318ddc320",
        "patient": "66fc076518982fc6e480aceb",
        "doctor": "66fc06ce18982fc6e480ace2",
        "date": "2024-11-02T15:00:00.000Z",
        "status": "cancelled",
        "prescription": [],
        "__v": 0
    },
    {
        "_id": "6776abb2dea63ae5933d7d21",
        "patient": "66fc076518982fc6e480aceb",
        "doctor": "66fc06ce18982fc6e480ace2",
        "date": "2026-11-11T09:00:00.000Z",
        "status": "cancelled",
        "prescription": [],
        "pricePaid": 27,
        "__v": 0
    },
]
```

</details>



