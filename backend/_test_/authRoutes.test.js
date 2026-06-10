const express = require ("express");
const request = require ("supertest");

jest.mock("../models/User", () =>{
    return{
        findOne:jest.fn()
    };
});

const User = require ("../models/User");
const authRoutes = require ("../routes/authRoutes");

const buildApp = () =>{
    const app = express();
    app.use(express.json());
    app.use("/api/auth", authRoutes);
    return app;
}

describe("Auth Routes", () =>{
    beforeEach(() =>{
        jest.clearAllMocks();
    });

    test("POST/api/auth/login-should return 400 when email is missing", async () =>{
        const app = buildApp()
        const response = await request(app)
        .post("/api/auth/login")
        .send({password: "abcde123"});
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Email is required");
    });

      test("POST/api/auth/login-should return 400 when password is missing", async () =>{
        User.findOne.mockResolvedValue({status: "active", hasPassword:true, password:"1233yutu"})
        const app = buildApp()
        const response = await request(app)
        .post("/api/auth/login")
        .send({email: "abcde123@gmail.com"});
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Password is required");
    });

     test("POST/api/auth/login-should return 401 when credinitals are invalid", async () =>{
        User.findOne.mockResolvedValue(null);
        const app = buildApp()
        const response = await request(app)
        .post("/api/auth/login")
        .send({email: "abcde123@gmail.com", password:"strongPassword"});
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Invalid email or password");
    });

       test("POST/api/auth/forgot-password-should return 400 when password is too short ", async () =>{
        const app = buildApp()
        const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({email: "abcde123@gmail.com", password:"123", confrimPasswword:"123"});
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("New password must be at least 6 characters");
    });

     test("POST/api/auth/set-password-should return 400 when password mismatch ", async () =>{
        const app = buildApp()
        const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({email: "abcde123@gmail.com", password:"123456789", confrimPasswword:"9876543"});
        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Passwords do not match");
    });


});