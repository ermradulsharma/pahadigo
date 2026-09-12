import LocationController from '@/core/Controllers/General/LocationController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';

export default [
    ...Router.group({ prefix: '/' }, [
        { method: 'GET', path: '/countries', handler: wrap(() => LocationController, 'getCountries') },
        { method: 'GET', path: '/countries/:id', handler: wrap(() => LocationController, 'getCountryById') },
        { method: 'GET', path: '/states', handler: wrap(() => LocationController, 'getStates') },
        { method: 'GET', path: '/countries/:id/states', handler: wrap(() => LocationController, 'getStatesByCountry') },
    ]),
];
