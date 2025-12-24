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
function deleteUserPurchases(email) {
    return __awaiter(this, void 0, void 0, function () {
        var user, revenueCount, purchaseIds, deletedRevenues, deletedPurchases, remainingPurchases, remainingRevenues, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, 7, 9]);
                    console.log("\n\uD83D\uDD0D Looking for user with email: ".concat(email));
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { email: email },
                            include: {
                                purchases: {
                                    include: {
                                        revenue: true,
                                        sop: {
                                            select: {
                                                title: true,
                                                id: true
                                            }
                                        }
                                    }
                                }
                            }
                        })];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        console.log("\u274C User with email ".concat(email, " not found"));
                        return [2 /*return*/];
                    }
                    console.log("\n\u2705 Found user: ".concat(user.name || 'No name', " (").concat(user.email, ")"));
                    console.log("   User ID: ".concat(user.id));
                    console.log("   Total purchases: ".concat(user.purchases.length));
                    if (user.purchases.length === 0) {
                        console.log("\n\u2705 User has no purchases to delete.");
                        return [2 /*return*/];
                    }
                    // Display purchase details
                    console.log("\n\uD83D\uDCE6 Purchases to delete:");
                    user.purchases.forEach(function (purchase, index) {
                        console.log("   ".concat(index + 1, ". SOP: ").concat(purchase.sop.title));
                        console.log("      Purchase ID: ".concat(purchase.id));
                        console.log("      Amount: $".concat(purchase.amount));
                        console.log("      Status: ".concat(purchase.status));
                        console.log("      Has Revenue: ".concat(purchase.revenue ? 'Yes' : 'No'));
                        if (purchase.revenue) {
                            console.log("      Revenue ID: ".concat(purchase.revenue.id));
                        }
                    });
                    revenueCount = user.purchases.filter(function (p) { return p.revenue; }).length;
                    console.log("\n\uD83D\uDCB0 Total revenues to delete: ".concat(revenueCount));
                    // Delete revenues first
                    console.log("\n\uD83D\uDDD1\uFE0F  Deleting revenues...");
                    purchaseIds = user.purchases.map(function (p) { return p.id; });
                    return [4 /*yield*/, prisma.revenue.deleteMany({
                            where: {
                                purchaseId: {
                                    in: purchaseIds
                                }
                            }
                        })];
                case 2:
                    deletedRevenues = _a.sent();
                    console.log("   \u2705 Deleted ".concat(deletedRevenues.count, " revenue records"));
                    // Delete purchases
                    console.log("\n\uD83D\uDDD1\uFE0F  Deleting purchases...");
                    return [4 /*yield*/, prisma.purchase.deleteMany({
                            where: {
                                userId: user.id
                            }
                        })];
                case 3:
                    deletedPurchases = _a.sent();
                    console.log("   \u2705 Deleted ".concat(deletedPurchases.count, " purchase records"));
                    // Verify deletion
                    console.log("\n\u2714\uFE0F  Verifying deletion...");
                    return [4 /*yield*/, prisma.purchase.findMany({
                            where: { userId: user.id }
                        })];
                case 4:
                    remainingPurchases = _a.sent();
                    return [4 /*yield*/, prisma.revenue.findMany({
                            where: {
                                purchaseId: {
                                    in: purchaseIds
                                }
                            }
                        })];
                case 5:
                    remainingRevenues = _a.sent();
                    if (remainingPurchases.length === 0 && remainingRevenues.length === 0) {
                        console.log("   \u2705 SUCCESS: All purchases and revenues have been deleted");
                        console.log("   User ".concat(user.email, " can now test purchasing again!"));
                    }
                    else {
                        console.log("   \u26A0\uFE0F  WARNING: Some records remain:");
                        console.log("      Remaining purchases: ".concat(remainingPurchases.length));
                        console.log("      Remaining revenues: ".concat(remainingRevenues.length));
                    }
                    return [3 /*break*/, 9];
                case 6:
                    error_1 = _a.sent();
                    console.error('❌ Error deleting purchases:', error_1);
                    throw error_1;
                case 7: return [4 /*yield*/, prisma.$disconnect()];
                case 8:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    });
}
// Get email from command line argument
var email = process.argv[2];
if (!email) {
    console.error('❌ Please provide an email address as argument');
    console.log('Usage: ts-node scripts/delete-user-purchases.ts <email>');
    process.exit(1);
}
// Run the deletion
deleteUserPurchases(email)
    .then(function () {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
})
    .catch(function (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
});
