"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function deleteUser(email) {
    return __awaiter(this, void 0, void 0, function () {
        var user, verifyUser, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, 5, 7]);
                    console.log("\uD83D\uDD0D Searching for user with email: ".concat(email));
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { email: email },
                            include: {
                                sops: true,
                                purchases: true,
                                sessions: true,
                                ratings: true,
                                comments: true,
                                cartItems: true,
                            },
                        })];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        console.log("\u274C User with email ".concat(email, " not found in the database."));
                        return [2 /*return*/];
                    }
                    console.log("\u2705 User found:");
                    console.log("   - ID: ".concat(user.id));
                    console.log("   - Name: ".concat(user.name || 'N/A'));
                    console.log("   - Email: ".concat(user.email));
                    console.log("   - Role: ".concat(user.role));
                    console.log("   - Created: ".concat(user.createdAt));
                    console.log("\n\uD83D\uDCCA Related data:");
                    console.log("   - SOPs: ".concat(user.sops.length));
                    console.log("   - Purchases: ".concat(user.purchases.length));
                    console.log("   - Sessions: ".concat(user.sessions.length));
                    console.log("   - Ratings: ".concat(user.ratings.length));
                    console.log("   - Comments: ".concat(user.comments.length));
                    console.log("   - Cart Items: ".concat(user.cartItems.length));
                    console.log("\n\uD83D\uDDD1\uFE0F  Deleting user and all related data...");
                    // Delete the user (cascade deletes will handle related records)
                    return [4 /*yield*/, prisma.user.delete({
                            where: { email: email },
                        })];
                case 2:
                    // Delete the user (cascade deletes will handle related records)
                    _a.sent();
                    console.log("\u2705 User ".concat(email, " and all related data have been successfully deleted!"));
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { email: email },
                        })];
                case 3:
                    verifyUser = _a.sent();
                    if (!verifyUser) {
                        console.log("\u2705 Deletion verified: User ".concat(email, " no longer exists in the database."));
                    }
                    else {
                        console.log("\u26A0\uFE0F  Warning: User still exists after deletion attempt.");
                    }
                    return [3 /*break*/, 7];
                case 4:
                    error_1 = _a.sent();
                    console.error("\u274C Error deleting user:", error_1);
                    throw error_1;
                case 5: return [4 /*yield*/, prisma.$disconnect()];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Get email from command line argument or use default
var email = process.argv[2] || 'wildmaker228@gmail.com';
deleteUser(email)
    .then(function () {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
})
    .catch(function (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
});
