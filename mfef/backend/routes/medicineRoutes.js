const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csv-parser");
const { Readable } = require("stream");

const Medicine = require("../Models/Medicine");

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.originalname.toLowerCase().endsWith(".csv") ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Please upload a CSV file only."));
    }
  }
});

// Normalize CSV column names
function normalizeHeader(header) {
  return header
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
}

// Convert CSV dates into valid JavaScript dates
function parseDate(value) {
  if (!value || !String(value).trim()) {
    return null;
  }

  const text = String(value).trim();

  // Excel serial date
  if (/^\d+(\.\d+)?$/.test(text)) {
    const serial = Number(text);

    if (serial < 1 || serial > 100000) {
      return null;
    }

    const date = new Date(Date.UTC(1899, 11, 30));
    date.setUTCDate(date.getUTCDate() + Math.floor(serial));

    return date;
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const match = text.match(
    /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/
  );

  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCDate() !== day ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCFullYear() !== year
    ) {
      return null;
    }

    return date;
  }

  // YYYY-MM-DD or other standard date formats
  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

// IMPORT CSV
router.post(
  "/import-csv",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Please select a CSV file."
        });
      }

      const rows = [];

      // Read CSV file
      await new Promise((resolve, reject) => {
        Readable.from([req.file.buffer])
          .pipe(
            csv({
              mapHeaders: ({ header }) =>
                normalizeHeader(header)
            })
          )
          .on("data", (row) => rows.push(row))
          .on("end", resolve)
          .on("error", reject);
      });

      if (rows.length === 0) {
        return res.status(400).json({
          message: "CSV file is empty."
        });
      }

      console.log("Total CSV rows:", rows.length);
      console.log("First CSV row:", rows[0]);

      const medicines = [];
      let skippedCount = 0;

      // Convert CSV rows into MongoDB medicine documents
      rows.forEach((row) => {
        const medicineName = String(row.name || "").trim();
        const category = String(row.category || "").trim();

        // Correct CSV column names
        const dosage = String(row.dosageform || "").trim();

        const manufacturingDate = parseDate(
          row.manufacturingdate
        );

        const expiryDate = parseDate(
          row.expirydate
        );

        // Skip records without required fields
        if (!medicineName || !category || !expiryDate) {
          skippedCount++;
          return;
        }

        // Skip invalid manufacturing dates when provided
        if (row.manufacturingdate && !manufacturingDate) {
          skippedCount++;
          return;
        }

        medicines.push({
          medicineName: medicineName,
          category: category,
          dosage: dosage,
          strength: row.strength || "",
          manufacturer: row.manufacturer || "",
          indication: row.indication || "",
          classification: row.classification || "",
          manufacturingDate: manufacturingDate,
          expiryDate: expiryDate,
          status: row.status || "Available",

          // Default values for fields not present in CSV
          batchNumber: "",
          quantity: 0,
          minStock: 10,
          price: 0,
          supplier: ""
        });
      });

      if (medicines.length === 0) {
        return res.status(400).json({
          message: "No valid medicine records found.",
          totalRows: rows.length,
          skippedCount: skippedCount
        });
      }

      // Insert records in batches of 1000
      let importedCount = 0;

      for (let i = 0; i < medicines.length; i += 1000) {
        const batch = medicines.slice(i, i + 1000);

        const saved = await Medicine.insertMany(batch);

        importedCount += saved.length;

        console.log(
          `Imported ${importedCount} of ${medicines.length} records`
        );
      }

      return res.status(201).json({
        message: "CSV imported successfully!",
        totalRows: rows.length,
        importedCount: importedCount,
        skippedCount: skippedCount
      });

    } catch (error) {
      console.error("CSV IMPORT ERROR:", error);

      return res.status(400).json({
        message: "CSV import failed",
        error: error.message
      });
    }
  }
);

// GET ALL MEDICINES
router.get("/", async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({
      createdAt: -1
    });

    res.json(medicines);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// ADD MEDICINE
router.post("/", async (req, res) => {
  try {
    const medicine = new Medicine(req.body);

    const savedMedicine = await medicine.save();

    res.status(201).json(savedMedicine);

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});

// UPDATE MEDICINE
router.put("/:id", async (req, res) => {
  try {
    const updatedMedicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedMedicine) {
      return res.status(404).json({
        message: "Medicine not found"
      });
    }

    res.json(updatedMedicine);

  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});

// DELETE MEDICINE
router.delete("/:id", async (req, res) => {
  try {
    const deletedMedicine = await Medicine.findByIdAndDelete(
      req.params.id
    );

    if (!deletedMedicine) {
      return res.status(404).json({
        message: "Medicine not found"
      });
    }

    res.json({
      message: "Medicine deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;