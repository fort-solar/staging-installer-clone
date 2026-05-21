export type ApiErrorResponse = {
  success: false;
  error?: string;
  message?: string;
};

export type ApiSuccessResponse = {
  success: true;
  message?: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiDataResponse<T> = ApiSuccessResponse & {
  data: T;
};

export type ApiCollectionResponse<T> = ApiSuccessResponse & {
  data: T[];
  pagination?: PaginationMeta;
};

export type PortalRole = "customer" | "installer";
export type UserRole = PortalRole | "admin";

export type AuthSession = {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  adminRole?: string | null;
  signedInAt: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  role: UserRole;
  adminRole?: string | null;
  status: string;
  avatar_url: string | null;
  emailVerified: boolean;
  createdAt: string;
};

export type LoginApiResponse = ApiSuccessResponse & {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  session: AuthSession;
  user: AuthUser;
};

export type RefreshTokenApiResponse = ApiSuccessResponse & {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  session: AuthSession;
  user: AuthUser;
};

export type RegisterApiResponse = LoginApiResponse;
export type LogoutApiResponse = ApiSuccessResponse;

export type VerifyEmailRequestApiResponse = ApiSuccessResponse;

export type VerifyEmailApiResponse = ApiSuccessResponse & {
  email: string;
};

export type AuthMeApiResponse = ApiSuccessResponse & {
  session: AuthSession;
  user: AuthUser;
};

export type SessionSnapshot = {
  portal: PortalRole;
  session: AuthSession;
  user: Pick<AuthUser, "id" | "email" | "name" | "fullName" | "role" | "adminRole" | "avatar_url" | "status" | "phone" | "address" | "emailVerified">;
  expiresAt: string | null;
};

export type NotificationRecord = {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type NotificationListApiResponse = ApiCollectionResponse<NotificationRecord>;

export type NotificationSocketConfigApiResponse = ApiSuccessResponse & {
  channel: "socket.io";
  socketPath: string;
  message: string;
  defaultEventNames: string[];
};

export type InstallerJobRecord = {
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

export type InstallerJobListApiResponse = ApiCollectionResponse<InstallerJobRecord>;
export type InstallerJobDetailApiResponse = ApiDataResponse<InstallerJobRecord>;

export type InstallerJobState = {
  appliedJobIds: string[];
  savedJobIds: string[];
};

export type InstallerJobStateApiResponse = ApiDataResponse<InstallerJobState>;

export type ApplyToInstallerJobPayload = {
  jobId: string;
  proposal: string;
  proposedBudget: number;
};

export type SaveInstallerJobPayload = {
  jobId: string;
};

export type StartInstallerJobPayload = {
  jobId: string;
};

export type ReportInstallerJobIssuePayload = {
  jobId: string;
  description: string;
  metadata?: Record<string, unknown>;
};

export type InstallerOnboardingProfile = {
  name: string;
  primaryLocation: string;
  yearsOfExperience: string;
  specializations: string[];
  notifyOnNewJobs: boolean;
};

export type InstallerOnboardingVerification = {
  idFileName: string;
  certificateFileName: string;
  idUploadId?: string;
  certificateUploadId?: string;
};

export type InstallerOnboardingState = {
  completed: boolean;
  profile: Record<string, unknown>;
  verification: Record<string, unknown>;
  serviceAreas: string[];
};

export type InstallerOnboardingApiResponse = ApiDataResponse<InstallerOnboardingState>;

export type SubmitInstallerOnboardingPayload = {
  profile: InstallerOnboardingProfile;
  verification: InstallerOnboardingVerification;
  serviceAreas: string[];
};

export type InstallerProfileRecord = {
  id: string;
  userId: string;
  email: string;
  location: string;
  primaryLocation: string;
  experienceLevel: string;
  experienceYears: number;
  additionalInfo: string;
  skills: string[];
  specializations: string[];
  serviceAreas: string[];
  completedInstallations: number;
  rating: number;
  tier: string;
  notifyOnNewJobs: boolean;
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
};

export type InstallerProfileApiResponse = ApiDataResponse<InstallerProfileRecord> & {
  message?: string;
};

export type UpdateInstallerProfilePayload = {
  email?: string;
  location?: string;
  experienceLevel?: string;
  additionalInfo?: string;
  skills?: string[];
  completedInstallations?: number;
  rating?: number;
  tier?: string;
};

export type InstallerProjectStatus = "Scheduled" | "In Progress" | "Completed" | string;

export type InstallerProjectRecord = {
  id: string;
  title: string;
  location: string;
  summary: string;
  budget: string;
  startMeta: string;
  status: InstallerProjectStatus;
  tags: string[];
};

export type InstallerProjectListApiResponse = ApiCollectionResponse<InstallerProjectRecord>;

export type InstallerPaymentMethodRecord = {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
};

export type InstallerPaymentMethodListApiResponse = ApiDataResponse<
  InstallerPaymentMethodRecord[]
>;

export type CreateInstallerPaymentMethodPayload = {
  accountName: string;
  accountNumber: string;
  bankName: string;
};

export type InstallerPayoutStatus = "Pending" | "Approved" | "Declined" | string;

export type InstallerPayoutRecord = {
  id: string;
  referenceId: string;
  amount: string;
  date: string;
  status: InstallerPayoutStatus;
};

export type InstallerPayoutListApiResponse = ApiCollectionResponse<InstallerPayoutRecord>;

export type AuthAccessTokenApiResponse = ApiSuccessResponse & {
  accessToken: string;
};

export type ClientAuthState = {
  session: Pick<AuthSession, "userId" | "email" | "fullName" | "role" | "signedInAt">;
  user: Pick<AuthUser, "id" | "email" | "fullName" | "name" | "phone" | "address" | "role" | "status" | "emailVerified">;
  portal: PortalRole;
  expiresAt: string | null;
};

export type FetchResponseType<T = unknown> = Promise<{ data?: T; error?: string }>;

export type FormProps = {
  endpoint: string;
  method?: string;
  values: unknown;
};

export type PendingEndpointSubmission = {
  id: string;
  action: string;
  endpoint: string;
  method: string;
  values: Record<string, unknown>;
  createdAt: string;
  portal: PortalRole;
  notes?: string;
};
