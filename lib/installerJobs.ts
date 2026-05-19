export type InstallerJob = {
  id: string;
  title: string;
  city: string;
  state: string;
  distanceKm: number;
  budgetLabel: string;
  postedAgo: string;
  jobType: string;
  systemSize: string;
  duration: string;
  startDateLabel: string;
  tags: string[];
  summary: string;
  description: string;
  scope: string[];
  requirements: string[];
  components: string[];
  siteConditions: string[];
};

export const installerJobs: InstallerJob[] = [
  {
    id: "job-5kva-hybrid-001",
    title: "5kVA Hybrid Inverter System Installation",
    city: "Lekki Phase 1",
    state: "Lagos",
    distanceKm: 15,
    budgetLabel: "₦55,000",
    postedAgo: "Posted 2 Days ago",
    jobType: "Full Installation (Commercial)",
    systemSize: "5kVA / 48V",
    duration: "2 Days",
    startDateLabel: "Nov 20th, 2025",
    tags: ["New Installation", "Standard", "6-8 Hrs"],
    summary:
      "Tier 2 verified installer needed for a complete hybrid solar installation at a residential duplex.",
    description:
      "We are looking for a Tier 2 Verified Installer to handle a complete hybrid solar installation for a residential duplex. All equipment has been delivered to the site. You will be working with a site assistant provided by the client.",
    scope: [
      "Inverter: Installation of 1x 5kVA Hybrid Inverter (Wall-mounted).",
      "Panels: Mounting and wiring of 8x 400W Monocrystalline Panels (Roof mount -standard corrugated sheet).",
      "Batteries: Connection of 2x 200Ah Lithium Ion batteries (Rack setup).",
      "Cabling: AC/DC separation, trunking, and earthing (approx. 15m cable run).",
      "Commissioning: System startup, configuration, and client handover demo.",
    ],
    requirements: [
      "Must possess valid FortSolar Installer ID.",
      "Must have own installation toolkit (Drill, Ladder, Crimping Tool, Multimeter).",
      "Standard PPE (Safety boots, helmet) required on site.",
      "Ability to configure Cliff's Inverter settings is a plus.",
    ],
    components: [
      "600W Jwinco Solar Panels (4 units) 2.4kW",
      "Lithium Battery 10kWh",
      "Hybrid Inverter (Name Of Brand) 5kVA",
      "DC Cables 10mm",
      "MC4 Connectors",
      "DC Isolator Switch",
      "DC Combiner Box (with fuses & surge protection)",
    ],
    siteConditions: [
      "Building Type: 2-Storey Duplex.",
      "Roof Access: External ladder required (Installer to provide or request).",
      "Grid Connection: Integration with existing changeover switch required.",
    ],
  },
  {
    id: "job-3kva-aa1-002",
    title: "3kVA Solar/ Inverter AA1 Installation",
    city: "Ajip",
    state: "Port Harcourt",
    distanceKm: 8,
    budgetLabel: "₦71,240",
    postedAgo: "Posted 2 Days ago",
    jobType: "Standard Installation",
    systemSize: "3kVA / 24V",
    duration: "6-8 Hrs",
    startDateLabel: "Dec 1st, 2025",
    tags: ["New Installation", "Standard", "6-8 Hrs"],
    summary:
      "Install a complete 3kVA residential setup with battery backup and commissioning today at your home.",
    description:
      "We are looking for an installer to execute a complete 3kVA residential system with clean wiring, inverter setup, and customer handover.",
    scope: [
      "Install inverter and battery bank.",
      "Panel mounting and cable routing.",
      "AC output integration and safety checks.",
    ],
    requirements: [
      "Verified installer profile.",
      "Basic PPE and test equipment.",
    ],
    components: [
      "Solar panels",
      "Hybrid inverter",
      "Battery rack",
      "Protection accessories",
    ],
    siteConditions: [
      "Single-storey building.",
      "Easy roof access.",
      "No civil work needed.",
    ],
  },
];
