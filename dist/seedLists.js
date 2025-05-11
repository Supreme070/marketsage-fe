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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var dotenv = require("dotenv");
// Load environment variables
dotenv.config();
// Create Prisma client with direct connection to database
var prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: "postgresql://marketsage:marketsage_password@localhost:5432/marketsage?schema=public"
        }
    }
});
// Sample list data
var sampleLists = [
    {
        name: "Nigerian Businesses",
        description: "Business contacts from Nigeria",
        isStatic: true,
    },
    {
        name: "Individual Customers",
        description: "All individual customer contacts",
        isStatic: true,
    },
    {
        name: "Marketing Leads",
        description: "Potential leads for marketing campaigns",
        isStatic: true,
    },
    {
        name: "VIP Contacts",
        description: "High-priority and important contacts",
        isStatic: true,
    },
    {
        name: "Event Attendees",
        description: "People who attended our events",
        isStatic: true,
    }
];
function seedLists() {
    return __awaiter(this, void 0, void 0, function () {
        var adminUser, createdLists, _i, sampleLists_1, listData, list, error_1, contacts, memberAssignments, nigerianBusinesses, nigerianCompanyContacts, _a, nigerianCompanyContacts_1, contact, member, error_2, individualCustomers, individualContacts, _b, individualContacts_1, contact, member, error_3, marketingLeads, leadContacts, _c, leadContacts_1, contact, member, error_4, vipContacts, vipContactsList, _d, vipContactsList_1, contact, member, error_5, eventAttendees, attendeeContacts, _e, attendeeContacts_1, contact, member, error_6;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    console.log("Starting to seed contact lists...");
                    return [4 /*yield*/, prisma.user.findFirst({
                            where: {
                                role: "ADMIN",
                            },
                        })];
                case 1:
                    adminUser = _f.sent();
                    if (!!adminUser) return [3 /*break*/, 3];
                    return [4 /*yield*/, prisma.user.findFirst({})];
                case 2:
                    adminUser = _f.sent();
                    if (!adminUser) {
                        console.error("No users found in the database. Please create a user first.");
                        return [2 /*return*/];
                    }
                    _f.label = 3;
                case 3:
                    console.log("Using user ".concat(adminUser.email, " (").concat(adminUser.id, ") as the list creator."));
                    createdLists = [];
                    _i = 0, sampleLists_1 = sampleLists;
                    _f.label = 4;
                case 4:
                    if (!(_i < sampleLists_1.length)) return [3 /*break*/, 9];
                    listData = sampleLists_1[_i];
                    _f.label = 5;
                case 5:
                    _f.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, prisma.list.create({
                            data: {
                                name: listData.name,
                                description: listData.description,
                                type: listData.isStatic ? "STATIC" : "DYNAMIC",
                                createdById: adminUser.id,
                            },
                        })];
                case 6:
                    list = _f.sent();
                    createdLists.push(list);
                    console.log("Created list: ".concat(list.name, " (").concat(list.id, ")"));
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _f.sent();
                    console.error("Error creating list \"".concat(listData.name, "\":"), error_1);
                    return [3 /*break*/, 8];
                case 8:
                    _i++;
                    return [3 /*break*/, 4];
                case 9:
                    if (!(createdLists.length === 0)) return [3 /*break*/, 11];
                    console.log("No lists were created. Exiting.");
                    return [4 /*yield*/, prisma.$disconnect()];
                case 10:
                    _f.sent();
                    return [2 /*return*/];
                case 11: return [4 /*yield*/, prisma.contact.findMany({
                        take: 100,
                    })];
                case 12:
                    contacts = _f.sent();
                    if (!(contacts.length === 0)) return [3 /*break*/, 14];
                    console.log("No contacts found to add to lists.");
                    return [4 /*yield*/, prisma.$disconnect()];
                case 13:
                    _f.sent();
                    return [2 /*return*/];
                case 14:
                    console.log("Found ".concat(contacts.length, " contacts to add to lists."));
                    memberAssignments = [];
                    nigerianBusinesses = createdLists.find(function (list) { return list.name === "Nigerian Businesses"; });
                    if (!nigerianBusinesses) return [3 /*break*/, 20];
                    nigerianCompanyContacts = contacts.filter(function (contact) { return contact.country === "Nigeria" && contact.company !== null; });
                    console.log("Adding ".concat(nigerianCompanyContacts.length, " contacts to Nigerian Businesses list"));
                    _a = 0, nigerianCompanyContacts_1 = nigerianCompanyContacts;
                    _f.label = 15;
                case 15:
                    if (!(_a < nigerianCompanyContacts_1.length)) return [3 /*break*/, 20];
                    contact = nigerianCompanyContacts_1[_a];
                    _f.label = 16;
                case 16:
                    _f.trys.push([16, 18, , 19]);
                    return [4 /*yield*/, prisma.listMember.create({
                            data: {
                                listId: nigerianBusinesses.id,
                                contactId: contact.id,
                            },
                        })];
                case 17:
                    member = _f.sent();
                    memberAssignments.push(member);
                    return [3 /*break*/, 19];
                case 18:
                    error_2 = _f.sent();
                    console.error("Error adding contact ".concat(contact.id, " to list:"), error_2);
                    return [3 /*break*/, 19];
                case 19:
                    _a++;
                    return [3 /*break*/, 15];
                case 20:
                    individualCustomers = createdLists.find(function (list) { return list.name === "Individual Customers"; });
                    if (!individualCustomers) return [3 /*break*/, 26];
                    individualContacts = contacts.filter(function (contact) { return (contact.company === null || contact.company === "") && contact.firstName !== null; }).slice(0, 30);
                    console.log("Adding ".concat(individualContacts.length, " contacts to Individual Customers list"));
                    _b = 0, individualContacts_1 = individualContacts;
                    _f.label = 21;
                case 21:
                    if (!(_b < individualContacts_1.length)) return [3 /*break*/, 26];
                    contact = individualContacts_1[_b];
                    _f.label = 22;
                case 22:
                    _f.trys.push([22, 24, , 25]);
                    return [4 /*yield*/, prisma.listMember.create({
                            data: {
                                listId: individualCustomers.id,
                                contactId: contact.id,
                            },
                        })];
                case 23:
                    member = _f.sent();
                    memberAssignments.push(member);
                    return [3 /*break*/, 25];
                case 24:
                    error_3 = _f.sent();
                    console.error("Error adding contact ".concat(contact.id, " to list:"), error_3);
                    return [3 /*break*/, 25];
                case 25:
                    _b++;
                    return [3 /*break*/, 21];
                case 26:
                    marketingLeads = createdLists.find(function (list) { return list.name === "Marketing Leads"; });
                    if (!marketingLeads) return [3 /*break*/, 32];
                    leadContacts = contacts.filter(function (_, index) { return index % 3 === 0; }).slice(0, 20);
                    console.log("Adding ".concat(leadContacts.length, " contacts to Marketing Leads list"));
                    _c = 0, leadContacts_1 = leadContacts;
                    _f.label = 27;
                case 27:
                    if (!(_c < leadContacts_1.length)) return [3 /*break*/, 32];
                    contact = leadContacts_1[_c];
                    _f.label = 28;
                case 28:
                    _f.trys.push([28, 30, , 31]);
                    return [4 /*yield*/, prisma.listMember.create({
                            data: {
                                listId: marketingLeads.id,
                                contactId: contact.id,
                            },
                        })];
                case 29:
                    member = _f.sent();
                    memberAssignments.push(member);
                    return [3 /*break*/, 31];
                case 30:
                    error_4 = _f.sent();
                    console.error("Error adding contact ".concat(contact.id, " to list:"), error_4);
                    return [3 /*break*/, 31];
                case 31:
                    _c++;
                    return [3 /*break*/, 27];
                case 32:
                    vipContacts = createdLists.find(function (list) { return list.name === "VIP Contacts"; });
                    if (!vipContacts) return [3 /*break*/, 38];
                    vipContactsList = contacts.filter(function (_, index) { return index % 7 === 0; }).slice(0, 10);
                    console.log("Adding ".concat(vipContactsList.length, " contacts to VIP Contacts list"));
                    _d = 0, vipContactsList_1 = vipContactsList;
                    _f.label = 33;
                case 33:
                    if (!(_d < vipContactsList_1.length)) return [3 /*break*/, 38];
                    contact = vipContactsList_1[_d];
                    _f.label = 34;
                case 34:
                    _f.trys.push([34, 36, , 37]);
                    return [4 /*yield*/, prisma.listMember.create({
                            data: {
                                listId: vipContacts.id,
                                contactId: contact.id,
                            },
                        })];
                case 35:
                    member = _f.sent();
                    memberAssignments.push(member);
                    return [3 /*break*/, 37];
                case 36:
                    error_5 = _f.sent();
                    console.error("Error adding contact ".concat(contact.id, " to list:"), error_5);
                    return [3 /*break*/, 37];
                case 37:
                    _d++;
                    return [3 /*break*/, 33];
                case 38:
                    eventAttendees = createdLists.find(function (list) { return list.name === "Event Attendees"; });
                    if (!eventAttendees) return [3 /*break*/, 44];
                    attendeeContacts = contacts.filter(function (_, index) { return index % 5 === 0; }).slice(0, 15);
                    console.log("Adding ".concat(attendeeContacts.length, " contacts to Event Attendees list"));
                    _e = 0, attendeeContacts_1 = attendeeContacts;
                    _f.label = 39;
                case 39:
                    if (!(_e < attendeeContacts_1.length)) return [3 /*break*/, 44];
                    contact = attendeeContacts_1[_e];
                    _f.label = 40;
                case 40:
                    _f.trys.push([40, 42, , 43]);
                    return [4 /*yield*/, prisma.listMember.create({
                            data: {
                                listId: eventAttendees.id,
                                contactId: contact.id,
                            },
                        })];
                case 41:
                    member = _f.sent();
                    memberAssignments.push(member);
                    return [3 /*break*/, 43];
                case 42:
                    error_6 = _f.sent();
                    console.error("Error adding contact ".concat(contact.id, " to list:"), error_6);
                    return [3 /*break*/, 43];
                case 43:
                    _e++;
                    return [3 /*break*/, 39];
                case 44:
                    console.log("Successfully created ".concat(createdLists.length, " lists and added ").concat(memberAssignments.length, " members."));
                    return [4 /*yield*/, prisma.$disconnect()];
                case 45:
                    _f.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Run the seed function
seedLists()
    .catch(function (error) {
    console.error("Error running seed script:", error);
    process.exit(1);
})
    .finally(function () {
    console.log("List seeding complete.");
});
