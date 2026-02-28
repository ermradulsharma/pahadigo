import LocationController from '../../src/core/Http/Controllers/LocationController.js';
import Country from '../../src/core/Models/Country.js';

describe('Location API Controller Test Suite', () => {

    it('should paginate countries based on URL searchParams', async () => {
        await Country.create([
            { name: 'India', isoCode: 'IN', phoneCode: '+91', currency: 'INR' },
            { name: 'USA', isoCode: 'US', phoneCode: '+1', currency: 'USD' }
        ]);

        const req = {
            url: new URL('http://localhost/api/location/countries?limit=1&page=1')
        };

        const res = await LocationController.getCountries(req);
        expect(res.status).toBe(200);
        const data = await res.json();

        expect(data.data.countries.length).toBe(1);
        expect(data.data.pagination.total).toBe(2);
        expect(data.data.pagination.totalPages).toBe(2);
    });

    it('should get country by parameter id', async () => {
        const country = await Country.create({
            name: 'Canada', isoCode: 'CA', phoneCode: '+1', currency: 'CAD'
        });

        const req = {};
        const params = { id: country._id.toString() };

        const res = await LocationController.getCountryById(req, { params });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.data.country.name).toBe('Canada');
    });
});
