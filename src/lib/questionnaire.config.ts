export type QuestionType =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "radio";

export type Question = {
  id: string;
  label: string;
  type: QuestionType;
  placeholder?: string;
  options?: string[];
  required: boolean;
  helpText?: string;
};

export type QuestionSection = {
  title: string;
  description?: string;
  questions: Question[];
};

export const questionnaireSections: QuestionSection[] = [
  // ── 1. YOUR BUSINESS ──────────────────────────────────────────────
  {
    title: "Your Business",
    description:
      "Tell us about your black car service so we can build the right platform for you.",
    questions: [
      {
        id: "business_name",
        label: "What is your business name?",
        type: "text",
        placeholder: "Elite Black Car Service",
        required: true,
      },
      {
        id: "years_in_business",
        label: "How long have you been in business?",
        type: "select",
        options: [
          "Less than 1 year",
          "1–2 years",
          "3–5 years",
          "6–10 years",
          "10+ years",
        ],
        required: true,
      },
      {
        id: "service_types",
        label: "What services do you offer?",
        type: "multiselect",
        options: [
          "Airport Transfers",
          "Point-to-Point",
          "Hourly / As Directed",
          "Corporate / Executive",
          "Weddings & Events",
          "Prom & Nightlife",
          "Tours",
          "Medical Transport",
          "Other",
        ],
        required: true,
        helpText:
          "These will be listed in your booking tool for customers to select from.",
      },
      {
        id: "service_types_other",
        label: 'You selected "Other" — please describe:',
        type: "text",
        placeholder: "e.g. Funeral transport, wine tours, film & production...",
        required: false,
        helpText: "This will be added to your list of services on the site.",
      },
      {
        id: "operates_247",
        label: "Do you operate 24/7?",
        type: "radio",
        options: ["Yes, 24/7", "No, set hours"],
        required: true,
      },
      {
        id: "operating_hours",
        label: "If not 24/7, what are your operating hours?",
        type: "text",
        placeholder:
          "e.g. Monday–Friday 6am–11pm, Saturday–Sunday 8am–midnight",
        required: false,
      },
      {
        id: "advance_booking_minimum",
        label: "What is the minimum notice required for online bookings?",
        type: "select",
        options: [
          "2 hours",
          "6 hours",
          "12 hours",
          "24 hours",
          "36 hours",
          "48 hours",
        ],
        required: true,
      },
      {
        id: "fleet_size",
        label: "How many vehicles are in your fleet?",
        type: "select",
        options: ["1–3", "4–10", "11–25", "26–50", "50+"],
        required: true,
      },
    ],
  },

  // ── 2. YOUR STORY ─────────────────────────────────────────────────
  {
    title: "Your Story",
    description:
      "This helps us write compelling About Us content that connects with your customers.",
    questions: [
      {
        id: "founded_year",
        label: "What year was the business founded?",
        type: "text",
        placeholder: "e.g. 2015",
        required: true,
      },
      {
        id: "founder_name",
        label: "Who founded the business?",
        type: "text",
        placeholder: "e.g. Marcus Williams",
        required: false,
        helpText:
          "Optional — only used if you want to feature the founder's name on the site.",
      },
      {
        id: "founding_story",
        label: "What inspired you to start the business?",
        type: "textarea",
        placeholder:
          "e.g. After 10 years driving for a national company, I wanted to build something local and personal — where clients always knew their driver and trusted the service...",
        required: false,
        helpText:
          "Even a few sentences helps us write an authentic story for your About page.",
      },
      {
        id: "service_philosophy",
        label:
          "How would you describe your service philosophy in one or two sentences?",
        type: "textarea",
        placeholder:
          "e.g. We believe every ride should feel like you're the only client — punctual, professional, and effortless from booking to drop-off.",
        required: true,
      },
      {
        id: "differentiators",
        label: "What do you do better than any other service in your market?",
        type: "textarea",
        placeholder:
          "e.g. Every driver has 5+ years experience, undergoes background checks, and completes hospitality training. We also offer real-time flight tracking at no extra charge.",
        required: true,
        helpText:
          "Be specific — this becomes a key selling point on your homepage.",
      },
      {
        id: "owner_operator",
        label: "Is the business owner-operated or family-owned?",
        type: "radio",
        options: [
          "Yes, owner-operated",
          "Yes, family-owned",
          "No, professionally managed",
        ],
        required: true,
      },
      {
        id: "feature_team",
        label: "Do you want to feature yourself or your team on the site?",
        type: "radio",
        options: [
          "Yes, feature the owner",
          "Yes, feature the team",
          "No, keep it company-focused",
        ],
        required: true,
      },
      {
        id: "certifications",
        label:
          "Do you have any certifications, memberships, or affiliations worth showcasing?",
        type: "textarea",
        placeholder:
          "e.g. NLA member, BBB Accredited, Licensed & Insured, TCP12345A, GBTA member...",
        required: false,
        helpText:
          "These build trust and credibility with corporate and high-value clients.",
      },
      {
        id: "google_rating",
        label: "Do you have a Google rating or review count to display?",
        type: "text",
        placeholder: "e.g. 4.9 stars · 180 reviews",
        required: false,
        helpText:
          "If you have strong reviews, we can feature them prominently on your homepage.",
      },
      {
        id: "notable_clients",
        label:
          "Have you served any notable clients, events, or venues? (optional, vague references are fine)",
        type: "textarea",
        placeholder:
          "e.g. We regularly serve executives from Fortune 500 companies, have worked with the Super Bowl host committee, and are the preferred vendor for XYZ Resort.",
        required: false,
      },
    ],
  },

  // ── 3. CONTACT & SOCIAL ───────────────────────────────────────────
  {
    title: "Contact & Social",
    description:
      "This information will be displayed on your website so customers can reach you.",
    questions: [
      {
        id: "public_phone",
        label: "What phone number should be displayed on the site?",
        type: "text",
        placeholder: "e.g. (602) 555-0182",
        required: true,
      },
      {
        id: "public_email",
        label: "What email address should be displayed on the site?",
        type: "text",
        placeholder: "e.g. bookings@eliteblackcar.com",
        required: true,
      },
      {
        id: "show_address",
        label: "Do you want to display a physical address on the site?",
        type: "radio",
        options: [
          "Yes — display full address",
          "City and state only",
          "No — do not display an address",
        ],
        required: true,
      },
      {
        id: "physical_address",
        label: "If yes, what is your address?",
        type: "text",
        placeholder: "e.g. 1234 N Scottsdale Rd, Scottsdale, AZ 85251",
        required: false,
      },
      {
        id: "contact_preference",
        label: "How do you prefer customers contact you for general inquiries?",
        type: "radio",
        options: [
          "Phone call only",
          "Email only",
          "Contact form on the site",
          "Phone or email — either is fine",
        ],
        required: true,
      },
      {
        id: "social_instagram",
        label: "Instagram handle",
        type: "text",
        placeholder: "@eliteblackcar",
        required: false,
      },
      {
        id: "social_facebook",
        label: "Facebook page URL or name",
        type: "text",
        placeholder: "facebook.com/eliteblackcar",
        required: false,
      },
      {
        id: "social_yelp",
        label: "Yelp business URL",
        type: "text",
        placeholder: "yelp.com/biz/elite-black-car",
        required: false,
      },
      {
        id: "social_other",
        label: "Any other social or review profiles to link?",
        type: "text",
        placeholder: "e.g. LinkedIn, Google Business, TripAdvisor...",
        required: false,
      },
    ],
  },

  // ── 4. YOUR MARKET ────────────────────────────────────────────────
  {
    title: "Your Market",
    description:
      "Help us understand where you operate, who you serve, and who you work with.",
    questions: [
      {
        id: "primary_city",
        label: "What is your primary service city?",
        type: "text",
        placeholder: "Phoenix, AZ",
        required: true,
      },
      {
        id: "state_coverage",
        label: "Which cities or regions within your state do you cover?",
        type: "textarea",
        placeholder:
          "e.g. Phoenix, Scottsdale, Tempe, Mesa, Chandler, Gilbert, Glendale, Paradise Valley, Sedona",
        required: true,
        helpText:
          "Be as specific as possible — this helps us build accurate coverage maps and booking radius logic.",
      },
      {
        id: "out_of_state",
        label: "Do you serve destinations outside your state?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "out_of_state_details",
        label: "If yes, which states or destinations?",
        type: "textarea",
        placeholder: "e.g. Las Vegas, NV and Los Angeles, CA on request",
        required: false,
      },
      {
        id: "out_of_area_surcharge",
        label:
          "Are there areas you serve but charge extra for (rural, out-of-county, long distance)?",
        type: "textarea",
        placeholder:
          "e.g. Sedona and Flagstaff are available but quoted separately",
        required: false,
      },
      {
        id: "airports_served",
        label: "Which airports do you serve?",
        type: "textarea",
        placeholder:
          "e.g. Phoenix Sky Harbor (PHX), Scottsdale Airport (SDL), Las Vegas McCarran (LAS)",
        required: true,
        helpText:
          "List all airports you service. Include the airport code if you know it.",
      },
      {
        id: "primary_clients",
        label: "Who are your primary clients?",
        type: "multiselect",
        options: [
          "Corporate / Executive",
          "Airport Travelers",
          "Wedding Parties",
          "Prom / Special Events",
          "Nightlife / Parties",
          "Medical Patients",
          "Tourists / Visitors",
          "Hotel Guests",
          "Golf & Resort Guests",
        ],
        required: true,
      },
      {
        id: "partnerships",
        label:
          "Do you have preferred vendor relationships or partnerships with any local businesses?",
        type: "multiselect",
        options: [
          "Hotels",
          "Casinos",
          "Golf Resorts",
          "Wedding Venues",
          "Corporate Campuses",
          "Hospitals / Medical Centers",
          "Sports Venues",
          "Concert / Entertainment Venues",
          "Travel Agencies",
          "None currently",
        ],
        required: true,
        helpText:
          "These can be featured on your site to build credibility and attract referral traffic.",
      },
      {
        id: "partnership_names",
        label:
          "If you have partnerships, which businesses? (only list ones you're comfortable displaying publicly)",
        type: "textarea",
        placeholder:
          "e.g. Preferred vendor for JW Marriott Desert Ridge, Four Seasons Scottsdale, and Talking Stick Resort",
        required: false,
      },
      {
        id: "booking_volume",
        label: "How many bookings do you handle per month on average?",
        type: "select",
        options: ["1–10", "11–30", "31–60", "61–100", "100+"],
        required: true,
      },
    ],
  },

  // ── 5. PRICING & PAYMENTS ─────────────────────────────────────────
  {
    title: "Pricing & Payments",
    description:
      "Help us understand how you price your services and handle payments.",
    questions: [
      {
        id: "fare_structure",
        label: "How are your fares primarily calculated?",
        type: "radio",
        options: [
          "Flat rates by zone or city pair",
          "Mileage or time-based",
          "Hourly rate",
          "Hybrid — depends on service type",
        ],
        required: true,
      },
      {
        id: "deposit_required",
        label: "Do you require a deposit to confirm a booking?",
        type: "radio",
        options: [
          "Yes — fixed deposit amount",
          "Yes — percentage of total fare",
          "No — full payment upfront",
          "No — pay after the trip",
        ],
        required: true,
      },
      {
        id: "deposit_amount",
        label: "If a deposit is required, what is it?",
        type: "text",
        placeholder: "e.g. $50 flat, or 25% of fare",
        required: false,
      },
      {
        id: "gratuity",
        label: "How do you handle gratuity?",
        type: "radio",
        options: [
          "Included in the fare",
          "Added as a fixed percentage at checkout",
          "Optional — customer chooses at checkout",
          "Not applicable",
        ],
        required: true,
      },
      {
        id: "surcharges",
        label: "Do you apply any surcharges?",
        type: "multiselect",
        options: [
          "Late night / early morning",
          "Holiday rates",
          "Large events (concerts, sports, conventions)",
          "Extra stops",
          "Meet & greet / sign service",
          "Child seats",
          "Out-of-area / long distance",
          "None",
        ],
        required: true,
      },
      {
        id: "cancellation_policy",
        label: "What is your cancellation policy?",
        type: "textarea",
        placeholder:
          "e.g. Full refund if cancelled 24+ hours before pickup. 50% refund within 24 hours. No refund within 4 hours.",
        required: true,
        helpText:
          "This will be displayed to customers during booking and on your site.",
      },
    ],
  },

  // ── 6. FLEET & VEHICLES ───────────────────────────────────────────
  {
    title: "Fleet & Vehicles",
    description:
      "Tell us about your vehicles so we can present them correctly on your booking platform.",
    questions: [
      {
        id: "vehicle_types",
        label: "What types of vehicles do you operate?",
        type: "multiselect",
        options: [
          "Sedan",
          "SUV",
          "Stretch Limousine",
          "Party Bus",
          "Sprinter Van",
          "Coach Bus",
          "Exotic / Luxury",
        ],
        required: true,
      },
      {
        id: "vehicle_list",
        label: "List your vehicles — make, model, year, and max passengers",
        type: "textarea",
        placeholder:
          "2023 Cadillac Escalade — up to 6 passengers\n2022 Mercedes Sprinter — up to 12 passengers\n2021 Lincoln Town Car — up to 3 passengers",
        required: true,
        helpText:
          "One vehicle per line. Include passenger capacity so we can enforce limits at booking.",
      },
      {
        id: "vehicle_selection_style",
        label: "How should customers choose their vehicle?",
        type: "radio",
        options: [
          "By category only (e.g. Sedan, SUV, Van)",
          "By specific vehicle (e.g. 2023 Cadillac Escalade)",
        ],
        required: true,
      },
      {
        id: "vehicle_substitution",
        label:
          "Do you ever substitute vehicles if the booked vehicle is unavailable?",
        type: "radio",
        options: [
          "Yes, and customers should be notified",
          "Yes, at our discretion without notification",
          "No, never",
        ],
        required: true,
      },
      {
        id: "ev_vehicles",
        label: "Do you have any electric or hybrid vehicles to highlight?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
    ],
  },

  // ── 7. AIRPORT PICKUPS ────────────────────────────────────────────
  {
    title: "Airport Pickups",
    description:
      "Airport transfers have unique timing and logistics — help us get this right.",
    questions: [
      {
        id: "airport_pickup_offered",
        label: "Do you offer airport pickup services?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "flight_tracking",
        label: "How do you handle flight delays for airport pickups?",
        type: "radio",
        options: [
          "We track flights manually",
          "We want automatic flight tracking integrated into the booking",
          "We do not adjust for flight delays",
        ],
        required: false,
      },
      {
        id: "wait_time_airport",
        label:
          "How long do you wait after a flight lands before marking a no-show?",
        type: "select",
        options: ["30 minutes", "45 minutes", "60 minutes", "90 minutes"],
        required: false,
      },
      {
        id: "airport_meetgreet",
        label:
          "Do you offer meet & greet service (driver holds a sign at arrivals)?",
        type: "radio",
        options: [
          "Yes, always included",
          "Yes, available at an extra charge",
          "No",
        ],
        required: false,
      },
      // {
      //   id: "recommend_pickup_time",
      //   label:
      //     "Do you want the booking system to auto-recommend departure pickup times based on distance and time of day?",
      //   type: "radio",
      //   options: ["Yes", "No", "Not sure yet"],
      //   required: false,
      //   helpText:
      //     "e.g. Automatically suggest leaving 90 minutes before a domestic flight.",
      // },
    ],
  },

  // ── 8. CURRENT SETUP ──────────────────────────────────────────────
  {
    title: "Current Setup",
    description: "Tell us about your existing tools and online presence.",
    questions: [
      {
        id: "current_website",
        label: "Do you have a current website?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "current_website_url",
        label: "If yes, what is the URL?",
        type: "text",
        placeholder: "https://www.yoursite.com",
        required: false,
      },
      {
        id: "current_booking_platform",
        label: "What booking platform are you currently using?",
        type: "select",
        options: [
          "Limo Anywhere",
          "Ground Alliance",
          "Fastrack",
          "Blacklane",
          "Manual / Phone only",
          "Other",
          "None",
        ],
        required: true,
      },
      {
        id: "competitor_sites",
        label: "Are there any competitor websites you admire?",
        type: "textarea",
        placeholder:
          "https://www.example.com — I like their homepage layout and how they show vehicles...",
        required: false,
        helpText:
          "Share URLs and what you like about them. This helps us understand your taste.",
      },
    ],
  },

  // ── 9. POLICIES ───────────────────────────────────────────────────
  {
    title: "Policies",
    description:
      "These will be displayed to customers during and after booking.",
    questions: [
      {
        id: "wait_time_pointtopoint",
        label:
          "How long do you wait at point-to-point pickups before marking a no-show?",
        type: "select",
        options: ["5 minutes", "10 minutes", "15 minutes", "No set limit"],
        required: true,
      },
      {
        id: "child_seats",
        label: "What is your child seat policy?",
        type: "radio",
        options: [
          "We provide them on request",
          "Customers must bring their own",
          "Not applicable",
        ],
        required: true,
      },
      {
        id: "pets_policy",
        label: "What is your pet policy?",
        type: "radio",
        options: ["Pets allowed", "Service animals only", "No pets"],
        required: true,
      },
      {
        id: "ada_compliance",
        label: "Do you have ADA-compliant or wheelchair-accessible vehicles?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "tcp_number",
        label:
          "Do you have a TCP or operating permit number to display on your site?",
        type: "text",
        placeholder: "e.g. TCP12345A",
        required: false,
        helpText:
          "Some clients and corporate accounts require this for compliance.",
      },
      {
        id: "damage_fee",
        label: "Do you charge a cleaning or damage fee?",
        type: "radio",
        options: ["Yes — fixed amount", "Yes — assessed case by case", "No"],
        required: true,
      },
      {
        id: "damage_fee_amount",
        label: "If fixed, what is the fee?",
        type: "text",
        placeholder: "e.g. $250 cleaning fee",
        required: false,
      },
    ],
  },

  // ── 10. BRAND & DESIGN ────────────────────────────────────────────
  {
    title: "Brand & Design",
    description:
      "Help us capture the look and feel you want for your platform.",
    questions: [
      {
        id: "brand_adjectives",
        label: "How would you describe your brand in 3 words?",
        type: "text",
        placeholder: "Premium, professional, reliable",
        required: true,
      },
      {
        id: "design_style",
        label: "Which design style resonates most with your brand?",
        type: "radio",
        options: [
          "Clean & minimal",
          "Bold & high contrast",
          "Luxury & editorial",
          "Classic & traditional",
          "Modern & tech-forward",
        ],
        required: true,
      },
      {
        id: "color_preferences",
        label: "Do you have brand colors? If so, what are they?",
        type: "textarea",
        placeholder: "Black, gold, and white — or HEX codes if you have them",
        required: false,
      },
      {
        id: "logo_status",
        label: "Do you have a logo?",
        type: "radio",
        options: [
          "Yes, I have a final logo",
          "Yes, but I want it refreshed",
          "No, I need a logo",
        ],
        required: true,
      },
    ],
  },

  // ── 11. GOALS & TIMELINE ──────────────────────────────────────────
  {
    title: "Goals & Timeline",
    description: "Let us know what success looks like for you.",
    questions: [
      {
        id: "primary_goal",
        label: "What is your #1 goal for your new website?",
        type: "radio",
        options: [
          "Get more direct bookings",
          "Look more professional / credible",
          "Reduce phone call volume",
          "Compete with larger companies",
          "Launch my business online for the first time",
        ],
        required: true,
      },
      {
        id: "launch_urgency",
        label: "How soon do you need the site live?",
        type: "select",
        options: [
          "ASAP — within 2 weeks",
          "Within a month",
          "1–2 months",
          "No hard deadline",
        ],
        required: true,
      },
      {
        id: "additional_notes",
        label: "Is there anything else you want us to know?",
        type: "textarea",
        placeholder:
          "Any special requirements, ideas, or context that would help us build the right platform for you...",
        required: false,
        helpText: "This is your chance to tell us anything we haven't asked.",
      },
    ],
  },
];
