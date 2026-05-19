// Like I said Utitofon, this dummy won't show you all data we are tracking, I just did this to handle my design. We are tracking more than this steps for a lot of things here.

export type UserRole = "customer" | "installer";

export type MockUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  role: UserRole;
  createdAt: string;
};

export type MockSession = {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  signedInAt: string;
};

export type PackageIncludeItem = {
  label: string;
  qty: string;
};

export type PackageDummy = {
  id: number;
  title: string;
  mini_description: string;
  image: string;
  price: number;
  category: string;
  packageType: string;
  powerRating: string;
  features: string[];
  availability: string;
  warrantyYears: number;
  createdAt: string;
  rating: number;
  reviewsCount: number;
  overview: string;
  packageIncludes: PackageIncludeItem[];
  systemDetails: string[];
  powers: string[];
};

export type ProductQuickSpec = {
  label: string;
  value: string;
};

export type ProductDummy = {
  id: number;
  title: string;
  mini_description: string;
  image: string;
  images: string[];
  price: number;
  priceOriginal: number;
  category: string;
  productType: string;
  powerRating: string;
  features: string[];
  availability: string;
  warrantyYears: number;
  createdAt: string;
  section: string;
  rating: number;
  reviewsCount: number;
  description: string;
  quickSpecs: ProductQuickSpec[];
};

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

export type InstallerJobState = {
  appliedJobIds: string[];
  savedJobIds: string[];
};

export type InstallerOnboardingData = {
  currentStep: 1 | 2 | 3;
  completed: boolean;
  profile: {
    name: string;
    primaryLocation: string;
    yearsOfExperience: string;
    specializations: string[];
    notifyOnNewJobs: boolean;
  };
  verification: {
    idFileName: string;
    certificateFileName: string;
  };
  serviceAreas: string[];
  updatedAt: string;
};

export type InstallerProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  location: string;
  experienceLevel: string;
  additionalInfo: string;
  skills: string[];
  completedInstallations: number;
  rating: number;
  tier: string;
};

export type PaymentMethod = {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
};

export type PayoutStatus = "Pending" | "Approved" | "Declined";

export type PayoutHistoryRow = {
  id: string;
  referenceId: string;
  amount: string;
  date: string;
  status: PayoutStatus;
};

export type ProjectStatus = "Scheduled" | "In Progress" | "Completed";

export type InstallerProject = {
  id: string;
  title: string;
  location: string;
  summary: string;
  budget: string;
  startMeta: string;
  status: ProjectStatus;
  tags: string[];
};

export type CustomerProfile = {
  fullName: string;
  roleLabel: string;
  phone: string;
  email: string;
  location: string;
  address: string;
};

export type CustomerSummaryMetrics = {
  packageRequests: number;
  completedInstallations: number;
};

export type CustomerOrderSummaryCard = {
  id: number;
  label: string;
  value: string;
  iconKey?: string;
};

export type CustomerOrderRow = {
  id: number;
  type: "ORDER" | "QUOTE";
  orderId: string;
  date: string;
  status: string;
  qty: string;
  unitPrice: string;
  totalAmount: string;
};

export type PackageRequestStatus =
  | "Pending"
  | "Contacted"
  | "Approved"
  | "Packed"
  | "In-Transit"
  | "Delivered";

export type PackageRequestRow = {
  id: number;
  requestId: string;
  packageName: string;
  date: string;
  financing: "Yes" | "No";
  status: PackageRequestStatus;
};

export type CustomerQuoteEnergySummary = {
  totalLoad: string;
  totalWattHoursPerDay: string;
  dailyUsage: string;
  monthlyUsage: string;
};

export type CustomerQuote = {
  id: string;
  createdAt: string;
  status: string;
  energySummary: CustomerQuoteEnergySummary;
  appliances: string[];
};

export type InstallationSummaryCard = {
  id: number;
  label: string;
  value: string;
  tone: string;
};

export type InstallationStatus =
  | "Completed"
  | "In Progress"
  | "Scheduled"
  | "Ongoing";

export type InstallationProgress = {
  percent: number;
  label: string;
};

export type InstallationRecord = {
  id: string;
  packageName: string;
  jobId: string;
  installedAt: string;
  installerName: string;
  status: InstallationStatus;
  paymentStatus: string;
  totalCost: string;
  proofOfWorkImageUrls: string[];
  progress?: InstallationProgress;
};

export type ContactMethod = "Phone Call" | "WhatsApp" | "Email" | "Office Visit";

export type QuoteProduct = {
  id: number;
  title: string;
  image: string;
  price: number;
  quantity?: number;
};

export type QuoteFormState = {
  quantity: number;
  projectType: string;
  installationTimeline: string;
  buildingType: string;
  location: string;
  installationAddress: string;
  fullName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  preferredContactMethod: ContactMethod;
  additionalInfo: string;
  agreeToTerms: boolean;
  requestInstallation: boolean;
};

export type StoredQuoteRequest = QuoteFormState & {
  createdAt: string;
  product: QuoteProduct;
  products: QuoteProduct[];
};

export type ProductSection =
  | "All Products"
  | "New Releases"
  | "Panels"
  | "Batteries"
  | "Inverters"
  | "Accessories";

export type ProductType =
  | "All"
  | "Solar Panel"
  | "Inverter"
  | "Batteries"
  | "Streetlights/ floodlights"
  | "Solar CCTV"
  | "Solar Appliances"
  | "Charge Controllers";

export type PackageType = "All" | "Home" | "SME" | "Campus" | "Office";

export type PowerRatingProduct = "1kVA - 5kVA" | "6kVA - 10kVA" | "10kVA+";

export type PowerRatingPackage =
  | "1kVA - 2kVA"
  | "3kVA - 5kVA"
  | "6kVA - 10kVA"
  | "10kVA+";

export type SortOption =
  | "Newest"
  | "Price: Low to High"
  | "Price: High to Low"
  | "Warranty: High to Low"
  | "Name: A-Z";
