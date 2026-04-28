// 1. Helper Functions
const randArr = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randNum = (n) => Math.floor(Math.pow(10, n - 1) + Math.random() * 9 * Math.pow(10, n - 1));

// 2. Names
const firstNames = ["Rohan", "Siddharth", "Vikram", "Arjun", "Aditya", "Ishaan", "Kabir", "Aryan", "Ananya", "Ishita", "Kavya", "Sana", "Meera", "Riya", "Priyanka", "Deepika"];
const lastNames = ["Sharma", "Verma", "Gupta", "Malhotra", "Kapoor", "Rawat", "Negi", "Chauhan", "Bhatt", "Joshi", "Thakur", "Singh", "Bisht", "Pandey"];
const fullName = `${randArr(firstNames)} ${randArr(lastNames)}`;

// 3. Bank List
const banks = [
    { name: "State Bank of India", code: "SBIN" },
    { name: "HDFC Bank", code: "HDFC" },
    { name: "ICICI Bank", code: "ICIC" },
    { name: "Axis Bank", code: "UTIB" },
    { name: "Punjab National Bank", code: "PUNB" },
    { name: "Bank of Baroda", code: "BARB" },
    { name: "Canara Bank", code: "CNRB" },
    { name: "Union Bank of India", code: "UBIN" },
    { name: "Indian Bank", code: "IDIB" },
    { name: "Bank of India", code: "BKID" },
    { name: "Central Bank of India", code: "CBIN" },
    { name: "Indian Overseas Bank", code: "IOBA" },
    { name: "UCO Bank", code: "UCBA" },
    { name: "Punjab & Sind Bank", code: "PSIB" },
    { name: "Yes Bank", code: "YESB" },
    { name: "Kotak Mahindra Bank", code: "KKBK" },
    { name: "IndusInd Bank", code: "INDB" },
    { name: "IDFC First Bank", code: "IDFB" },
    { name: "Bandhan Bank", code: "BDBL" },
    { name: "Federal Bank", code: "FDRL" },
    { name: "South Indian Bank", code: "SIBL" },
    { name: "RBL Bank", code: "RATN" },
    { name: "DCB Bank", code: "DCBL" },
    { name: "Karnataka Bank", code: "KARB" },
    { name: "Karur Vysya Bank", code: "KVBL" },
    { name: "City Union Bank", code: "CIUB" },
    { name: "CSB Bank", code: "CSBK" },
    { name: "Jammu & Kashmir Bank", code: "JAKA" },
    { name: "Tamilnad Mercantile Bank", code: "TMBL" },
    { name: "Dhanlaxmi Bank", code: "DLXB" }
];
const bank = randArr(banks);
const bankName = bank.name;
const bankCode = bank.code;
const accountNumber = randNum(12).toString();
const ifscCode = `${bankCode}0${randNum(6)}`;

// bank
pm.collectionVariables.set("holderName", fullName);
pm.collectionVariables.set("bankName", bankName);
pm.collectionVariables.set("bankAccount", accountNumber);
pm.collectionVariables.set("ifscCode", ifscCode);
