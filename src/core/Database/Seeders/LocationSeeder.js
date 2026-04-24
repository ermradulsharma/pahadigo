import CountryModel from '../../Models/Country.js';
import StateModel from '../../Models/State.js';
import { Country, State } from 'country-state-city';
import { STATUS } from '../../Constants/index.js';

export const seedLocations = async () => {
    try {
        const allCountries = Country.getAllCountries();
        let countriesCreated = 0;
        let statesCreated = 0;

        for (const c of allCountries) {
            try {
                if (!c.currency) {
                    console.warn(`Skipping ${c.name} (${c.isoCode}): No currency defined`);
                    continue;
                }

                const countryData = {
                    name: c.name,
                    isoCode: c.isoCode,
                    phoneCode: c.phonecode.startsWith('+') ? c.phonecode : `+${c.phonecode}`,
                    currency: c.currency,
                    status: STATUS.ACTIVE
                };

                const countryDoc = await CountryModel.findOneAndUpdate(
                    { isoCode: c.isoCode },
                    countryData,
                    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
                );
                countriesCreated++;

                const countryStates = State.getStatesOfCountry(c.isoCode);

                if (countryStates && countryStates.length > 0) {
                    const stateOps = countryStates.map(s => ({
                        updateOne: {
                            filter: {
                                country: countryDoc._id,
                                $or: [
                                    { code: s.isoCode },
                                    { name: s.name }
                                ]
                            },
                            update: {
                                $set: {
                                    name: s.name,
                                    code: s.isoCode,
                                    country: countryDoc._id,
                                    status: STATUS.ACTIVE
                                }
                            },
                            upsert: true
                        }
                    }));

                    if (stateOps.length > 0) {
                        try {
                            await StateModel.bulkWrite(stateOps, { ordered: false });
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
        return true;
    } catch (error) {
        console.error('Error seeding locations:', error);
        return false;
    }
};

export default seedLocations;
