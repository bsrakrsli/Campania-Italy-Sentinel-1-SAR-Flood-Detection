# Campania-Italy-Sentinel-1-SAR-Flood-Detection
# 🌊 Sentinel-1 SAR Flood Detection Using Google Earth Engine

A remote sensing project for flood mapping using Sentinel-1 Synthetic Aperture Radar (SAR) imagery and change detection techniques implemented in Google Earth Engine.

---

## 📌 Project Overview

This project investigates the 31 March 2023 flood event along the Daugava River in Latvia using Sentinel-1 C-band SAR data.

Two unsupervised SAR-based change detection approaches were implemented and compared against the Copernicus Emergency Management Service (CEMS) flood reference map.

The project demonstrates how SAR imagery can be used for rapid flood extent estimation under all-weather and day/night imaging conditions.

---

## 🎯 Objectives

- Detect flooded areas using Sentinel-1 SAR imagery
- Compare dual- and single-polarization SAR approaches
- Estimate flood extent (ha)
- Evaluate the consistency of both methods with Copernicus EMS
- Demonstrate an operational SAR workflow in Google Earth Engine

---

## 📍 Study Area

**Location:** Daugava River, Latvia

**Flood Event:** 31 March 2023

Reference Dataset:

- Copernicus Emergency Management Service (CEMS)

---

## 🛰️ Data

| Dataset | Description |
|----------|-------------|
| Sentinel-1 GRD | C-band SAR imagery |
| VV Polarization | Single-polarization analysis |
| VV + VH Polarizations | Dual-polarization analysis |
| Copernicus EMS | Reference flood extent |

---

## ⚙️ Methodology

Two independent flood detection methods were implemented.

### Method 1 — Dual Polarization

- VV Difference (ΔVV)
- VH Difference (ΔVH)
- Histogram-based thresholding
- Flood mask generation

### Method 2 — Single Polarization

- VV Change Index (CI)

\[
CI=\frac{Post-Pre}{Post+Pre}
\]

- Histogram analysis
- Threshold selection
- Flood mask generation

Both outputs were converted into flooded area (hectares) and compared with Copernicus EMS.

---

## 📊 Results

| Method | Estimated Flood Area |
|---------|----------------------|
| Copernicus EMS | ~1007 ha |
| Dual Polarization | ~15640 ha |
| Change Index | ~1766 ha |

The VV Change Index produced a flood extent considerably closer to the Copernicus reference, while the dual-polarization method tended to overestimate flooded regions.

---

## 🛠️ Technologies Used

- Google Earth Engine
- JavaScript
- Sentinel-1 SAR
- Remote Sensing
- Change Detection
- GIS

---

## 📄 Project Report


[2200674056_BusraKirisli_GMT441Project.docx](https://github.com/user-attachments/files/30288049/2200674056_BusraKirisli_GMT441Project.docx)



---

## 💻 Google Earth Engine Script

The complete implementation is available here.

🔗 **https://code.earthengine.google.com/ba9cd2527d8cf27824fab8d87775823a**

---

## 📚 References

- Copernicus Emergency Management Service (CEMS)
- Sentinel-1 GRD
- Google Earth Engine Documentation
- ESA Sentinel-1 User Guide

---

## 👩‍💻 Author

**Büşra Kirişli**

Geomatics Engineer

Hacettepe University
