import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/** GET /api/talents/[id] — public talent profile (by id only) with verified certificates. */
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const talent = await prisma.user.findFirst({
      where: { id, role: "TALENT", suspendedAt: null },
      select: {
        id: true,
        name: true,
        verificationStatus: true,
        avatarUrl: true,
        bio: true,
        location: true,
        universityName: true,
        degreeProgram: true,
        currentSemester: true,
        skills: true,
        portfolioUrl: true,
        resumeUrl: true,
        linkedinUrl: true,
        createdAt: true,
        _count: { select: { certificatesEarned: true, teamMemberships: true } },
        certificatesEarned: {
          where: { status: "VERIFIED" },
          select: {
            id: true, certId: true, title: true, issuerName: true, issuerType: true, skills: true, issuedAt: true,
            project: { select: { id: true, title: true, category: true } },
          },
          orderBy: { issuedAt: "desc" },
        },
      },
    });
    if (!talent) return NextResponse.json({ error: "Talent not found" }, { status: 404 });
    return NextResponse.json({ talent });
  } catch (error) {
    console.error("Talent detail error:", error);
    return NextResponse.json({ error: "Failed to fetch talent" }, { status: 500 });
  }
}
