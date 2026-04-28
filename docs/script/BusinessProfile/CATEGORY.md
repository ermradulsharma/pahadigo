const categories = [
    "homestay",
    "hotel",
    "camping",
    "rafting",
    "trekking",
    "bungee-jumping",
    "bike-scooter-rental",
    "chardham-tour",
    "custom-trip",
    "skiing",
    "paragliding"
];

categories.forEach((cat, index) => {
    pm.environment.set(`category_${index}`, cat);
});
