const paths: Record<string, string> = {
  overview: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  projects: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  teams: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M13 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  applications: "M9 3H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-4M9 2h6v4H9ZM8 11h8M8 16h5",
  submissions: "M12 16V3m-5 5 5-5 5 5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5",
  certificates: "M16 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0M9 13l-2 8 5-3 5 3-2-8M19 9a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  billing: "M3 5h18v14H3ZM3 9h18M7 15h3",
  verification: "M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6ZM8 12l3 3 5-5",
  profile: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2",
  post: "M12 5v14M5 12h14",
};
export function WorkspaceIcon({ name }: { name: string }) {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d={paths[name] ?? paths.applications} /></svg>;
}
