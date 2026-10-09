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
import { OverviewTab, profileCompletion } from "@/components/talent/OverviewTab";
import { ProjectsTab } from "@/components/talent/ProjectsTab";
import { ApplicationsTab } from "@/components/talent/ApplicationsTab";
import { SubmissionsTab } from "@/components/talent/SubmissionsTab";
import { CertificatesTab } from "@/components/talent/CertificatesTab";
import { ProfileTab } from "@/components/talent/ProfileTab";
import { TeamsTab } from "@/components/talent/TeamsTab";
import { BillingTab } from "@/components/client/BillingTab";

const TAB_IDS = [
  "overview",
  "projects",
  "teams",
  "applications",
  "submissions",
  "certificates",
  "billing",
  "verification",
  "profile",
] as const;
export type TalentTab = (typeof TAB_IDS)[number];

function TalentDashboard() {
  const { data, loading, error, refresh } = useDashboardData();
  const [tab, setTab] = useTabParam<TalentTab>(TAB_IDS, "overview");

  if (loading) return <LoadingScreen text="Loading your talent workspace…" />;
  if (error || !data) return <LoadingScreen text={error ?? "Unable to load dashboard data."} />;

  const { profile, projects, applications, submissions, certificates } = data;
  const teams = data.teams ?? [];
  const pendingInvites = teams.filter(t => t.members.some(m => m.user.id === profile.id && m.status === "INVITED")).length;
  const selected = applications.filter(a => a.status === "SELECTED");
  const needsSubmission = selected.filter(a => !submissions.some(s => s.teamId === a.teamId && s.status !== "REJECTED")).length;
  const totalCertificates = certificates.length + (data.certificateHolds?.length ?? 0);
  const { pct } = profileCompletion(profile);

  const tabs: TabDef<TalentTab>[] = [
    { id: "overview", label: "Overview", icon: "🏠" },
    { id: "projects", label: "Find Projects", icon: "🔎", badge: projects.length },
    { id: "teams", label: "My Teams", icon: "👥", badge: pendingInvites, badgeColor: "#97640E" },
    { id: "applications", label: "My Applications", icon: "📋", badge: applications.length > 0 ? applications.length : undefined },
    { id: "submissions", label: "My Submissions", icon: "📤", badge: needsSubmission, badgeColor: "#E53E3E" },
    {
      id: "certificates",
      label: "My Certificates",
      icon: "🏅",
      badge: totalCertificates,
      badgeColor: (data.certificateHolds?.length ?? 0) > 0 ? "#97640E" : "var(--success)",
    },
    { id: "billing", label: "Premium Plan", icon: "💳" },
    {
      id: "verification",
      label: "ID Verification",
      icon: "🪪",
      badge: profile.verificationStatus === "VERIFIED" ? 0 : 1,
      badgeColor: profile.verificationStatus === "PENDING_REVIEW" ? "#97640E" : "#E53E3E",
    },
    { id: "profile", label: "Edit Profile", icon: "✏️" },
  ];

  const tabGroups: TabGroup<TalentTab>[] = [
    {
      label: "Discover & Collaborate",
      tabIds: ["overview", "projects", "teams"],
    },
    {
      label: "Work & Deliverables",
      tabIds: ["applications", "submissions", "certificates"],
    },
    {
      label: "Account & Settings",
      tabIds: ["billing", "verification", "profile"],
    },
  ];

  return (
    <DashboardShell
      navId="talent-dashboard-navigation"
      workspaceLabel="Talent Workspace"
      workspaceBadge={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: "linear-gradient(135deg, rgba(201,162,39,0.25) 0%, rgba(201,162,39,0.1) 100%)",
              color: "var(--gold-light)",
              padding: "4px 12px",
              borderRadius: 20,
              border: "1px solid rgba(201,162,39,0.4)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 0 12px rgba(201,162,39,0.15)",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--success)",
                display: "inline-block",
                boxShadow: "0 0 8px var(--success)",
              }}
            />
            ⚡ Talent Hub
          </span>
        </div>
      }
      userName={profile.name}
      userSubline={profile.universityName ? `${profile.universityName}` : profile.degreeProgram ?? profile.email}
      userBadge={<VerificationBadge status={profile.verificationStatus} />}
      userAvatarUrl={profile.avatarUrl}
      profileCompleteness={pct}
      tabs={tabs}
      tabGroups={tabGroups}
      activeTab={tab}
      onTabChange={setTab}
      onSignOut={signOut}
      searchPlaceholder="Search projects, skills, or clients…"
      onSearchClick={() => setTab("projects")}
      bottomNavTabs={["overview", "projects", "teams", "submissions", "certificates"]}
      banner={<EmailBanner email={profile.email} verified={!!profile.emailVerifiedAt} onVerify={() => setTab("verification")} />}
      headerActions={
        <>
          <button
            onClick={() => setTab("projects")}
            style={{
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
            <span>🔎</span> Find Projects
          </button>
          <Link
            href={`/talents/${profile.id}`}
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
            <span>👤</span> Portfolio ↗
          </Link>
        </>
      }
      sidebarExtra={
        <SidebarStats
          title="Talent Overview"
          rows={[
            { label: "Active Applications", value: applications.length, color: "#2B6CB0" },
            { label: "Selected Projects", value: selected.length, color: selected.length > 0 ? "#B7791F" : "var(--ink-muted)" },
            { label: "Ready to Submit", value: needsSubmission, color: needsSubmission > 0 ? "#E53E3E" : "var(--ink-subtle)" },
            { label: "Verified Certificates", value: certificates.length, color: "var(--success)" },
          ]}
        />
      }
    >
      {tab === "overview" && <OverviewTab data={data} goTo={setTab} />}
      {tab === "projects" && (
        <ProjectsTab
          projects={projects}
          applications={applications}
          submissions={submissions}
          teams={teams}
          onChanged={refresh}
          goTo={setTab}
        />
      )}
      {tab === "teams" && <TeamsTab teams={teams} meId={profile.id} onChanged={refresh} goTo={setTab} />}
      {tab === "applications" && <ApplicationsTab applications={applications} onChanged={refresh} goTo={setTab} />}
      {tab === "submissions" && <SubmissionsTab applications={applications} submissions={submissions} onChanged={refresh} />}
      {tab === "certificates" && (
        <CertificatesTab
          certificates={certificates}
          holds={data.certificateHolds ?? []}
          talentId={profile.id}
          goTo={setTab}
        />
      )}
      {tab === "billing" && <BillingTab onChanged={refresh} audience="talent" />}
      {tab === "verification" && <VerificationTab profile={profile} onChanged={refresh} />}
      {tab === "profile" && <ProfileTab profile={profile} onSaved={refresh} />}
    </DashboardShell>
  );
}

export default function TalentDashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen text="Loading your talent workspace…" />}>
      <TalentDashboard />
    </Suspense>
  );
}
