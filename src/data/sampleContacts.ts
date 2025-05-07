export interface SampleContact {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  notes?: string;
  tags?: string[];
  source?: string;
}

// Sample Nigerian individual contacts
export const nigerianIndividuals: SampleContact[] = [
  {
    firstName: "Adebayo",
    lastName: "Ogunlesi",
    email: "adebayo.ogunlesi@example.com",
    phone: "+2348012345678",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["prospect", "highvalue"],
    source: "Website"
  },
  {
    firstName: "Ngozi",
    lastName: "Okonjo-Iweala",
    email: "ngozi.okonjo@example.com",
    phone: "+2348023456789",
    city: "Abuja",
    state: "FCT",
    country: "Nigeria",
    tags: ["customer", "vip"],
    source: "Referral"
  },
  {
    firstName: "Chimamanda",
    lastName: "Adichie",
    email: "chimamanda.adichie@example.com",
    phone: "+2347034567890",
    city: "Enugu",
    state: "Enugu",
    country: "Nigeria",
    tags: ["prospect", "influencer"],
    source: "Event"
  },
  {
    firstName: "Aliko",
    lastName: "Dangote",
    email: "aliko.dangote@example.com",
    phone: "+2348045678901",
    city: "Kano",
    state: "Kano",
    country: "Nigeria",
    tags: ["prospect", "business", "vip"],
    source: "Manual Entry"
  },
  {
    firstName: "Funke",
    lastName: "Akindele",
    email: "funke.akindele@example.com",
    phone: "+2347056789012",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["customer", "entertainment"],
    source: "Social Media"
  },
  {
    firstName: "Wole",
    lastName: "Soyinka",
    email: "wole.soyinka@example.com",
    phone: "+2348067890123",
    city: "Abeokuta",
    state: "Ogun",
    country: "Nigeria",
    tags: ["customer", "education"],
    source: "Event"
  },
  {
    firstName: "Genevieve",
    lastName: "Nnaji",
    email: "genevieve.nnaji@example.com",
    phone: "+2347078901234",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["prospect", "entertainment"],
    source: "Social Media"
  },
  {
    firstName: "Muhammadu",
    lastName: "Sanusi",
    email: "muhammadu.sanusi@example.com",
    phone: "+2348089012345",
    city: "Kano",
    state: "Kano",
    country: "Nigeria",
    tags: ["prospect", "finance"],
    source: "Event"
  },
  {
    firstName: "Omotola",
    lastName: "Jalade",
    email: "omotola.jalade@example.com",
    phone: "+2347090123456",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["customer", "entertainment"],
    source: "Website"
  },
  {
    firstName: "Babatunde",
    lastName: "Fashola",
    email: "babatunde.fashola@example.com",
    phone: "+2348001234567",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["prospect", "government"],
    source: "Manual Entry"
  },
  {
    firstName: "Florence",
    lastName: "Ita-Giwa",
    email: "florence.itagiwa@example.com",
    phone: "+2348022345678",
    city: "Calabar",
    state: "Cross River",
    country: "Nigeria",
    tags: ["prospect", "government"],
    source: "Referral"
  },
  {
    firstName: "Peter",
    lastName: "Obi",
    email: "peter.obi@example.com",
    phone: "+2347033456789",
    city: "Onitsha",
    state: "Anambra",
    country: "Nigeria",
    tags: ["customer", "business", "politics"],
    source: "Referral"
  },
  {
    firstName: "Linda",
    lastName: "Ikeji",
    email: "linda.ikeji@example.com",
    phone: "+2348044567890",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["prospect", "media", "influencer"],
    source: "Social Media"
  },
  {
    firstName: "Femi",
    lastName: "Otedola",
    email: "femi.otedola@example.com",
    phone: "+2347055678901",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["prospect", "business", "vip"],
    source: "Event"
  },
  {
    firstName: "Tiwa",
    lastName: "Savage",
    email: "tiwa.savage@example.com",
    phone: "+2348066789012",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["customer", "entertainment", "music"],
    source: "Social Media"
  },
  {
    firstName: "Mike",
    lastName: "Adenuga",
    email: "mike.adenuga@example.com",
    phone: "+2347077890123",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["prospect", "business", "telecom"],
    source: "Manual Entry"
  },
  {
    firstName: "Aisha",
    lastName: "Yesufu",
    email: "aisha.yesufu@example.com",
    phone: "+2348088901234",
    city: "Kano",
    state: "Kano",
    country: "Nigeria",
    tags: ["customer", "activism"],
    source: "Social Media"
  },
  {
    firstName: "Davido",
    lastName: "Adeleke",
    email: "davido.adeleke@example.com",
    phone: "+2347099012345",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["prospect", "entertainment", "music"],
    source: "Event"
  },
  {
    firstName: "Tony",
    lastName: "Elumelu",
    email: "tony.elumelu@example.com",
    phone: "+2348000123456",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["prospect", "business", "finance"],
    source: "Referral"
  },
  {
    firstName: "Amina",
    lastName: "Mohammed",
    email: "amina.mohammed@example.com",
    phone: "+2348011234567",
    city: "Abuja",
    state: "FCT",
    country: "Nigeria",
    tags: ["prospect", "government", "international"],
    source: "Manual Entry"
  },
  {
    firstName: "Burna",
    lastName: "Boy",
    email: "burna.boy@example.com",
    phone: "+2347022345678",
    city: "Port Harcourt",
    state: "Rivers",
    country: "Nigeria",
    tags: ["customer", "entertainment", "music"],
    source: "Social Media"
  },
  {
    firstName: "Chioma",
    lastName: "Ude",
    email: "chioma.ude@example.com",
    phone: "+2348033456789",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["prospect", "media", "entertainment"],
    source: "Event"
  },
  {
    firstName: "John",
    lastName: "Boyega",
    email: "john.boyega@example.com",
    phone: "+2347044567890",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["prospect", "entertainment", "international"],
    source: "Website"
  },
  {
    firstName: "Oby",
    lastName: "Ezekwesili",
    email: "oby.ezekwesili@example.com",
    phone: "+2348055678901",
    city: "Abuja",
    state: "FCT",
    country: "Nigeria",
    tags: ["customer", "government", "education"],
    source: "Referral"
  }
];

// Sample African companies
export const africanCompanies: SampleContact[] = [
  {
    company: "Dangote Group",
    email: "contact@dangote.example.com",
    phone: "+2348066789012",
    address: "1 Dangote Avenue",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "conglomerate", "manufacturing"],
    source: "Manual Entry"
  },
  {
    company: "MTN Nigeria",
    email: "contact@mtn.example.com",
    phone: "+2348077890123",
    address: "MTN Plaza, Ikoyi",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "telecom"],
    source: "Website"
  },
  {
    company: "Globacom Limited",
    email: "contact@glo.example.com",
    phone: "+2347088901234",
    address: "Mike Adenuga Towers",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "telecom"],
    source: "Event"
  },
  {
    company: "First Bank of Nigeria",
    email: "contact@firstbank.example.com",
    phone: "+2348099012345",
    address: "35 Marina",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "banking", "finance"],
    source: "Referral"
  },
  {
    company: "Zenith Bank",
    email: "contact@zenithbank.example.com",
    phone: "+2348000123456",
    address: "Zenith Heights, Ajose Adeogun Street",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "banking", "finance"],
    source: "Website"
  },
  {
    company: "Nigerian Breweries",
    email: "contact@nbplc.example.com",
    phone: "+2347011234567",
    address: "1 Abebe Village Road, Iganmu",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "manufacturing", "consumer"],
    source: "Event"
  },
  {
    company: "Jumia Nigeria",
    email: "contact@jumia.example.com",
    phone: "+2348022345678",
    address: "Jumia House, Ikeja",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "ecommerce", "retail"],
    source: "Manual Entry"
  },
  {
    company: "Flutterwave",
    email: "contact@flutterwave.example.com",
    phone: "+2347033456789",
    address: "Flutterwave HQ, Ikoyi",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "fintech", "technology"],
    source: "Event"
  },
  {
    company: "Interswitch",
    email: "contact@interswitch.example.com",
    phone: "+2348044567890",
    address: "Interswitch House, Ikoyi",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "fintech", "technology"],
    source: "Manual Entry"
  },
  {
    company: "GT Bank",
    email: "contact@gtbank.example.com",
    phone: "+2347055678901",
    address: "GT Bank HQ, Victoria Island",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "banking", "finance"],
    source: "Website"
  },
  {
    company: "United Bank for Africa",
    email: "contact@uba.example.com",
    phone: "+2348066789012",
    address: "UBA House, Marina",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "banking", "finance"],
    source: "Referral"
  },
  {
    company: "Access Bank",
    email: "contact@accessbank.example.com",
    phone: "+2347077890123",
    address: "Access Tower, Victoria Island",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "banking", "finance"],
    source: "Event"
  },
  {
    company: "Oando Plc",
    email: "contact@oando.example.com",
    phone: "+2348088901234",
    address: "Oando Wing Office Complex, Ozumba Mbadiwe Avenue",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "energy", "oil"],
    source: "Manual Entry"
  },
  {
    company: "Paystack",
    email: "contact@paystack.example.com",
    phone: "+2347099012345",
    address: "Paystack HQ, Ikeja",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "fintech", "technology"],
    source: "Event"
  },
  {
    company: "Nairametrics",
    email: "contact@nairametrics.example.com",
    phone: "+2348010123456",
    address: "Nairametrics Office, Lekki",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "media", "finance"],
    source: "Social Media"
  },
  {
    company: "Konga",
    email: "contact@konga.example.com",
    phone: "+2347021234567",
    address: "Konga HQ, Ikeja",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "ecommerce", "retail"],
    source: "Website"
  },
  {
    company: "Nigeria LNG Limited",
    email: "contact@nlng.example.com",
    phone: "+2348032345678",
    address: "NLNG Towers, Abuja",
    city: "Abuja",
    state: "FCT",
    country: "Nigeria",
    tags: ["business", "energy", "gas"],
    source: "Referral"
  },
  {
    company: "Mavin Records",
    email: "contact@mavinrecords.example.com",
    phone: "+2347043456789",
    address: "Mavin HQ, Lekki",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "entertainment", "music"],
    source: "Social Media"
  },
  {
    company: "Sahara Group",
    email: "contact@sahara.example.com",
    phone: "+2348054567890",
    address: "Sahara House, Victoria Island",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "energy", "trading"],
    source: "Manual Entry"
  },
  {
    company: "EbonyLife Media",
    email: "contact@ebonylife.example.com",
    phone: "+2347065678901",
    address: "EbonyLife Place, Victoria Island",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    tags: ["business", "media", "entertainment"],
    source: "Event"
  }
];

// Export a combined list of all contacts
export const allAfricanContacts = [...nigerianIndividuals, ...africanCompanies];

// Combined contacts for exports
export const sampleContacts: SampleContact[] = [
  ...nigerianIndividuals,
  ...africanCompanies
];
