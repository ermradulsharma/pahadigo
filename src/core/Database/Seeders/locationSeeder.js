import CountryModel from '../../Models/Country.js';
import StateModel from '../../Models/State.js';
import { Country, State } from 'country-state-city';

export const seedLocations = async () => {
    try {
        console.log('Seeding Locations from country-state-city...');

        const allCountries = Country.getAllCountries();
        let countriesCreated = 0;
        let statesCreated = 0;

        for (const c of allCountries) {
            try {
                // validation check
                if (!c.currency) {
                    console.warn(`Skipping ${c.name} (${c.isoCode}): No currency defined`);
                    continue;
                }

                const countryData = {
                    name: c.name,
                    isoCode: c.isoCode,
                    phoneCode: c.phonecode.startsWith('+') ? c.phonecode : `+${c.phonecode}`,
                    currency: c.currency,
                    status: 'active'
                };

                const countryDoc = await CountryModel.findOneAndUpdate(
                    { isoCode: c.isoCode },
                    countryData,
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                countriesCreated++;

                // Get states for this country
                const countryStates = State.getStatesOfCountry(c.isoCode);

                if (countryStates && countryStates.length > 0) {
                    const stateOps = countryStates.map(s => ({
                        updateOne: {
                            filter: { country: countryDoc._id, code: s.isoCode },
                            update: {
                                $set: {
                                    name: s.name,
                                    code: s.isoCode,
                                    country: countryDoc._id,
                                    status: 'active'
                                }
                            },
                            upsert: true
                        }
                    }));

                    // Batch process states
                    if (stateOps.length > 0) {
                        try {
                            await StateModel.bulkWrite(stateOps);
                            statesCreated += stateOps.length;
                        } catch (stateError) {
                            console.error(`Error seeding states for ${c.name}:`, stateError.message);
                        }
                    }
                }
            } catch (countryError) {
                console.error(`Error seeding country ${c.name}:`, countryError.message);
            }
        }

        console.log(`Seeding complete. Processed ${countriesCreated} countries and ${statesCreated} states.`);
        return true;
    } catch (error) {
        console.error('Error seeding locations:', error);
        return false;
    }
};
