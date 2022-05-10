import { combineReducers } from 'redux';
import { createResponsiveStateReducer } from 'redux-responsive';
import { assign as lodashAssign } from 'lodash';
import { modalReducer, modalAboutPage } from './modal/reducers';
import feedbackReducer from './feedback/reducers';
import projectionReducer from './projection/reducer';
import { locationSearchReducer } from './location-search/reducers';
import { shortLink } from './link/reducers';
import {
  getInitialEventsState,
  requestedEvents,
  requestedEventSources,
  eventsReducer,
  eventRequestResponse,
} from './natural-events/reducers';
import tourReducer from './tour/reducers';
import mapReducer from './map/reducers';
import {
  notificationsRequest,
  notificationsReducer,
} from './notifications/reducers';
import { getProjInitialState } from './projection/util';
import { compareReducer } from './compare/reducers';
import sidebarReducer from './sidebar/reducers';
import {
  layerReducer,
  getInitialState as getLayersInitialState,
} from './layers/reducers';
import {
  dateReducer,
  getInitialState as getDateInitialState,
} from './date/reducers';
import { animationReducer } from './animation/reducers';
import { paletteReducer, getInitialPaletteState } from './palettes/reducers';
import {
  vectorStyleReducer,
  getInitialVectorStyleState,
} from './vector-styles/reducers';
import { imageDownloadReducer } from './image-download/reducers';
import measureReducer from './measure/reducers';
import {
  productPickerReducer,
  getInitialState as getProductPickerInitialState,
} from './product-picker/reducers';
import { LOCATION_POP_ACTION } from '../redux-location-state-customs';

import embedReducers from './embed/reducers';
import uiReducers from './ui/reducers';
import { alertReducer } from './alerts/reducer';
import { smartHandoffReducer, getInitialState as getSmartHandoffInitialState } from './smart-handoff/reducer';
import { getInitialState as getInitialSettingsState, settingsReducer } from './settings/reducer';
import { loadingReducer } from './loading/reducers';

function lastAction(state = null, action) {
  return action;
}

/**
 * Access to page size so various resize listeners are
 * no longer necessary
 */
const responsiveStateReducer = createResponsiveStateReducer(
  null,
  {
    extraFields: () => ({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
    }),
  },
);
/**
 * Get initial module states based on config
 * and parameters
 *
 * @param {Object} models | Legacy models
 * @param {Object} config
 * @param {Object} parameters | parameters parsed from permalink
 */
export function getInitialState(models, config, parameters) {
  return {
    parameters,
    config,
    models,
    date: getDateInitialState(config),
    proj: getProjInitialState(config),
    layers: getLayersInitialState(config),
    events: getInitialEventsState(config),
    settings: getInitialSettingsState(),
    requestedEvents: eventRequestResponse(),
    requestedEventSources: eventRequestResponse(),
    smartHandoffs: getSmartHandoffInitialState(config),
    palettes: getInitialPaletteState(config),
    productPicker: getProductPickerInitialState(config),
    vectorStyles: getInitialVectorStyleState(config),
  };
}
const locationReducer = (state = { key: '' }, action) => {
  if (action.type === LOCATION_POP_ACTION) {
    return lodashAssign({}, state, { key: action.payload.key });
  }
  return state;
};
const defaultReducer = (state = {}) => state;
const reducers = {
  alerts: alertReducer,
  animation: animationReducer,
  browser: responsiveStateReducer,
  config: defaultReducer,
  compare: compareReducer,
  date: dateReducer,
  embed: embedReducers,
  events: eventsReducer,
  feedback: feedbackReducer,
  imageDownload: imageDownloadReducer,
  lastAction,
  layers: layerReducer,
  loading: loadingReducer,
  location: locationReducer,
  locationSearch: locationSearchReducer,
  map: mapReducer,
  measure: measureReducer,
  modal: modalReducer,
  modalAboutPage,
  models: defaultReducer,
  notifications: notificationsReducer,
  notificationsRequest,
  palettes: paletteReducer,
  parameters: defaultReducer,
  productPicker: productPickerReducer,
  proj: projectionReducer,
  requestedEvents,
  requestedEventSources,
  settings: settingsReducer,
  shortLink,
  sidebar: sidebarReducer,
  smartHandoffs: smartHandoffReducer,
  tour: tourReducer,
  ui: uiReducers,
  vectorStyles: vectorStyleReducer,
};
const appReducer = combineReducers(reducers);

/**
 * Top level reducer function w/ option to reset state
 */
export default (state, action) => {
  if (action.type === 'APP_RESET') {
    state = undefined;
  }

  return appReducer(state, action);
};
