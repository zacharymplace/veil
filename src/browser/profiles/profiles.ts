export type SessionProfile =
  | "temporary"
  | "research"
  | "shopping"
  | "medical"
  | "financial"
  | "adult";

export type ProfilePolicy = {
  id: SessionProfile;
  label: string;
  historyEnabled: boolean;
  cookiesPersist: boolean;
  cachePersist: boolean;
  downloadsEnabled: boolean;
  permissionDefault: "block" | "prompt";
};

export const PROFILE_POLICIES: Record<SessionProfile, ProfilePolicy> = {
  temporary: {
    id: "temporary",
    label: "Temporary",
    historyEnabled: false,
    cookiesPersist: false,
    cachePersist: false,
    downloadsEnabled: false,
    permissionDefault: "prompt",
  },
  research: {
    id: "research",
    label: "Research",
    historyEnabled: true,
    cookiesPersist: false,
    cachePersist: false,
    downloadsEnabled: false,
    permissionDefault: "prompt",
  },
  shopping: {
    id: "shopping",
    label: "Shopping",
    historyEnabled: true,
    cookiesPersist: true,
    cachePersist: false,
    downloadsEnabled: false,
    permissionDefault: "prompt",
  },
  medical: {
    id: "medical",
    label: "Medical",
    historyEnabled: true,
    cookiesPersist: false,
    cachePersist: false,
    downloadsEnabled: false,
    permissionDefault: "prompt",
  },
  financial: {
    id: "financial",
    label: "Financial",
    historyEnabled: true,
    cookiesPersist: false,
    cachePersist: false,
    downloadsEnabled: false,
    permissionDefault: "prompt",
  },
  adult: {
    id: "adult",
    label: "Adult",
    historyEnabled: false,
    cookiesPersist: false,
    cachePersist: false,
    downloadsEnabled: false,
    permissionDefault: "prompt",
  },
};

export const PROFILE_ORDER: SessionProfile[] = [
  "temporary",
  "research",
  "shopping",
  "medical",
  "financial",
  "adult",
];

export function profileLabel(profile: SessionProfile): string {
  return PROFILE_POLICIES[profile].label;
}
