import { checkCompliance } from "./checkCompliance.js";

const compliantListing = {
  netQuantity: "500 g",
  mrp: 249,
  mrpInclusiveOfTaxes: true,
  manufacturerName: "ABC Foods Pvt Ltd",
  manufacturerAddress: "Plot 12, Industrial Area, Jaipur, Rajasthan",
  manufactureDate: "06/2026",
  consumerCare: { email: "care@abcfoods.com", phone: "+91-9876543210" },
  isImported: false,
  unitSalePrice: 49.8,
};

const violatingListing = {
  netQuantity: "500", // missing unit
  mrp: "", // missing
  manufacturerName: "",
  manufactureDate: "not a date",
  consumerCare: {},
  isImported: true,
  countryOfOrigin: "", // required since imported, but missing
};

console.log("=== Compliant listing ===");
console.log(JSON.stringify(checkCompliance(compliantListing), null, 2));

console.log("\n=== Violating listing ===");
console.log(JSON.stringify(checkCompliance(violatingListing), null, 2));
