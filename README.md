# Campania-Italy-Sentinel-1-SAR-Flood-Detection
# 🔥 Wildfire Damage Assessment Using Multi-Sensor Remote Sensing and Random Forest

A Google Earth Engine project for wildfire damage assessment using Sentinel-1 SAR, Sentinel-2 multispectral imagery, spectral indices, and Random Forest classification.

---

# 📖 Project Overview

This project analyzes the EMSR830 wildfire in Campania, Italy by integrating optical and radar satellite imagery within Google Earth Engine.

Two independent wildfire mapping approaches were implemented and compared:

- dNBR-based burn severity analysis
- Supervised Random Forest classification

Unlike traditional optical-only workflows, this project also incorporates Sentinel-1 SAR data to improve burned area discrimination by combining radar backscatter information with multispectral features.

---

# 🎯 Objectives

- Detect wildfire-affected areas
- Produce burn severity maps using dNBR
- Generate land cover classification using Random Forest
- Integrate Sentinel-1 SAR and Sentinel-2 imagery
- Compare burned area estimates from different approaches
- Evaluate classification performance using accuracy metrics

---

# 📍 Study Area

**Location:** Campania, Italy

**Event:** EMSR830 Wildfire (2025)

---

# 🛰️ Data

### Sentinel-2

- RGB bands
- SWIR bands
- NDVI
- NBR
- NDMI
- NBR2

### Sentinel-1

- VV
- VH
- VV/VH Ratio

---

# Methodology

The workflow consists of two complementary wildfire assessment methods.

## Method 1 — Burn Severity Mapping

- Cloud masking
- Pre-fire composite
- Post-fire composite
- NBR calculation
- dNBR computation
- Burn severity classification
- Burned area estimation
- Burn severity statistics

---

## Method 2 — Random Forest Classification

Training samples:

- Burned Area
- Vegetation
- Urban
- Bare Soil

Input features include:

- Sentinel-2 spectral bands
- Spectral indices
- Sentinel-1 VV
- Sentinel-1 VH
- VV/VH ratio

The Random Forest model classifies the study area into four land cover classes and computes burned area statistics.

---

# Workflow

![Workflow](images/workflow.png)

---

# Results

## Burn Severity (dNBR)

![dNBR](images/dnbr.png)

---

## Burn Severity Classes

![Burn Severity](images/burn_severity.png)

---

## Conservative Burned Area

![Burned Area](images/burned_area.png)

---

## Random Forest Classification

![RF](images/random_forest.png)

---

## Burned Area from Random Forest

![RF Burned](images/rf_burned.png)

---

## Histograms & Charts

- dNBR Histogram
- Burn Severity Area Chart
- Random Forest Histogram
- Training Sample Distribution
- Burned Area Comparison

---

# Machine Learning

Algorithm:

- Random Forest

Training Classes

- Burned
- Vegetation
- Urban
- Bare Soil

Performance Metrics

- Overall Accuracy
- Kappa Coefficient
- Producer Accuracy
- User Accuracy
- Variable Importance

---

# Technologies

- Google Earth Engine
- JavaScript
- Sentinel-1 SAR
- Sentinel-2
- Random Forest
- Remote Sensing
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
