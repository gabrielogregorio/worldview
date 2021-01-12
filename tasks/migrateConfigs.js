
const _ = require('lodash');
const fs = require('fs');
const dir = require('node-dir');

const { GIT_HOME } = process.env;
const SOURCE_DIR = './config/default/common/config/wv.json/layers/';
const DEST_DIR = `${GIT_HOME}/layers-config/layer-metadata/v1.0/`;
const WV_JSON_PATH = './build/options/config/wv.json';

const OVERWRITE_EXISTING = false;

let wvJson = {};
let metadataCount = 0;
const measurementsMap = {};
const measurementsArray = [];
const periodIntervalMap = {
  daily: 'Day',
  monthly: 'Month',
  yearly: 'Year',
};

const errCallback = (err) => {
  if (err) {
    console.log(err);
    throw err;
  }
};

function capitalizeFirstLetter(string) {
  return !string ? '' : string.charAt(0).toUpperCase() + string.slice(1);
}

function setLayerProp (layer, prop, value) {
  const featuredMeasurement = prop === 'measurements' && (value && value.includes('Featured'));
  if (!layer || featuredMeasurement) {
    return;
  }
  if (!layer[prop]) {
    layer[prop] = [value];
  } else if (!layer[prop].includes(value)) {
    layer[prop].push(value);
  }
}

function generateMeasurements (layers, measurementsConfig) {
  _.forEach(measurementsConfig, (measureObj, measureKey) => {
    _.forEach(measureObj.sources, ({ settings = [] }, sourceKey) => {
      settings.forEach((id) => {
        setLayerProp(layers[id], 'measurements', measureKey);
        if (!measurementsArray.includes(measureKey)) {
          measurementsArray.push(measureKey);
        }
      });
    });
  });
  _.forEach(layers, ({ measurements }, id) => {
    // Reduce to a single measurement:
    if (id.toLowerCase().includes('orbit')) {
      measurementsMap[id] = 'Orbital Track';
    } else {
      // eslint-disable-next-line prefer-destructuring
      measurementsMap[id] = measurements[0];
    }
    // Unmodified output (all measurements):
    // measurementsMap[id] = measurements;
  });
  // fs.writeFile(`${DEST_DIR}measurements.json`, JSON.stringify(measurementsMap, null, 2), errCallback);
}

function setPeriodProps(wvJsonLayer, outputLayer) {
  const { period, dateRanges, id } = wvJsonLayer;
  if (!period) {
    console.log('No layer period for:', id);
  }

  if (!dateRanges) {
    outputLayer.period = capitalizeFirstLetter(period);
    return;
  }
  const dateIntervals = (dateRanges || []).map(({ dateInterval }) => dateInterval);
  const firstInterval = Number.parseInt(dateIntervals[0], 10);
  const consistentIntervals = dateIntervals.every((interval) => {
    const parsedInterval = Number.parseInt(interval, 10);
    return parsedInterval === firstInterval;
  });

  outputLayer.period = capitalizeFirstLetter(period);

  if (period === 'subdaily' || firstInterval === 1) {
    return;
  }

  if (consistentIntervals && firstInterval <= 16) {
    outputLayer.period = `${firstInterval}-${periodIntervalMap[period]}`;
  } else if (id.includes('7Day')) {
    outputLayer.period = '7-Day';
  } else if (id.includes('5Day')) {
    outputLayer.period = '5-Day';
  } else if (id.includes('Monthly')) {
    outputLayer.period = 'Monthly';
  } else if (id.includes('Weekly')) {
    outputLayer.period = '7-Day';
  } else {
    outputLayer.period = `Multi-${periodIntervalMap[period]}`;
  }
}

function modifyProps (layerObj) {
  const {
    id, title, subtitle, tracks, daynight, inactive,
  } = layerObj;
  const wvJsonLayerObj = wvJson.layers[id];
  if (!wvJsonLayerObj) {
    console.error(`Layer ${title} not found in wv.json, run build script!`);
    return;
  }

  const {
    startDate, endDate, dateRanges, period,
  } = wvJsonLayerObj;
  const staticLayer = !startDate && !endDate && !dateRanges;

  const modifiedObj = {
    title,
    subtitle,
    ongoing: staticLayer ? false : !inactive,
    measurement: measurementsMap[id],
    retentionPeriod: -1,
  };

  if (daynight) {
    modifiedObj.daynight = daynight;
  }

  if (tracks && period !== 'monthly') {
    modifiedObj.orbitTracks = [];
    modifiedObj.orbitDirection = [];
    tracks.forEach((track) => {
      modifiedObj.orbitTracks.push(track);
      if (wvJson.layers[track]) {
        modifiedObj.orbitDirection.push(wvJson.layers[track].track);
      } else {
        console.log('Orbit track not found', track);
      }
    });
  }
  if (period) {
    // WARNING:  Not totally accurate, will need to identify N-Day layers.
    // modifiedObj.period = wvJsonLayerObj.period;
    setPeriodProps(wvJsonLayerObj, modifiedObj);
  }
  return modifiedObj;
}

function migrate(filePath) {
  const pathStrings = filePath.split('/');
  const fileName = pathStrings[pathStrings.length - 1];
  if (!fileName.includes('.json')) {
    return;
  }

  const layerJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const fileLayerId = fileName.slice(0, fileName.length - 5);
  const id = Object.keys(layerJson.layers)[0];
  if (fileLayerId !== id) {
    console.warn('Mismatched ids!', filePath);
  }
  const layerPropsObj = layerJson.layers[id];
  if (!layerPropsObj) {
    console.error('No layer data for:', filePath);
    return;
  }

  const newObj = modifyProps(layerPropsObj);
  fs.open(`${DEST_DIR}${fileName}`, 'wx', (err) => {
    if (err && err.code === 'EEXIST' && !OVERWRITE_EXISTING) {
      return;
    }
    fs.writeFile(`${DEST_DIR}${fileName}`, JSON.stringify(newObj, null, 2), errCallback);
    metadataCount += 1;
  });
}

dir.files(SOURCE_DIR, (err, files) => {
  if (err) throw err;
  wvJson = JSON.parse(fs.readFileSync(WV_JSON_PATH, 'utf-8'));
  generateMeasurements(wvJson.layers, wvJson.measurements);
  files.forEach(migrate);

  if (metadataCount > 0) {
    console.log(`Successfully generated ${metadataCount} metadata configs.`);
  } else {
    console.log('No metadata configs were generateed');
  }
});
