const mongoose = require('mongoose');

const uri = "mongodb://skywalkerlknw_db_user:Zf413Ft9BVgYReQz@ac-g0g4ohr-shard-00-00.clydegc.mongodb.net:27017,ac-g0g4ohr-shard-00-01.clydegc.mongodb.net:27017,ac-g0g4ohr-shard-00-02.clydegc.mongodb.net:27017/pahadigo_db?ssl=true&replicaSet=atlas-c0vsyl-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

const schema = new mongoose.Schema({}, { strict: false });
const Package = mongoose.model('Package', schema, 'packages');

async function run() {
    try {
        await mongoose.connect(uri);
        console.log('Connected. Starting migration...');
        const packages = await Package.find({});
        let updatedCount = 0;

        for (const pkg of packages) {
            let changed = false;
            let doc = pkg.toObject();

            // Fix Homestays
            if (doc.homestay && Array.isArray(doc.homestay)) {
                for (let i = 0; i < doc.homestay.length; i++) {
                    if (typeof doc.homestay[i].mealsIncluded === 'string') {
                        const oldVal = doc.homestay[i].mealsIncluded;
                        const isNoMeals = !oldVal || oldVal.toLowerCase() === 'no meals' || oldVal.toLowerCase() === 'false';

                        doc.homestay[i].mealsIncluded = !isNoMeals;
                        doc.homestay[i].mealType = oldVal || 'No Meals';
                        changed = true;
                    }
                }
            }

            // Fix Campings
            if (doc.camping && Array.isArray(doc.camping)) {
                for (let i = 0; i < doc.camping.length; i++) {
                    if (typeof doc.camping[i].mealsIncluded === 'string') {
                        const oldVal = doc.camping[i].mealsIncluded;
                        const isNoMeals = !oldVal || oldVal.toLowerCase() === 'no meals' || oldVal.toLowerCase() === 'false';

                        doc.camping[i].mealsIncluded = !isNoMeals;
                        doc.camping[i].mealType = oldVal || 'No Meals';
                        changed = true;
                    }
                }
            }

            if (changed) {
                await Package.updateOne({ _id: doc._id }, {
                    $set: {
                        homestay: doc.homestay,
                        camping: doc.camping
                    }
                });
                updatedCount++;
            }
        }

        console.log(`Successfully migrated ${updatedCount} packages. Mongoose CastError should be resolved.`);
    } catch (err) {
        console.error("Migration error: ", err);
    } finally {
        process.exit(0);
    }
}

run();
