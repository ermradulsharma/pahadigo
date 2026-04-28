const randArr = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomDOB = (minAge = 18, maxAge = 60) => {
    const today = new Date();
    const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
    const dob = new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()));
    return dob.toISOString().split("T")[0];
}

const genders = ["Male", "Female", "Other"];
const gender = randArr(genders);

const designations = ["Tour Manager", "Adventure Guide", "Trek Leader", "Rafting Instructor", "Travel Consultant", "Operations Head", "Fleet Manager", "Base Camp Coordinator", "Booking Executive", "Destination Expert", "Pilgrimage Coordinator", "Visa & Documentation Expert", "Transport Coordinator", "Camp Manager"];
const designation = randArr(designations);

const personalAboutMe = [
    "As a dedicated and passionate travel professional with extensive experience traversing the majestic Himalayan ranges, I have dedicated my life to curating unforgettable adventures for thrill-seekers and nature lovers alike. From organizing high-altitude treks to ensuring seamless logistics for peaceful retreats, my goal is to provide every traveler with a safe, enriching, and deeply transformative journey that connects them profoundly with the rich cultural heritage and breathtaking landscapes of the mountains.",
    "My journey in the travel industry began out of a profound love for discovering uncharted territories and sharing those hidden gems with others. Specializing in bespoke itineraries, I focus on eco-friendly and sustainable tourism practices that protect our beautiful environment while offering travelers a luxurious and comfortable experience. Whether you are looking for a rigorous mountain expedition or a serene lakeside homestay, I pride myself on meticulous planning, personalized care, and a deep understanding of local traditions.",
    "With over a decade of hands-on experience in adventure sports and outdoor hospitality, I have built a reputation for delivering high-adrenaline yet meticulously safe travel experiences. As an outdoor enthusiast myself, I understand the pulse of adventure seekers and strive to design itineraries that push boundaries while adhering to the highest safety standards. From white-water rafting down the Ganges to organizing rigorous alpine expeditions, I am committed to making every trip an exhilarating story worth sharing for a lifetime.",
    "I am deeply committed to the art of mindful travel, believing that every journey should be an immersive cultural exchange rather than just a sightseeing tour. By collaborating closely with local communities, I design travel experiences that offer authentic insights into regional lifestyles, cuisines, and artisanal crafts. My extensive network across various regions allows me to provide exclusive access to off-the-beaten-path destinations, ensuring that our guests enjoy a unique, culturally rich, and highly personalized travel experience.",
    "Bringing years of expertise in hospitality management and travel operations, I specialize in curating premium, hassle-free vacations tailored to the unique preferences of each guest. My approach combines rigorous attention to detail with an unwavering commitment to customer satisfaction. From coordinating luxury transport and premium accommodations to arranging specialized local guides, I ensure that every aspect of the journey is executed flawlessly, allowing travelers to relax completely and immerse themselves in the beauty of their destination.",
    "As an avid explorer and seasoned travel consultant, my expertise lies in transforming travel dreams into meticulously planned realities. I have spent years traversing diverse terrains to handpick the best accommodations, routes, and experiences. My dedication to customer service means I am available around the clock to address any concerns, ensuring a smooth and delightful trip. Whether it's a spiritual pilgrimage, a challenging trek, or a relaxing family holiday, I bring passion, local knowledge, and professional excellence to every itinerary.",
    "Having grown up amidst the stunning landscapes of the mountains, my connection to nature and local tourism is both personal and professional. I leverage my deep-rooted local insights to offer travelers an authentic taste of mountain life. My specialty ranges from organizing intimate cultural tours in remote villages to coordinating large-scale adventure camps. I am highly focused on safety, local sustainability, and creating a welcoming atmosphere that makes every guest feel like part of our extended mountain family during their stay.",
    "I am a meticulous travel coordinator who thrives on the complex logistics of organizing seamless group tours and corporate retreats in challenging environments. With a strong background in crisis management and outdoor survival, I ensure that all excursions are not only thrilling but extraordinarily safe. My passion lies in crafting dynamic itineraries that blend intense physical activity with moments of profound relaxation and mindfulness, providing a balanced and rejuvenating experience for every participant under my guidance.",
    "Driven by a lifelong passion for heritage and history, I specialize in educational and culturally immersive travel experiences that bring ancient traditions to life. I spend countless hours researching and validating the historical significance of the sites we visit, ensuring that our travelers receive an engaging and factually rich narrative. My goal is to foster a deep appreciation for our monumental heritage, offering guided experiences that are as intellectually stimulating as they are visually and emotionally awe-inspiring.",
    "As a dedicated specialist in bespoke luxury travel, I cater to discerning clients who expect nothing less than perfection. I meticulously vet every resort, transport provider, and local guide to ensure they meet our uncompromising standards of excellence. My personalized approach means that I take the time to understand the unique desires of each traveler, crafting tailor-made itineraries that feature exclusive access to hidden retreats, private cultural performances, and gourmet dining experiences that define the pinnacle of luxury.",
    "With a vibrant background in outdoor photography and visual storytelling, I design travel experiences that are specifically tailored for creatives and visual artists. I know the optimal times for natural lighting and the most breathtaking, secluded vantage points that typical tours overlook. Beyond just managing logistics, I help travelers capture the soul of their destination. My tours are visually driven, slow-paced, and deeply observant, allowing guests the time and space needed to truly connect with the environment they are capturing.",
    "My professional ethos is built around the concept of sustainable and regenerative tourism. I have dedicated my career to developing travel models that actively benefit local ecosystems and indigenous communities. By organizing eco-camps, conservation-focused treks, and community-led cultural exchanges, I provide travelers with the opportunity to give back to the places they visit. I believe that responsible travel is the future, and I am deeply committed to leading by example in every itinerary I design and execute."
];
const personalAbout = randArr(personalAboutMe);

const website =

const socialLinks = [
    { name: "instagram", link: "https://www.instagram.com/" },
    { name: "facebook", link: "https://www.facebook.com/" },
    { name: "youtube", link: "https://www.youtube.com/" },
    { name: "twitter", link: "https://www.twitter.com/" },
    { name: "linkedin", link: "https://www.linkedin.com/" },
    { name: "telegram", link: "https://www.telegram.com/" },
    { name: "tiktok", link: "https://www.tiktok.com/" },
    { name: "snapchat", link: "https://www.snapchat.com/" },
    { name: "pinterest", link: "https://www.pinterest.com/" },
    { name: "tumblr", link: "https://www.tumblr.com/" },
    { name: "reddit", link: "https://www.reddit.com/" }
]



