/************************************************************
 Wildfire Change Detection Project
 Study Area: EMSR830 Wildfire in Campania, Italy

 METHOD 1: Supervised Machine Learning (Random Forest)
 METHOD 2: dNBR-based Change Detection

 REQUIRED IMPORTS:
 1) geometry    -> AOI polygon
 2) burned      -> burned training polygon(s)
 3) vegetation  -> vegetation training polygon(s)
 4) urban       -> urban training polygon(s)
 5) bareSoil    -> bare soil training polygon(s)
************************************************************/


// ==========================================================
// 0. STUDY AREA
// ==========================================================
var aoi = geometry;

Map.centerObject(aoi, 11);
Map.addLayer(aoi, {color: 'yellow'}, 'Study Area');


// ==========================================================
// 1. DATE RANGES
// ==========================================================
var preStart  = '2025-01-01';
var preEnd    = '2025-06-05';

var postStart = '2025-08-10';
var postEnd   = '2025-09-10';


// ==========================================================
// 2. SENTINEL-2 CLOUD MASK FUNCTION
// ==========================================================
function maskS2sr(image) {
  var scl = image.select('SCL');

  var mask = scl.neq(0)   // no data
    .and(scl.neq(1))      // saturated/defective
    .and(scl.neq(3))      // cloud shadow
    .and(scl.neq(8))      // cloud medium probability
    .and(scl.neq(9))      // cloud high probability
    .and(scl.neq(10))     // cirrus
    .and(scl.neq(11));    // snow/ice

  return image.updateMask(mask)
              .divide(10000)
              .copyProperties(image, image.propertyNames());
}


// ==========================================================
// 3. LOAD SENTINEL-2
// ==========================================================
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoi)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskS2sr);

// ==========================================================
// 3B. LOAD SENTINEL-1 SAR DATA
// ==========================================================
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(aoi)
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
  .filter(ee.Filter.eq('resolution_meters', 10));

// Pre-fire SAR
var s1_pre = s1
  .filterDate(preStart, preEnd)
  .select(['VV', 'VH'])
  .median()
  .clip(aoi);

// Post-fire SAR
var s1_post = s1
  .filterDate(postStart, postEnd)
  .select(['VV', 'VH'])
  .median()
  .clip(aoi);

// SAR ratio (çok önemli)
var s1_ratio = s1_post.select('VV').divide(s1_post.select('VH')).rename('VVVH');

Map.addLayer(s1_post.select('VV'), {min: -20, max: 0}, 'SAR VV');
Map.addLayer(s1_post.select('VH'), {min: -25, max: -5}, 'SAR VH');
// ==========================================================
// 4. PRE- AND POST-FIRE COMPOSITES
// ==========================================================
var preImage = s2
  .filterDate(preStart, preEnd)
  .median()
  .clip(aoi);

var postImage = s2
  .filterDate(postStart, postEnd)
  .median()
  .clip(aoi);


// ==========================================================
// 5. ADD SPECTRAL INDICES
// ==========================================================
function addIndices(img) {
  var ndvi = img.normalizedDifference(['B8', 'B4']).rename('NDVI');
  var nbr  = img.normalizedDifference(['B8', 'B12']).rename('NBR');
  var ndmi = img.normalizedDifference(['B8', 'B11']).rename('NDMI');
  var nbr2 = img.normalizedDifference(['B11', 'B12']).rename('NBR2');

  return img.addBands([ndvi, nbr, ndmi, nbr2]);
}

preImage = addIndices(preImage);
postImage = addIndices(postImage);


// ==========================================================
// 6. VISUALIZATION
// ==========================================================
var rgbVis = {
  bands: ['B4', 'B3', 'B2'],
  min: 0.02,
  max: 0.30
};

var falseColorVis = {
  bands: ['B12', 'B8', 'B4'],
  min: 0.02,
  max: 0.40
};

Map.addLayer(preImage, rgbVis, 'Pre-fire RGB');
Map.addLayer(postImage, rgbVis, 'Post-fire RGB');
Map.addLayer(postImage, falseColorVis, 'Post-fire SWIR-NIR-RED');


// ==========================================================
// 7. dNBR CALCULATION
// ==========================================================
var preNBR = preImage.select('NBR');
var postNBR = postImage.select('NBR');

var dNBR = preNBR.subtract(postNBR).rename('dNBR');

var dNBRVis = {
  min: -0.5,
  max: 1.0,
  palette: ['white', 'green', 'yellow', 'orange', 'red', 'darkred']
};

Map.addLayer(dNBR, dNBRVis, 'dNBR');


// ==========================================================
// 8. BURN SEVERITY CLASSES
// ==========================================================
var burnSeverity = ee.Image(0)
  .where(dNBR.lt(0.10), 0)
  .where(dNBR.gte(0.10).and(dNBR.lt(0.27)), 1)
  .where(dNBR.gte(0.27).and(dNBR.lt(0.44)), 2)
  .where(dNBR.gte(0.44).and(dNBR.lt(0.66)), 3)
  .where(dNBR.gte(0.66), 4)
  .rename('BurnSeverity');

var severityPalette = [
  'c7c7c7',
  'ffffb2',
  'fecc5c',
  'fd8d3c',
  'e31a1c'
];

Map.addLayer(
  burnSeverity,
  {min: 0, max: 4, palette: severityPalette},
  'Burn Severity (dNBR)'
);


// ==========================================================
// 9. CONSERVATIVE BURNED AREA MASK
// ==========================================================
var preNDVI = preImage.select('NDVI');
var postNDVI = postImage.select('NDVI');
var dNDVI = postNDVI.subtract(preNDVI).rename('dNDVI');

Map.addLayer(dNDVI, {
  min: -0.6,
  max: 0.6,
  palette: ['red', 'orange', 'white', 'lightgreen', 'darkgreen']
}, 'dNDVI');

var burned_dNBR = dNBR.gte(0.40)
  .and(preNDVI.gte(0.45))
  .and(postNDVI.lte(0.22))
  .and(dNDVI.lte(-0.25))
  .and(postNBR.lte(0.10))
  .selfMask()
  .rename('burned_dNBR');

Map.addLayer(
  burned_dNBR,
  {palette: ['red']},
  'Conservative Burned Area from dNBR'
);


// ==========================================================
// 10. TOTAL BURNED AREA FROM dNBR (km²)
// ==========================================================
var burnedArea_dNBR_m2 = burned_dNBR
  .multiply(ee.Image.pixelArea())
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: aoi,
    scale: 10,
    maxPixels: 1e13,
    tileScale: 4
  });

var burnedArea_dNBR_km2 = ee.Number(burnedArea_dNBR_m2.get('burned_dNBR'))
  .divide(1e6);

print('Conservative burned area from dNBR (km²):', burnedArea_dNBR_km2);


// ==========================================================
// 11. dNBR CLASS AREAS (km²)
// ==========================================================
var severityAreaImage = ee.Image.pixelArea().addBands(burnSeverity);

var severityAreaStats = severityAreaImage.reduceRegion({
  reducer: ee.Reducer.sum().group({
    groupField: 1,
    groupName: 'class'
  }),
  geometry: aoi,
  scale: 10,
  maxPixels: 1e13,
  tileScale: 4
});

// print('Burn severity class areas (m²):', severityAreaStats);

var severityGroups = ee.List(severityAreaStats.get('groups'));

var severityNames = ee.Dictionary({
  '0': 'Unburned / Very Low',
  '1': 'Low Severity',
  '2': 'Moderate-Low Severity',
  '3': 'Moderate-High Severity',
  '4': 'High Severity'
});

var severityAreaNamed = severityGroups.map(function(item) {
  item = ee.Dictionary(item);
  var clsNum = ee.Number(item.get('class'));
  var clsStr = clsNum.format();
  var areaKm2 = ee.Number(item.get('sum')).divide(1e6);

  return ee.Dictionary({
    class_id: clsNum,
    class_name: severityNames.get(clsStr),
    area_km2: areaKm2
  });
});

print('Burn severity class areas (km²):', severityAreaNamed);


// ==========================================================
// 11B. dNBR HISTOGRAM
// ==========================================================
var dNBRHistogram = ui.Chart.image.histogram({
  image: dNBR,
  region: aoi,
  scale: 10,
  maxBuckets: 100
})
.setOptions({
  title: 'dNBR Histogram',
  hAxis: {
    title: 'dNBR Value',
    viewWindow: {min: -0.5, max: 1.0}
  },
  vAxis: {
    title: 'Pixel Count'
  },
  legend: {position: 'none'}
});

print(dNBRHistogram);


// ==========================================================
// 11C. BURN SEVERITY AREA CHART (km²)
// ==========================================================
var severityFeatures = ee.FeatureCollection(severityGroups.map(function(item) {
  item = ee.Dictionary(item);
  var cls = ee.Number(item.get('class'));
  var areaKm2 = ee.Number(item.get('sum')).divide(1e6);

  return ee.Feature(null, {
    class_id: cls,
    class_name: ee.Algorithms.If(cls.eq(0), 'Unburned / Very Low',
                 ee.Algorithms.If(cls.eq(1), 'Low Severity',
                 ee.Algorithms.If(cls.eq(2), 'Moderate-Low',
                 ee.Algorithms.If(cls.eq(3), 'Moderate-High', 'High Severity')))),
    area_km2: areaKm2
  });
}));

var severityChart = ui.Chart.feature.byFeature({
  features: severityFeatures,
  xProperty: 'class_name',
  yProperties: ['area_km2']
})
.setChartType('ColumnChart')
.setOptions({
  title: 'Burn Severity Classes by Area (km²)',
  hAxis: {title: 'Burn Severity Class'},
  vAxis: {title: 'Area (km²)'},
  legend: {position: 'none'}
});

print(severityChart);


// ==========================================================
// 11D. THRESHOLD VALUES
// ==========================================================
print('dNBR Thresholds used for burn severity classification:');
print('Class 0  -> dNBR < 0.10');
print('Class 1  -> 0.10 ≤ dNBR < 0.27');
print('Class 2  -> 0.27 ≤ dNBR < 0.44');
print('Class 3  -> 0.44 ≤ dNBR < 0.66');
print('Class 4  -> dNBR ≥ 0.66');

print('Conservative burned-area mask thresholds:');
print('dNBR >= 0.40');
print('preNDVI >= 0.45');
print('postNDVI <= 0.22');
print('dNDVI <= -0.25');
print('postNBR <= 0.10');


// ==========================================================
// 12. TRAINING POLYGONS -> FEATURE COLLECTION
// ==========================================================
var burnedSamples = ee.FeatureCollection([
  ee.Feature(burned, {'class': 0})
]);

var vegetationSamples = ee.FeatureCollection([
  ee.Feature(vegetation, {'class': 1})
]);

var urbanSamples = ee.FeatureCollection([
  ee.Feature(urban, {'class': 2})
]);

var bareSoilSamples = ee.FeatureCollection([
  ee.Feature(bareSoil, {'class': 3})
]);

var trainingPolygons = burnedSamples
  .merge(vegetationSamples)
  .merge(urbanSamples)
  .merge(bareSoilSamples);


// ==========================================================
// 13. BANDS FOR CLASSIFICATION
// ==========================================================
var sarImage = s1_post.addBands(s1_ratio);

var combinedImage = postImage
  .addBands(sarImage);

var bands = [
  'B2','B3','B4','B8','B11','B12',
  'NDVI','NBR','NDMI','NBR2',
  'VV','VH','VVVH'
];

var classifiedImageInput = combinedImage.select(bands);


// ==========================================================
// 14. SAMPLE TRAINING DATA
// ==========================================================
var training = classifiedImageInput.sampleRegions({
  collection: trainingPolygons,
  properties: ['class'],
  scale: 10,
  geometries: true
});

print('Training samples:', training.limit(10));
print('Total sample count:', training.size());


// ==========================================================
// 15. TRAIN / TEST SPLIT
// ==========================================================
var withRandom = training.randomColumn('random');

var trainSet = withRandom.filter(ee.Filter.lt('random', 0.7));
var testSet  = withRandom.filter(ee.Filter.gte('random', 0.7));

print('Train set size:', trainSet.size());
print('Test set size:', testSet.size());


// ==========================================================
// 16. RANDOM FOREST CLASSIFIER
// ==========================================================
var rfClassifier = ee.Classifier.smileRandomForest({
  numberOfTrees: 100
}).train({
  features: trainSet,
  classProperty: 'class',
  inputProperties: bands
});


// ==========================================================
// 17. CLASSIFICATION
// ==========================================================
var classified = classifiedImageInput.classify(rfClassifier);

var classPalette = [
  'ff0000', // burned
  '00cc00', // vegetation
  '999999', // urban
  'c2b280'  // bare soil
];

Map.addLayer(
  classified,
  {min: 0, max: 3, palette: classPalette},
  'Random Forest Classification'
);


// ==========================================================
// 18. ACCURACY ASSESSMENT
// ==========================================================
var validated = testSet.classify(rfClassifier);

var confusionMatrix = validated.errorMatrix('class', 'classification');

print('Confusion Matrix:', confusionMatrix);
print('Overall Accuracy:', confusionMatrix.accuracy());
print('Kappa:', confusionMatrix.kappa());
print('Producer Accuracy:', confusionMatrix.producersAccuracy());
print('User Accuracy:', confusionMatrix.consumersAccuracy());


// ==========================================================
// 19. VARIABLE IMPORTANCE
// ==========================================================
var explanation = rfClassifier.explain();
print('RF variable importance / explanation:', explanation);


// ==========================================================
// 20. RF BURNED AREA (km²)
// ==========================================================
var burned_RF = classified.eq(0).selfMask().rename('burned_RF');

Map.addLayer(burned_RF, {palette: ['orange']}, 'Burned Area from RF');

var burnedArea_RF_m2 = burned_RF
  .multiply(ee.Image.pixelArea())
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: aoi,
    scale: 10,
    maxPixels: 1e13,
    tileScale: 4
  });

var burnedArea_RF_km2 = ee.Number(burnedArea_RF_m2.get('burned_RF'))
  .divide(1e6);

print('Burned area from Random Forest (km²):', burnedArea_RF_km2);


// ==========================================================
// 21. RF CLASS AREA STATS (km²)
// ==========================================================
var rfAreaImage = ee.Image.pixelArea().addBands(classified);

var rfAreaStats = rfAreaImage.reduceRegion({
  reducer: ee.Reducer.sum().group({
    groupField: 1,
    groupName: 'class'
  }),
  geometry: aoi,
  scale: 10,
  maxPixels: 1e13,
  tileScale: 4
});

// print('RF class areas (m²):', rfAreaStats);

var rfGroups = ee.List(rfAreaStats.get('groups'));

var rfNames = ee.Dictionary({
  '0': 'Burned',
  '1': 'Vegetation',
  '2': 'Urban',
  '3': 'Bare Soil'
});

var rfAreaNamed = rfGroups.map(function(item) {
  item = ee.Dictionary(item);
  var clsNum = ee.Number(item.get('class'));
  var clsStr = clsNum.format();
  var areaKm2 = ee.Number(item.get('sum')).divide(1e6);

  return ee.Dictionary({
    class_id: clsNum,
    class_name: rfNames.get(clsStr),
    area_km2: areaKm2
  });
});

print('RF class areas (km²):', rfAreaNamed);


// ==========================================================
// 21B. RF CLASS AREA CHART (km²)
// ==========================================================
var rfFeatures = ee.FeatureCollection(rfGroups.map(function(item) {
  item = ee.Dictionary(item);
  var cls = ee.Number(item.get('class'));
  var areaKm2 = ee.Number(item.get('sum')).divide(1e6);

  return ee.Feature(null, {
    class_id: cls,
    class_name: ee.Algorithms.If(cls.eq(0), 'Burned',
                 ee.Algorithms.If(cls.eq(1), 'Vegetation',
                 ee.Algorithms.If(cls.eq(2), 'Urban', 'Bare Soil'))),
    area_km2: areaKm2
  });
}));

var rfChart = ui.Chart.feature.byFeature({
  features: rfFeatures,
  xProperty: 'class_name',
  yProperties: ['area_km2']
})
.setChartType('ColumnChart')
.setOptions({
  title: 'Random Forest Class Areas (km²)',
  hAxis: {title: 'Class'},
  vAxis: {title: 'Area (km²)'},
  legend: {position: 'none'}
});

print(rfChart);


// ==========================================================
// 21C. MACHINE LEARNING HISTOGRAM
// RF sınıflarının piksel dağılımı
// ==========================================================
var rfHistogram = ui.Chart.image.histogram({
  image: classified,
  region: aoi,
  scale: 10,
  maxBuckets: 10
})
.setOptions({
  title: 'Random Forest Classification Histogram',
  hAxis: {
    title: 'Class ID (0=Burned, 1=Vegetation, 2=Urban, 3=Bare Soil)'
  },
  vAxis: {
    title: 'Pixel Count'
  },
  legend: {position: 'none'}
});

print(rfHistogram);


// ==========================================================
// 21D. TRAINING SAMPLE DISTRIBUTION CHART
// ==========================================================
var sampleChart = ui.Chart.feature.byFeature({
  features: ee.FeatureCollection([
    ee.Feature(null, {class_name: 'Burned', sample_count: burned.area(1).divide(100)}),
    ee.Feature(null, {class_name: 'Vegetation', sample_count: vegetation.area(1).divide(100)}),
    ee.Feature(null, {class_name: 'Urban', sample_count: urban.area(1).divide(100)}),
    ee.Feature(null, {class_name: 'Bare Soil', sample_count: bareSoil.area(1).divide(100)})
  ]),
  xProperty: 'class_name',
  yProperties: ['sample_count']
})
.setChartType('ColumnChart')
.setOptions({
  title: 'Approximate Training Sample Distribution',
  hAxis: {title: 'Training Class'},
  vAxis: {title: 'Relative Sample Size'},
  legend: {position: 'none'}
});

print(sampleChart);


// ==========================================================
// 22. METHOD COMPARISON
// ==========================================================
var comparison = ee.FeatureCollection([
  ee.Feature(null, {
    method: 'dNBR',
    burned_area_km2: burnedArea_dNBR_km2
  }),
  ee.Feature(null, {
    method: 'Random Forest',
    burned_area_km2: burnedArea_RF_km2
  })
]);

print('Comparison of burned area estimates (km²):', comparison);


// ==========================================================
// 22B. METHOD COMPARISON CHART
// ==========================================================
var comparisonChart = ui.Chart.feature.byFeature({
  features: comparison,
  xProperty: 'method',
  yProperties: ['burned_area_km2']
})
.setChartType('ColumnChart')
.setOptions({
  title: 'Comparison of Burned Area Estimates (km²)',
  hAxis: {title: 'Method'},
  vAxis: {title: 'Burned Area (km²)'},
  legend: {position: 'none'}
});

print(comparisonChart);


// ==========================================================
// 23. EXPORTS
// ==========================================================
Export.image.toDrive({
  image: classified,
  description: 'RF_Classification_Wildfire',
  folder: 'GEE_outputs',
  fileNamePrefix: 'RF_Classification_Wildfire',
  region: aoi,
  scale: 10,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: dNBR,
  description: 'dNBR_Wildfire',
  folder: 'GEE_outputs',
  fileNamePrefix: 'dNBR_Wildfire',
  region: aoi,
  scale: 10,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: burnSeverity,
  description: 'BurnSeverity_Wildfire',
  folder: 'GEE_outputs',
  fileNamePrefix: 'BurnSeverity_Wildfire',
  region: aoi,
  scale: 10,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: burned_dNBR,
  description: 'BurnedArea_dNBR_Conservative',
  folder: 'GEE_outputs',
  fileNamePrefix: 'BurnedArea_dNBR_Conservative',
  region: aoi,
  scale: 10,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: burned_RF,
  description: 'BurnedArea_RF_Binary',
  folder: 'GEE_outputs',
  fileNamePrefix: 'BurnedArea_RF_Binary',
  region: aoi,
  scale: 10,
  maxPixels: 1e13
});
