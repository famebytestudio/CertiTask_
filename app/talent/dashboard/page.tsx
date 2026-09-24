"use client";

import { Suspense } from "react";
import { DashboardShell, EmailBanner, LoadingScreen, SidebarStats, type TabDef } from "@/components/dashboard/DashboardShell";
import { VerificationTab } from "@/components/dashboard/VerificationTab";
import { VerificationBadge } from "@/components/dashboard/ui";
import { signOut, useDashboardData, useTabParam } from "@/components/dashboard/useDashboardData";
import { OverviewTab } from "@/components/talent/OverviewTab";
import { ProjectsTab } from "@/components/talent/ProjectsTab";
import { ApplicationsTab } from "@/components/talent/ApplicationsTab";
import { SubmissionsTab } from "@/components/talent/SubmissionsTab";
import { CertificatesTab } from "@/components/talent/CertificatesTab";
import { ProfileTab } from "@/components/talent/ProfileTab";
import { TeamsTab } from "@/components/talent/TeamsTab";
import { BillingTab } from "@/components/client/BillingTab";

const TAB_IDS = ["overview", "projects", "teams", "applications", "submissions", "certificates", "billing", "verification", "profile"] as const;
export type TalentTab = (typeof TAB_IDS)[number];

function TalentDashboard() {
  const { data, loading, error, refresh } = useDashboardData();
  const [tab, setTab] = useTabParam<TalentTab>(TAB_IDS, "overview");

  if (loading) return <LoadingScreen text="Loading your dashboard…" />;
  if (error || !data) return <LoadingScreen text={error ?? "Something went wrong."} />;

  const { profile, projects, applications, submissions, certificates } = data;
  const teams = data.teams ?? [];
  const pendingInvites = teams.filter(t => t.members.some(m => m.user.id === profile.id && m.status === "INVITED")).length;
  const selected = applications.filter(a => a.status === "SELECTED");
  const needsSubmission = selected.filter(a => !submissions.some(s => s.teamId === a.teamId && s.status !== "REJECTED")).length;

  const tabs: TabDef<TalentTab>[] = [
    { id: "overview",     label: "Overview",         icon: "🏠" },
    { id: "projects",     label: "Find Projects",    icon: "🔎", badge: projects.length },
    { id: "teams",        label: "My Teams",         icon: "👥", badge: pendingInvites, badgeColor: "#97640E" },
    { id: "applications", label: "My Applications",  icon: "📋" },
    { id: "submissions",  label: "My Submissions",   icon: "📤", badge: needsSubmission, badgeColor: "#E53E3E" },
    { id: "certificates", label: "My Certificates",  icon: "🏅", badge: certificates.length + (data.certificateHolds?.length ?? 0), badgeColor: (data.certificateHolds?.length ?? 0) > 0 ? "#97640E" : "var(--success)" },
    { id: "billing",      label: "Premium Plan",      icon: "💳" },
    { id: "verification", label: "Verification",     icon: "🪪", badge: profile.verificationStatus === "VERIFIED" ? 0 : 1, badgeColor: profile.verificationStatus === "PENDING_REVIEW" ? "#97640E" : "#E53E3E" },
    { id: "profile",      label: "Edit Profile",     icon: "✏️" },
  ];

  return (
    <DashboardShell
      navId="talent-dashboard-navigation"
      workspaceLabel="Talent Workspace"
      userName={profile.name}
      userSubline={profile.email}
      userBadge={<VerificationBadge status={profile.verificationStatus} />}
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
      onSignOut={signOut}
      banner={<EmailBanner email={profile.email} verified={!!profile.emailVerifiedAt} onVerify={() => setTab("verification")} />}
      headerActions={
        <>
          <button onClick={() => setTab("projects")} style={{ marginLeft: 8, padding: "6px 14px", background: "var(--gold)", color: "var(--navy)", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Find projects</button>
          <button onClick={() => setTab("profile")} style={{ padding: "6px 14px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Edit profile</button>
        </>
      }
      sidebarExtra={
        <SidebarStats title="Quick stats" rows={[
          { label: "Applications", value: applications.length },
          { label: "Selected", value: selected.length, color: "#3182CE" },
          { label: "Certificates", value: certificates.length, color: "var(--success)" },
        ]} />
      }
    >
      {tab === "overview"     && <OverviewTab data={data} goTo={setTab} />}
      {tab === "projects"     && <ProjectsTab projects={projects} applications={applications} submissions={submissions} teams={teams} onChanged={refresh} goTo={setTab} />}
      {tab === "teams"        && <TeamsTab teams={teams} meId={profile.id} onChanged={refresh} goTo={setTab} />}
      {tab === "applications" && <ApplicationsTab applications={applications} onChanged={refresh} goTo={setTab} />}
      {tab === "submissions"  && <SubmissionsTab applications={applications} submissions={submissions} onChanged={refresh} />}
      {tab === "certificates" && <CertificatesTab certificates={certificates} holds={data.certificateHolds ?? []} talentId={profile.id} goTo={setTab} />}
      {tab === "billing"      && <BillingTab onChanged={refresh} audience="talent" />}
      {tab === "verification" && <VerificationTab profile={profile} onChanged={refresh} />}
      {tab === "profile"      && <ProfileTab profile={profile} onSaved={refresh} />}
    </DashboardShell>
  );
}

export default function TalentDashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen text="Loading your dashboard…" />}>
      <TalentDashboard />
    </Suspense>
  );
}
