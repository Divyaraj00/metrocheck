
const VALID_WEIGHT_UNITS = ["g", "gram", "grams", "kg", "kilogram", "kilograms"];
const VALID_VOLUME_UNITS = ["ml", "millilitre", "millilitres", "l", "litre", "litres"];
const VALID_COUNT_UNITS = ["pcs", "piece", "pieces", "unit", "units", "n", "nos"];
const VALID_UNITS = [...VALID_WEIGHT_UNITS, ...VALID_VOLUME_UNITS, ...VALID_COUNT_UNITS];

// Basic email / phone patterns for consumer-care contact validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d[\d\s-]{7,14}\d$/;

function isNonEmptyString(val) {
  return typeof val === "string" && val.trim().length > 0;
}

function hasValidNetQuantity(netQuantity) {
  if (!isNonEmptyString(netQuantity)) return false;
  const match = netQuantity.trim().match(/^([\d.]+)\s*([a-zA-Z]+)$/);
  if (!match) return false;
  const [, , unit] = match;
  return VALID_UNITS.includes(unit.toLowerCase());
}

function hasValidMRP(mrp) {
  if (mrp === undefined || mrp === null || mrp === "") return false;
  const num = typeof mrp === "number" ? mrp : parseFloat(String(mrp).replace(/[₹,\s]/g, ""));
  return !isNaN(num) && num > 0;
}

function hasValidConsumerCare(consumerCare) {
  if (!consumerCare) return false;
  const { email, phone } = consumerCare;
  const emailOk = isNonEmptyString(email) && EMAIL_REGEX.test(email.trim());
  const phoneOk = isNonEmptyString(phone) && PHONE_REGEX.test(phone.trim());
  return emailOk || phoneOk;
}

function hasValidManufactureDate(dateStr) {
  if (!isNonEmptyString(dateStr)) return false;
  // Accept "MM/YYYY", "MM-YYYY", or full date strings
  const monthYearMatch = dateStr.trim().match(/^(0?[1-9]|1[0-2])[/-](\d{4})$/);
  if (monthYearMatch) return true;
  const parsed = Date.parse(dateStr);
  return !isNaN(parsed);
}

/**
 * Main entry point.
 * @param {Object} listing - the product listing to validate
 * @returns {{ compliant: boolean, violations: string[], checkedAt: string }}
 */
function checkCompliance(listing = {}) {
  const violations = [];

  // 1. Net quantity
  if (!hasValidNetQuantity(listing.netQuantity)) {
    violations.push(
      "Missing or invalid net quantity declaration (expected a number + unit, e.g. '500 g', '1 l', '10 pcs')."
    );
  }

  // 2. MRP
  if (!hasValidMRP(listing.mrp)) {
    violations.push("Missing or invalid Maximum Retail Price (MRP).");
  } else if (listing.mrpInclusiveOfTaxes === false) {
    violations.push("MRP is not declared as inclusive of all taxes, as required.");
  }

  // 3. Manufacturer / packer / importer details
  if (!isNonEmptyString(listing.manufacturerName)) {
    violations.push("Missing name of manufacturer/packer/importer.");
  }
  if (!isNonEmptyString(listing.manufacturerAddress)) {
    violations.push("Missing address of manufacturer/packer/importer.");
  }

  // 4. Month & year of manufacture/import
  if (!hasValidManufactureDate(listing.manufactureDate)) {
    violations.push("Missing or invalid month & year of manufacture/packing/import.");
  }

  // 5. Consumer care details
  if (!hasValidConsumerCare(listing.consumerCare)) {
    violations.push("Missing or invalid consumer care contact (needs a valid email or phone number).");
  }

  // 6. Country of origin (only required if imported)
  if (listing.isImported === true && !isNonEmptyString(listing.countryOfOrigin)) {
    violations.push("Product is marked as imported but is missing country of origin.");
  }

  // 7. Unit sale price (price per standard unit), required in most cases
  if (listing.unitSalePrice === undefined || listing.unitSalePrice === null || listing.unitSalePrice === "") {
    violations.push("Missing unit sale price (price per standard unit, e.g. price/kg or price/litre).");
  }

  return {
    compliant: violations.length === 0,
    violations,
    checkedAt: new Date().toISOString(),
  };
}

module.exports = { checkCompliance };
