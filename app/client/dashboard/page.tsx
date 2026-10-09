"use client";

import { Suspense } from "react";
import Link from "next/link";
import {
  DashboardShell,
  EmailBanner,
  LoadingScreen,
  SidebarStats,
  type TabDef,
  type TabGroup,
} from "@/components/dashboard/DashboardShell";
import { VerificationTab } from "@/components/dashboard/VerificationTab";
import { VerificationBadge } from "@/components/dashboard/ui";
import { signOut, useDashboardData, useTabParam } from "@/components/dashboard/useDashboardData";
import { CLIENT_TYPE_LABEL } from "@/lib/enums";
import { OverviewTab } from "@/components/client/OverviewTab";
import { PostProjectTab } from "@/components/client/PostProjectTab";
import { ProjectsTab } from "@/components/client/ProjectsTab";
import { ApplicationsTab } from "@/components/client/ApplicationsTab";
import { SubmissionsTab } from "@/components/client/SubmissionsTab";
import { CertificatesTab } from "@/components/client/CertificatesTab";
import { ProfileTab } from "@/components/client/ProfileTab";
import { BillingTab } from "@/components/client/BillingTab";

const TAB_IDS = [
  "overview",
  "post-project",
  "projects",
  "applications",
  "submissions",
  "certificates",
  "verification",
  "billing",
  "profile",
] as const;
export type ClientTab = (typeof TAB_IDS)[number];

function ClientDashboard() {
  const { data, loading, error, refresh } = useDashboardData();
  const [tab, setTab] = useTabParam<ClientTab>(TAB_IDS, "overview");

  if (loading) return <LoadingScreen text="Loading your client workspace…" />;
  if (error || !data) return <LoadingScreen text={error ?? "Unable to load client workspace data."} />;

  const { profile, projects, applications, submissions, certificates } = data;
  const pendingApps = applications.filter(a => a.status === "PENDING" || a.status === "SHORTLISTED").length;
  const reviewQueue = submissions.filter(s => s.status === "SUBMITTED").length;
  const activeProjects = projects.filter(p => p.status === "ACTIVE").length;

  const tabs: TabDef<ClientTab>[] = [
    { id: "overview", label: "Overview", icon: "🏠" },
    { id: "post-project", label: "Post a Project", icon: "➕" },
    { id: "projects", label: "My Projects", icon: "🚀", badge: activeProjects },
    { id: "applications", label: "Applications", icon: "📋", badge: pendingApps },
    { id: "submissions", label: "Review Submissions", icon: "📤", badge: reviewQueue, badgeColor: "#E53E3E" },
    { id: "certificates", label: "Issued Certificates", icon: "🏅", badge: certificates.length > 0 ? certificates.length : undefined },
    {
      id: "verification",
      label: "Verification",
      icon: "🪪",
      badge: profile.verificationStatus === "VERIFIED" ? 0 : 1,
      badgeColor: profile.verificationStatus === "PENDING_REVIEW" ? "#97640E" : "#E53E3E",
    },
    { id: "billing", label: "Billing & Plan", icon: "💳" },
    { id: "profile", label: "Edit Profile", icon: "✏️" },
  ];

  const tabGroups: TabGroup<ClientTab>[] = [
    {
      label: "Projects & Pipeline",
      tabIds: ["overview", "post-project", "projects", "applications"],
    },
    {
      label: "Review & Credentials",
      tabIds: ["submissions", "certificates"],
    },
    {
      label: "Organization & Billing",
      tabIds: ["verification", "billing", "profile"],
    },
  ];

  return (
    <DashboardShell
      navId="client-dashboard-navigation"
      workspaceLabel="Client Workspace"
      workspaceBadge={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: "linear-gradient(135deg, rgba(49,130,206,0.25) 0%, rgba(49,130,206,0.1) 100%)",
              color: "#90CDF4",
              padding: "4px 12px",
              borderRadius: 20,
              border: "1px solid rgba(49,130,206,0.4)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 0 12px rgba(49,130,206,0.15)",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#3182CE",
                display: "inline-block",
                boxShadow: "0 0 8px #3182CE",
              }}
            />
            💼 Client Hub
          </span>
        </div>
      }
      userName={profile.name}
      userSubline={profile.clientType ? CLIENT_TYPE_LABEL[profile.clientType] : profile.email}
      userBadge={<VerificationBadge status={profile.verificationStatus} />}
      userAvatarUrl={profile.avatarUrl}
      tabs={tabs}
      tabGroups={tabGroups}
      activeTab={tab}
      onTabChange={setTab}
      onSignOut={signOut}
      searchPlaceholder="Search projects, applicants, or talent…"
      onSearchClick={() => setTab("projects")}
      bottomNavTabs={["overview", "post-project", "projects", "applications", "submissions"]}
      banner={<EmailBanner email={profile.email} verified={!!profile.emailVerifiedAt} onVerify={() => setTab("verification")} />}
      headerActions={
        <>
          <button
            onClick={() => setTab("post-project")}
            style={{
              marginLeft: 8,
              padding: "7px 16px",
              background: "linear-gradient(135deg, var(--gold) 0%, #E2B93B 100%)",
              color: "var(--navy)",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 8px rgba(201,162,39,0.3)",
              transition: "transform 0.15s",
            }}
          >
            <span>➕</span> Post Project
          </button>
          <Link
            href={`/clients/${profile.id}`}
            target="_blank"
            style={{
              padding: "7px 14px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "background 0.15s",
            }}
          >
            <span>🏢</span> Client Page ↗
          </Link>
        </>
      }
      sidebarExtra={
        <SidebarStats
          title="Pipeline Overview"
          rows={[
            { label: "Active Listings", value: activeProjects, color: "var(--navy)" },
            { label: "Total Applications", value: applications.length, color: "#2B6CB0" },
            { label: "Pending Reviews", value: reviewQueue, color: reviewQueue > 0 ? "#E53E3E" : "var(--ink-subtle)" },
            { label: "Issued Certificates", value: certificates.length, color: "var(--success)" },
          ]}
        />
      }
    >
      {tab === "overview" && <OverviewTab data={data} goTo={setTab} onChanged={refresh} />}
      {tab === "post-project" && (
        <PostProjectTab
          clientName={profile.name}
          verified={profile.verificationStatus === "VERIFIED"}
          billing={data.entitlement ?? undefined}
          onCreated={() => {
            void refresh();
            setTab("projects");
          }}
        />
      )}
      {tab === "projects" && (
        <ProjectsTab
          projects={projects}
          applications={applications}
          goTo={setTab}
          onChanged={refresh}
          verified={profile.verificationStatus === "VERIFIED"}
          features={data.entitlement?.features}
        />
      )}
      {tab === "applications" && (
        <ApplicationsTab
          applications={applications}
          projects={projects}
          onChanged={refresh}
          filtersEnabled={!!data.entitlement?.features.applicantFilters}
          goTo={setTab}
        />
      )}
      {tab === "submissions" && <SubmissionsTab submissions={submissions} onChanged={refresh} />}
      {tab === "certificates" && <CertificatesTab certificates={certificates} onChanged={refresh} />}
      {tab === "verification" && <VerificationTab profile={profile} onChanged={refresh} />}
      {tab === "billing" && <BillingTab onChanged={refresh} />}
      {tab === "profile" && <ProfileTab profile={profile} onSaved={refresh} />}
    </DashboardShell>
  );
}

export default function ClientDashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen text="Loading your client workspace…" />}>
      <ClientDashboard />
    </Suspense>
  );
}
