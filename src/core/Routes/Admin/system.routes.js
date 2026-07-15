import SettingsController from '@/core/Controllers/Admin/SettingsController.js';
import LocationController from '@/core/Controllers/Admin/LocationController.js';
import PolicyController from '@/core/Controllers/Admin/PolicyController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    ...Router.group({ prefix: '/settings' }, [
        { method: 'GET', path: '/', handler: wrap(() => SettingsController, 'getSettings') },
        { method: 'POST', path: '/', schema: schemas.settingsUpdate, handler: wrap(() => SettingsController, 'updateSettings') },
    ]),
    ...Router.group({ prefix: '/policies' }, [
        { method: 'GET', path: '/', handler: wrap(() => PolicyController, 'getPolicies') },
        { method: 'POST', path: '/', schema: schemas.policy, handler: wrap(() => PolicyController, 'savePolicy') },
        { method: 'POST', path: '/seed', schema: schemas.settingsUpdate, handler: wrap(() => PolicyController, 'seed') },
    ]),
    { method: 'POST', path: '/countries', schema: schemas.locationCountry, handler: wrap(() => LocationController, 'createCountry') },
    { method: 'POST', path: '/states', schema: schemas.locationState, handler: wrap(() => LocationController, 'createState') },
];
