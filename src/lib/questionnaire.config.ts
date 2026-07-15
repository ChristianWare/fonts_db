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
        id: "service_details_top",
        label:
          "For your 2-3 most important services, describe each in a few sentences: what's included, who typically books it, and anything you do differently.",
        type: "textarea",
        placeholder:
          "e.g. Airport transfers: we track every flight, include 45 minutes of wait time, and the driver texts when they're curbside. Corporate: the same 3 senior drivers handle all runs for consistency...",
        required: true,
        helpText:
          "Each service you offer gets its own page on your site. This is the raw material for that copy — specifics beat adjectives every time.",
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
          "Tell us the one moment or experience that shaped how you run this business. A specific story beats a polished mission statement every time.",
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
        id: "customer_feedback",
        label: "What do customers actually tell you after a great experience?",
        type: "textarea",
        placeholder:
          "e.g. 'Your driver felt like a friend, not just a chauffeur.' 'I've never used a service that actually showed up early.' 'My wife couldn't stop talking about how clean the car was.'",
        required: false,
        helpText:
          "Real quotes or paraphrases. This is often the most authentic positioning because it's how customers describe you, not how you describe yourself.",
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
        id: "awards_press",
        label: "Have you received any awards, press, or media features?",
        type: "textarea",
        placeholder:
          "e.g. Best of Phoenix 2023 (PHX Magazine), featured in AZ Big Media, guest on 'The Black Car Pulse' podcast, 5-Star Diamond Award from AAHS",
        required: false,
        helpText:
          "Awards, press mentions, podcast appearances, blog features — anything we can showcase as third-party validation.",
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
        id: "booking_notification_destination",
        label:
          "Where should new booking notifications be sent? (This can be different from your public contact info.)",
        type: "text",
        placeholder: "e.g. dispatch@eliteblackcar.com, and text (602) 555-0143",
        required: true,
        helpText:
          "Every online booking pings this email and/or phone number the moment it comes in.",
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
      {
        id: "current_reviews_breakdown",
        label:
          "Where do you currently have customer reviews, and roughly how many on each?",
        type: "textarea",
        placeholder:
          "e.g. Google: 180 reviews, 4.9 stars\nYelp: 45 reviews, 4.5 stars\nTripAdvisor: 22 reviews, 5.0 stars\nFacebook: 30 recommendations",
        required: false,
        helpText:
          "We'll feature reviews from multiple platforms to build trust with AI search engines like ChatGPT, which pull from across the web — not just Google.",
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
        id: "priority_cities",
        label:
          "Which 3-5 cities or areas do most of your bookings come from today?",
        type: "textarea",
        placeholder:
          "e.g. Scottsdale and Paradise Valley are about 60% of our business, then Phoenix, Tempe, and airport runs from all over the Valley",
        required: true,
        helpText:
          "We build a dedicated page for every city you serve — this tells us which ones to build first and feature most prominently.",
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
        id: "customer_search_trigger",
        label: "What event or feeling makes someone search for your service?",
        type: "textarea",
        placeholder:
          "e.g. They have a 5am flight and don't want rideshare uncertainty. Their daughter's wedding is in two weeks and they need a guaranteed-on-time shuttle. They're hosting executives flying in for a board meeting and want to make a strong impression.",
        required: true,
        helpText:
          "The more specific, the better. This captures real customer intent and feeds the hero copy on your service pages.",
      },
      {
        id: "common_phone_questions",
        label: "What questions do customers keep asking on the phone?",
        type: "textarea",
        placeholder:
          "e.g. 'Do you have meet & greet at the airport?' 'How far in advance do I need to book?' 'What happens if my flight is delayed?' 'Can you accommodate 12 people?'",
        required: false,
        helpText:
          "These become your FAQ content. If customers ask it, it should be answered on the site.",
      },
      {
        id: "customer_to_refuse",
        label: "What kind of customer would you politely turn away?",
        type: "textarea",
        placeholder:
          "e.g. We don't do bar crawls or rowdy parties. We don't take last-minute (under 2 hours) bookings because we can't guarantee quality. We don't compete on price.",
        required: false,
        helpText:
          "Defining who you don't serve is often clearer than defining who you do. This helps us position the brand correctly.",
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
        id: "corporate_accounts_offered",
        label: "Do you offer corporate accounts?",
        type: "radio",
        options: [
          "Yes — with monthly invoicing / net terms",
          "Yes — card on file, no invoicing",
          "Not yet, but I'd like to",
          "No",
        ],
        required: true,
        helpText:
          "If yes, we'll build a dedicated corporate accounts page with an account request form — these are typically an operator's highest-value clients.",
      },
      {
        id: "corporate_accounts_details",
        label: "If yes, how do corporate accounts work with you today?",
        type: "textarea",
        placeholder:
          "e.g. Net-30 invoicing, a dedicated booking email their assistants use, monthly ride summaries, priority dispatch",
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
        id: "rate_card",
        label:
          "Paste your current rates or price list — whatever format you have.",
        type: "textarea",
        placeholder:
          "e.g. PHX airport to Scottsdale: $95 sedan / $120 SUV. Hourly: $85/hr sedan, 3-hour minimum. Point-to-point: $3.50/mile, $75 minimum",
        required: false,
        helpText:
          "It doesn't need to be polished. We'll map your exact fare logic together on the kickoff call — having your real numbers up front makes that call twice as fast.",
      },
      {
        id: "hourly_minimum",
        label: "If you offer hourly service, what is your minimum booking?",
        type: "select",
        options: ["No minimum", "2 hours", "3 hours", "4 hours", "5+ hours"],
        required: false,
      },
      {
        id: "payment_methods",
        label: "Which payment methods do you accept?",
        type: "multiselect",
        options: [
          "Credit / debit cards",
          "Cash",
          "Corporate invoicing / net terms",
          "Zelle / Venmo / Cash App",
          "Checks",
        ],
        required: true,
        helpText: "Displayed in your FAQ and used to configure your checkout.",
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
        id: "vehicle_amenities",
        label: "What amenities come standard in your vehicles?",
        type: "multiselect",
        options: [
          "Bottled water",
          "Phone chargers",
          "WiFi",
          "Leather interior",
          "Privacy partition",
          "Umbrellas",
          "Booster / child seats available",
          "Other",
        ],
        required: true,
        helpText:
          "Amenities go on your fleet pages — they're what separate premium positioning from a ride quote.",
      },
      {
        id: "luggage_capacity",
        label: "Roughly how much luggage fits in each vehicle type?",
        type: "textarea",
        placeholder:
          "e.g. Sedan: 3 large bags. Escalade: 6 large bags plus carry-ons. Sprinter: 12+ bags",
        required: false,
        helpText:
          "Airport travelers ask this constantly — showing it at booking prevents a family of five with skis from booking a sedan.",
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
        id: "existing_urls_to_preserve",
        label:
          "Are there specific pages on your current site that rank well or are commonly bookmarked?",
        type: "textarea",
        placeholder:
          "e.g. /airport-transfers and /weddings get most of our traffic. /book-now is in our email signatures.",
        required: false,
        helpText:
          "If we're migrating from an existing site, we'll set up 301 redirects so you don't lose existing search rankings or break customer-facing links.",
      },
      {
        id: "existing_traffic_volume",
        label:
          "Roughly how much monthly traffic does your current site get? (best guess is fine)",
        type: "select",
        options: [
          "Don't know / no analytics",
          "Less than 100 visits/month",
          "100–500 visits/month",
          "500–2,000 visits/month",
          "2,000–10,000 visits/month",
          "10,000+ visits/month",
        ],
        required: false,
        helpText:
          "This helps us baseline what success looks like after the new site launches.",
      },
      {
        id: "analytics_access",
        label:
          "Is Google Analytics or Google Search Console set up on your current site?",
        type: "radio",
        options: [
          "Yes — and I have login access",
          "Yes — but someone else controls it",
          "No / not sure",
        ],
        required: false,
        helpText:
          "If it exists, we'll pull your real search data to protect your rankings during migration and baseline your before-and-after.",
      },
      {
        id: "domain_control",
        label:
          "Where is your domain registered, and do you have access to manage DNS?",
        type: "text",
        placeholder:
          "e.g. GoDaddy, with full admin access — or — set up by a previous developer, I'll need to recover access",
        required: false,
        helpText:
          "We'll need DNS access to point your domain to the new site at launch. If you don't have it, we'll help you recover it.",
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
    ],
  },

  // ── 9. ONLINE PRESENCE ────────────────────────────────────────────
  {
    title: "Online Presence",
    description:
      "Your Google Business Profile and other listings are critical for local search and AI visibility. Let us know what's already set up so we can connect everything together.",
    questions: [
      {
        id: "gbp_status",
        label: "Do you have a Google Business Profile?",
        type: "radio",
        options: [
          "Yes — claimed and verified, I have admin access",
          "Yes — but I'm not sure if I have admin access",
          "Yes — but it's unclaimed",
          "No — never set one up",
        ],
        required: true,
        helpText:
          "Your GBP is the most important asset you have for local search. We'll audit and optimize it during setup.",
      },
      {
        id: "gbp_url",
        label:
          "If yes, what's the URL of your Google Maps listing? (or just paste the business name as it appears on Google)",
        type: "text",
        placeholder:
          "e.g. https://maps.google.com/?cid=... or 'Elite Black Car Service, Scottsdale'",
        required: false,
      },
      {
        id: "gbp_primary_category",
        label: "What is your primary GBP category, if you know it?",
        type: "text",
        placeholder: "e.g. Limousine Service, Chauffeur Service, Car Service",
        required: false,
        helpText:
          "This is the single most important field on your GBP — it determines what searches you show up for. We'll review it during setup.",
      },
      {
        id: "bing_places",
        label: "Do you have a Bing Places for Business profile?",
        type: "radio",
        options: ["Yes", "No", "Not sure"],
        required: true,
        helpText:
          "Bing Places matters because ChatGPT and other AI search tools pull from Bing's index, not Google's. If you don't have one yet, we'll help you set it up.",
      },
      {
        id: "other_directories",
        label: "Are you listed on any other directories or platforms?",
        type: "textarea",
        placeholder:
          "e.g. Apple Maps, BBB, NLA member directory, local chamber of commerce, hotel concierge lists, AAA approved",
        required: false,
        helpText:
          "We'll make sure your business info (name, address, phone) is consistent across all of these — inconsistencies hurt your local search rankings.",
      },
    ],
  },

  // ── 10. POLICIES ──────────────────────────────────────────────────
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

  // ── 11. BRAND & DESIGN ────────────────────────────────────────────
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
        id: "tagline",
        label: "Do you have a tagline or slogan customers already know?",
        type: "text",
        placeholder:
          "e.g. Arrive like you mean it — or leave blank and we'll write one",
        required: false,
      },
      {
        id: "words_to_avoid",
        label:
          "Are there any words or phrases you don't want appearing on your site?",
        type: "textarea",
        placeholder:
          "e.g. Never use 'cheap', 'budget', or 'discount' — we're a premium service. Avoid 'limo' since we're black car, not party limos.",
        required: false,
        helpText:
          "Hard constraints are often more useful than soft preferences. These protect the brand voice across every page we write.",
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
      {
        id: "competitors_to_beat",
        label: "Which competitors do you want to outrank or outshine?",
        type: "textarea",
        placeholder:
          "e.g. AZ Limo (azlimo.com), Phoenix Black Car (phoenixblackcar.com), and the rideshare apps generally",
        required: false,
        helpText:
          "We'll audit their sites to identify positioning gaps and ranking opportunities.",
      },
      {
        id: "brands_admired",
        label:
          "Three brands from any industry whose voice or design you admire, and why.",
        type: "textarea",
        placeholder:
          "e.g. Aesop — confident, restrained, premium without being stuffy. Equinox — bold, aspirational. JetBlue — friendly but professional.",
        required: false,
        helpText:
          "Tone reference. Cross-industry examples often tell us more about voice than direct adjectives ever do.",
      },
    ],
  },

  // ── 12. ASSETS ────────────────────────────────────────────────────
  {
    title: "Assets",
    description:
      "Tell us what visual and proof assets you already have so we know what to build around — and what may need to be sourced or created.",
    questions: [
      {
        id: "professional_photos",
        label:
          "Do you have professional photos of your fleet, team, or facility?",
        type: "radio",
        options: [
          "Yes — full library of professional photos",
          "Some, but we'll likely need more",
          "No — we'll need to commission them or use stock for now",
        ],
        required: true,
        helpText:
          "Professional photos are essential for premium positioning. If you don't have them, we can recommend photographers in your area.",
      },
      {
        id: "video_content",
        label: "Do you have video content, or are you open to creating it?",
        type: "radio",
        options: [
          "Yes — we have a YouTube channel and existing videos",
          "We have some videos but no YouTube channel yet",
          "No videos yet, but we're open to creating them",
          "Not interested in video content right now",
        ],
        required: true,
        helpText:
          "YouTube content is increasingly important for AI search (Gemini in particular, since Google owns YouTube). Even short fleet walkthroughs or chauffeur introductions move the needle.",
      },
      {
        id: "testimonials_with_permission",
        label:
          "Share 3–5 specific testimonials we can publish on the site (with customer first name and city if you have permission).",
        type: "textarea",
        placeholder:
          '"Got me to PHX at 5am without a hitch — driver was waiting before I came out of the house." — Marcus T., Scottsdale\n\n"Booked them for our wedding shuttle and our guests still talk about how smooth it was." — Jennifer R., Paradise Valley',
        required: false,
        helpText:
          "Real testimonials with attribution outperform generic 5-star reviews — both for human visitors and for AI search engines. Make sure you have permission to publish names.",
      },
    ],
  },

  // ── 13. GOALS & TIMELINE ──────────────────────────────────────────
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

// Stages where the questionnaire is locked for client edits — the build is
// underway, so the answers are frozen as build inputs. Both the questionnaire
// page (UI state) and saveQuestionnaire (server enforcement) read this list.
// Want clients to be able to edit for longer? Remove stages from here.
export const QUESTIONNAIRE_LOCKED_STAGES: string[] = [
  "ASSETS_PENDING",
  "ASSETS_UPLOADED",
  "DESIGN_SELECTION",
  "DESIGN_REVIEW",
  "SITE_LIVE",
];
